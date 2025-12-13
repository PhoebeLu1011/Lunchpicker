# app.py

import os
import datetime
from functools import wraps

from flask import Flask, request, jsonify, g, make_response
from flask_cors import CORS
from pymongo import MongoClient, ReturnDocument
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import random
import math
import requests

app = Flask(__name__)

# ======================
# Env & Config
# ======================

# ---- CORS origins（Local + Render 用 env 控制） ----
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "").strip()
EXTRA_ORIGINS = [o.strip() for o in os.getenv("EXTRA_ORIGINS", "").split(",") if o.strip()]

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if FRONTEND_ORIGIN:
    origins.append(FRONTEND_ORIGIN)
origins.extend(EXTRA_ORIGINS)

CORS(
    app,
    resources={r"/*": {"origins": origins}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type", "Authorization"],
)

# ---- Mongo / JWT ----
MONGO_URI = os.getenv("MONGO_URI")  # Atlas 連線字串
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set. Please configure it in Render Environment Variables.")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_EXPIRES_DAYS = 7

# Render / production 判斷（用於 cookie SameSite/Secure）
IS_PROD = (os.getenv("FLASK_ENV", "").lower() == "production") or bool(os.getenv("RENDER"))

# ======================
# MongoDB
# ======================
client = MongoClient(MONGO_URI)
db = client["lunchpicker"]
users_col = db["users"]
groups_col = db["groups"]
blacklists_col = db["blacklists"]

# ---- 建立唯一索引（只需要執行一次，之後會自動記住） ----
try:
    groups_col.create_index("code", unique=True)
except Exception:
    pass

try:
    blacklists_col.create_index(
        [("userId", 1), ("osmType", 1), ("osmId", 1)],
        unique=True,
    )
except Exception:
    pass

# ======================
# JWT helpers
# ======================

def create_token(user_doc):
    payload = {
        "user_id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXPIRES_DAYS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def get_current_user_from_request():
    token = request.cookies.get("access_token")
    if not token:
        return None

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

    user_id = payload.get("user_id")
    if not user_id:
        return None

    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None
    return user


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({"ok": False, "error": "未登入或 token 無效"}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return wrapper

# ======================
# Group helpers
# ======================

def generate_group_code(length=5):
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choice(chars) for _ in range(length))


def serialize_group(group_doc, detail=False):
    if not group_doc:
        return None

    base = {
        "id": str(group_doc["_id"]),
        "name": group_doc.get("name"),
        "code": group_doc.get("code"),
        "ownerId": str(group_doc.get("ownerId")) if group_doc.get("ownerId") else None,
        "createdAt": group_doc.get("createdAt").isoformat() if group_doc.get("createdAt") else None,
        "closed": group_doc.get("closed", False),
        "votingClosed": group_doc.get("votingClosed", False),
    }

    if not detail:
        members = group_doc.get("members", [])
        base["memberCount"] = len(members)
        return base

    members_out = []
    for m in group_doc.get("members", []):
        raw_status = m.get("status")
        normalized_status = "join" if (not raw_status or raw_status == "unknown") else raw_status

        members_out.append({
            "userId": str(m.get("userId")),
            "displayName": m.get("displayName"),
            "role": m.get("role"),
            "status": normalized_status,
            "joinedAt": m.get("joinedAt").isoformat() if m.get("joinedAt") else None,
        })

    anns_out = []
    for a in group_doc.get("announcements", []):
        anns_out.append({
            "id": str(a.get("_id")),
            "content": a.get("content"),
            "createdAt": a.get("createdAt").isoformat() if a.get("createdAt") else None,
        })

    current_uid = g.current_user["_id"] if getattr(g, "current_user", None) else None

    candidates = group_doc.get("candidates", [])
    total_votes = 0
    for c in candidates:
        total_votes += len(c.get("voters", []) or [])

    cands_out = []
    for c in candidates:
        voters = c.get("voters", []) or []
        vote_count = len(voters)

        has_my_vote = False
        if current_uid is not None:
            has_my_vote = current_uid in voters

        percent = 0
        if total_votes > 0:
            percent = round(vote_count * 100 / total_votes)

        cands_out.append({
            "id": str(c.get("_id")),
            "name": c.get("name"),
            "address": c.get("address"),
            "createdByName": c.get("createdByName"),
            "createdAt": c.get("createdAt").isoformat() if c.get("createdAt") else None,
            "voteCount": vote_count,
            "percent": percent,
            "hasMyVote": has_my_vote,
        })

    base["members"] = members_out
    base["announcements"] = anns_out
    base["candidates"] = cands_out
    base["memberCount"] = len(members_out)

    return base

# ======================
# Overpass / Search
# ======================

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def build_address_from_tags(tags: dict) -> str:
    parts = []
    for key in [
        "addr:city",
        "addr:district",
        "addr:suburb",
        "addr:street",
        "addr:housenumber",
    ]:
        v = tags.get(key)
        if v:
            parts.append(v)
    return " ".join(parts) if parts else tags.get("addr:full") or ""


def normalize_osm_element(elem: dict) -> dict:
    tags = elem.get("tags", {}) or {}
    name = tags.get("name") or "未命名餐廳"

    amenity = (tags.get("amenity") or "").strip().lower()
    if amenity in ("restaurant", "fast_food", "cafe"):
        category = amenity
    else:
        category = "other"

    cuisine = tags.get("cuisine")

    lat = elem.get("lat")
    lon = elem.get("lon")
    center = elem.get("center") or {}
    if lat is None and "lat" in center:
        lat = center["lat"]
    if lon is None and "lon" in center:
        lon = center["lon"]

    address = build_address_from_tags(tags)

    return {
        "osmId": elem["id"],
        "osmType": elem["type"],
        "name": name,
        "address": address,
        "lat": lat,
        "lon": lon,
        "category": category,
        "cuisine": cuisine,
    }


def haversine_distance_m(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def query_overpass_restaurants(lat: float, lon: float, radius: int = 600, cuisine: str = "ALL"):
    try:
        radius = int(radius)
    except Exception:
        radius = 600
    radius = max(100, min(radius, 5000))

    cuisine_filter = ""
    if cuisine and cuisine.lower() != "all":
        safe_cuisine = cuisine.replace('"', "").replace("'", "")
        cuisine_filter = f'["cuisine"~"{safe_cuisine}", i]'

    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"restaurant|fast_food|cafe"]{cuisine_filter}(around:{radius},{lat},{lon});
      way["amenity"~"restaurant|fast_food|cafe"]{cuisine_filter}(around:{radius},{lat},{lon});
      relation["amenity"~"restaurant|fast_food|cafe"]{cuisine_filter}(around:{radius},{lat},{lon});
    );
    out center;
    """

    app.logger.debug("[Overpass] query: %s", query)

    resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data.get("elements", [])

# ======================
# Auth APIs
# ======================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()

    if not email or not password:
        return jsonify({"ok": False, "error": "email 與 password 為必填"}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "error": "密碼至少 6 碼"}), 400

    existing = users_col.find_one({"email": email})
    if existing:
        return jsonify({"ok": False, "error": "此 email 已被註冊"}), 400

    password_hash = generate_password_hash(password)

    user_doc = {
        "email": email,
        "passwordHash": password_hash,
        "name": name or email.split("@")[0],
        "createdAt": datetime.datetime.utcnow(),
        "lastLoginAt": None,
    }

    result = users_col.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_token(user_doc)

    return jsonify({
        "ok": True,
        "token": token,
        "user": {
            "id": str(user_doc["_id"]),
            "email": user_doc["email"],
            "name": user_doc["name"],
            "createdAt": user_doc.get("createdAt").isoformat() if user_doc.get("createdAt") else None,
        }
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"ok": False, "error": "Email 與密碼為必填"}), 400

    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"ok": False, "error": "帳號或密碼錯誤"}), 401

    if not check_password_hash(user["passwordHash"], password):
        return jsonify({"ok": False, "error": "帳號或密碼錯誤"}), 401

    token = create_token(user)

    resp = make_response(jsonify({
        "ok": True,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "createdAt": user.get("createdAt").isoformat() if user.get("createdAt") else None,
        }
    }))

    # ====== Cookie：Local / Render 兼容 ======
    resp.set_cookie(
        "access_token",
        token,
        httponly=True,
        samesite="None" if IS_PROD else "Lax",
        secure=True if IS_PROD else False,
        max_age=JWT_EXPIRES_DAYS * 24 * 60 * 60,
    )

    return resp


@app.route("/api/auth/me", methods=["GET"])
@login_required
def me():
    user = g.current_user
    return jsonify({
        "ok": True,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "createdAt": user.get("createdAt").isoformat() if user.get("createdAt") else None,
        }
    })


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"ok": True}))
    resp.set_cookie(
        "access_token",
        "",
        expires=0,
        samesite="None" if IS_PROD else "Lax",
        secure=True if IS_PROD else False,
    )
    return resp

# ======================
# Profile
# ======================

@app.route("/api/user/profile", methods=["PUT"])
@login_required
def update_profile():
    data = request.get_json() or {}
    nickname = (data.get("nickname") or "").strip()

    users_col.update_one(
        {"_id": g.current_user["_id"]},
        {"$set": {"name": nickname}}
    )

    user = users_col.find_one({"_id": g.current_user["_id"]})

    return jsonify({
        "ok": True,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "createdAt": user.get("createdAt").isoformat() if user.get("createdAt") else None,
        }
    })

# ======================
# Groups APIs
# ======================

@app.route("/api/groups", methods=["POST"])
@login_required
def create_group():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"ok": False, "error": "團隊名稱必填"}), 400

    code = None
    for _ in range(10):
        try_code = generate_group_code()
        exists = groups_col.find_one({"code": try_code})
        if not exists:
            code = try_code
            break

    if not code:
        return jsonify({"ok": False, "error": "無法產生唯一代碼"}), 500

    now = datetime.datetime.utcnow()

    leader_member = {
        "userId": g.current_user["_id"],
        "displayName": g.current_user.get("name") or g.current_user["email"],
        "role": "leader",
        "status": "join",
        "joinedAt": now,
    }

    group_doc = {
        "name": name,
        "code": code,
        "ownerId": g.current_user["_id"],
        "createdAt": now,
        "closed": False,
        "votingClosed": False,
        "members": [leader_member],
        "announcements": [],
        "candidates": [],
    }

    result = groups_col.insert_one(group_doc)
    group_doc["_id"] = result.inserted_id

    return jsonify({
        "ok": True,
        "group": serialize_group(group_doc, detail=True)
    }), 201


@app.route("/api/groups/my", methods=["GET"])
@login_required
def get_my_groups():
    uid = g.current_user["_id"]
    docs = groups_col.find({"members.userId": uid}).sort("createdAt", -1)

    groups = []
    for doc in docs:
        members = doc.get("members", [])
        my_role = None
        for m in members:
            if m.get("userId") == uid:
                my_role = m.get("role")
                break

        groups.append({
            "id": str(doc["_id"]),
            "name": doc.get("name"),
            "code": doc.get("code"),
            "role": my_role,
            "memberCount": len(members),
            "closed": doc.get("closed", False),
            "createdAt": doc.get("createdAt").isoformat() if doc.get("createdAt") else None,
        })

    return jsonify({"ok": True, "groups": groups})


@app.route("/api/groups/<group_id>", methods=["GET"])
@login_required
def get_group_detail(group_id):
    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    group = groups_col.find_one({
        "_id": oid,
        "members.userId": g.current_user["_id"],
    })
    if not group:
        return jsonify({"ok": False, "error": "找不到此團隊或無權限"}), 404

    return jsonify({
        "ok": True,
        "group": serialize_group(group, detail=True)
    })


@app.route("/api/groups/join", methods=["POST"])
@login_required
def join_group_by_code():
    data = request.get_json() or {}
    code = (data.get("code") or "").strip().upper()

    if not code:
        return jsonify({"ok": False, "error": "代碼必填"}), 400

    group = groups_col.find_one({"code": code, "closed": False})
    if not group:
        return jsonify({"ok": False, "error": "找不到此代碼或團隊已關閉"}), 404

    uid = g.current_user["_id"]
    display_name = g.current_user.get("name") or g.current_user["email"]

    members = group.get("members", [])
    exists = any(m.get("userId") == uid for m in members)

    if not exists:
        members.append({
            "userId": uid,
            "displayName": display_name,
            "role": "member",
            "status": "join",
            "joinedAt": datetime.datetime.utcnow(),
        })
        groups_col.update_one({"_id": group["_id"]}, {"$set": {"members": members}})
        group["members"] = members

    return jsonify({
        "ok": True,
        "group": serialize_group(group, detail=True)
    })


@app.route("/api/groups/<group_id>/participation", methods=["POST"])
@login_required
def update_participation(group_id):
    data = request.get_json() or {}
    status = data.get("status")
    if status not in ("join", "not_join"):
        return jsonify({"ok": False, "error": "status 必須是 join 或 not_join"}), 400

    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    uid = g.current_user["_id"]

    result = groups_col.update_one(
        {"_id": oid, "members.userId": uid},
        {"$set": {"members.$.status": status}}
    )
    if result.matched_count == 0:
        return jsonify({"ok": False, "error": "找不到團隊或不是成員"}), 404

    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})


@app.route("/api/groups/<group_id>/announcements", methods=["POST"])
@login_required
def add_announcement(group_id):
    data = request.get_json() or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"ok": False, "error": "公告內容必填"}), 400

    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    uid = g.current_user["_id"]
    group = groups_col.find_one({"_id": oid, "ownerId": uid})
    if not group:
        return jsonify({"ok": False, "error": "只有團長可以發布公告"}), 403

    ann = {
        "_id": ObjectId(),
        "content": content,
        "createdAt": datetime.datetime.utcnow(),
    }

    groups_col.update_one({"_id": oid}, {"$push": {"announcements": ann}})
    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})


@app.route("/api/groups/<group_id>/candidates", methods=["POST"])
@login_required
def add_candidate(group_id):
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    address = (data.get("address") or "").strip()

    if not name:
        return jsonify({"ok": False, "error": "餐廳名稱必填"}), 400

    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    uid = g.current_user["_id"]
    display_name = g.current_user.get("name") or g.current_user["email"]

    group = groups_col.find_one({"_id": oid, "members.userId": uid})
    if not group:
        return jsonify({"ok": False, "error": "你不是此團隊成員"}), 403

    cand = {
        "_id": ObjectId(),
        "name": name,
        "address": address or None,
        "createdById": uid,
        "createdByName": display_name,
        "createdAt": datetime.datetime.utcnow(),
        "voters": [],
    }

    groups_col.update_one({"_id": oid}, {"$push": {"candidates": cand}})
    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})


@app.route("/api/groups/<group_id>/close", methods=["POST"])
@login_required
def close_group(group_id):
    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    uid = g.current_user["_id"]
    result = groups_col.update_one(
        {"_id": oid, "ownerId": uid},
        {"$set": {"closed": True}}
    )
    if result.matched_count == 0:
        return jsonify({"ok": False, "error": "找不到團隊或你不是團長"}), 403

    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})


@app.route("/api/groups/<group_id>", methods=["DELETE"])
@login_required
def delete_group(group_id):
    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    uid = g.current_user["_id"]
    result = groups_col.delete_one({"_id": oid, "ownerId": uid})
    if result.deleted_count == 0:
        return jsonify({"ok": False, "error": "找不到團隊或你不是團長"}), 403

    return jsonify({"ok": True})


@app.route("/api/groups/<group_id>/vote", methods=["POST"])
@login_required
def update_vote(group_id):
    data = request.get_json() or {}
    cand_id = data.get("candidateId")

    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    uid = g.current_user["_id"]
    group = groups_col.find_one({"_id": oid, "members.userId": uid})
    if not group:
        return jsonify({"ok": False, "error": "找不到團隊或你不是成員"}), 404

    if group.get("votingClosed", False):
        return jsonify({"ok": False, "error": "投票已關閉"}), 403

    candidates = group.get("candidates", [])
    target_oid = None
    if cand_id:
        try:
            target_oid = ObjectId(cand_id)
        except Exception:
            return jsonify({"ok": False, "error": "candidateId 無效"}), 400

    changed = False

    # 先移除我所有票
    for c in candidates:
        voters = c.get("voters", []) or []
        if uid in voters:
            c["voters"] = [v for v in voters if v != uid]
            changed = True

    # 再把票投給 target
    if target_oid is not None:
        found_target = False
        for c in candidates:
            if c.get("_id") == target_oid:
                voters = c.get("voters", []) or []
                if uid not in voters:
                    voters.append(uid)
                    c["voters"] = voters
                    changed = True
                found_target = True
                break
        if not found_target:
            return jsonify({"ok": False, "error": "找不到此候選餐廳"}), 404

    if changed:
        groups_col.update_one({"_id": oid}, {"$set": {"candidates": candidates}})

    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})


@app.route("/api/groups/<group_id>/vote_close", methods=["POST"])
@login_required
def close_vote(group_id):
    try:
        oid = ObjectId(group_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 無效"}), 400

    uid = g.current_user["_id"]
    result = groups_col.update_one(
        {"_id": oid, "ownerId": uid},
        {"$set": {"votingClosed": True}}
    )
    if result.matched_count == 0:
        return jsonify({"ok": False, "error": "找不到團隊或你不是團長"}), 403

    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})


@app.route("/api/groups/<group_id>/member_status", methods=["POST"])
@login_required
def update_member_status(group_id):
    data = request.get_json() or {}
    member_id = data.get("memberId")
    status = data.get("status")

    if status not in ("join", "not_join"):
        return jsonify({"ok": False, "error": "status 必須是 join / not_join "}), 400

    if not member_id:
        return jsonify({"ok": False, "error": "memberId 必填"}), 400

    try:
        oid = ObjectId(group_id)
        target_uid = ObjectId(member_id)
    except Exception:
        return jsonify({"ok": False, "error": "group_id 或 memberId 無效"}), 400

    uid = g.current_user["_id"]
    group = groups_col.find_one({"_id": oid})
    if not group:
        return jsonify({"ok": False, "error": "找不到團隊"}), 404

    is_leader = (
        group.get("ownerId") == uid or
        any(m.get("userId") == uid and m.get("role") == "leader" for m in group.get("members", []))
    )
    if not is_leader:
        return jsonify({"ok": False, "error": "只有團長可以修改其他人狀態"}), 403

    members = group.get("members", [])
    updated = False
    for m in members:
        if m.get("userId") == target_uid:
            m["status"] = status
            updated = True
            break

    if not updated:
        return jsonify({"ok": False, "error": "找不到此成員"}), 404

    groups_col.update_one({"_id": oid}, {"$set": {"members": members}})
    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})

# ======================
# Blacklists APIs
# ======================

@app.route("/api/blacklists/my", methods=["GET"])
@login_required
def get_my_blacklists():
    user_id = g.current_user["_id"]
    docs = blacklists_col.find({"userId": user_id}).sort("createdAt", -1)

    items = []
    for d in docs:
        items.append({
            "id": str(d["_id"]),
            "osmId": d.get("osmId"),
            "osmType": d.get("osmType"),
            "name": d.get("name"),
            "address": d.get("address"),
            "lat": d.get("lat"),
            "lon": d.get("lon"),
            "createdAt": d.get("createdAt").isoformat() if d.get("createdAt") else None,
        })

    return jsonify({"ok": True, "items": items})


@app.route("/api/blacklists", methods=["POST"])
@login_required
def add_blacklist():
    try:
        user_id = g.current_user["_id"]
        data = request.get_json() or {}

        osm_id = data.get("osmId")
        osm_type = (data.get("osmType") or "").strip()

        if osm_id is None or not osm_type:
            return jsonify({"ok": False, "error": "osmId 與 osmType 為必填"}), 400

        try:
            osm_id = int(osm_id)
        except Exception:
            return jsonify({"ok": False, "error": "osmId 必須是數字"}), 400

        name = (data.get("name") or "").strip() or "未命名餐廳"
        address = (data.get("address") or "").strip()
        lat = data.get("lat")
        lon = data.get("lon")

        now = datetime.datetime.utcnow()

        doc = blacklists_col.find_one_and_update(
            {
                "userId": user_id,
                "osmType": osm_type,
                "osmId": osm_id,
            },
            {
                "$set": {
                    "userId": user_id,
                    "osmType": osm_type,
                    "osmId": osm_id,
                    "name": name,
                    "address": address,
                    "lat": lat,
                    "lon": lon,
                },
                "$setOnInsert": {
                    "createdAt": now,
                },
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )

        if not doc:
            return jsonify({"ok": False, "error": "伺服器錯誤：找不到黑名單資料"}), 500

        return jsonify({
            "ok": True,
            "item": {
                "id": str(doc["_id"]),
                "osmId": doc.get("osmId"),
                "osmType": doc.get("osmType"),
                "name": doc.get("name"),
                "address": doc.get("address"),
                "lat": doc.get("lat"),
                "lon": doc.get("lon"),
                "createdAt": doc.get("createdAt").isoformat() if doc.get("createdAt") else None,
            }
        })

    except Exception as e:
        app.logger.exception("add_blacklist unexpected error")
        return jsonify({"ok": False, "error": f"伺服器錯誤：{e}"}), 500


@app.route("/api/blacklists/<black_id>", methods=["DELETE"])
@login_required
def delete_blacklist(black_id):
    user_id = g.current_user["_id"]

    try:
        oid = ObjectId(black_id)
    except Exception:
        return jsonify({"ok": False, "error": "blacklist id 格式錯誤"}), 400

    result = blacklists_col.delete_one({"_id": oid, "userId": user_id})

    if result.deleted_count == 0:
        return jsonify({"ok": False, "error": "找不到該黑名單或無權限"}), 404

    return jsonify({"ok": True})

# ======================
# Lunch Search
# ======================

@app.route("/api/lunch/search", methods=["GET"])
@login_required
def lunch_search():
    user_id = g.current_user["_id"]

    lat_str = request.args.get("lat")
    lon_str = request.args.get("lon")
    radius_str = request.args.get("radius", "600")
    cuisine = request.args.get("cuisine", "ALL").strip().lower()

    if not lat_str or not lon_str:
        return jsonify({"ok": False, "error": "lat 與 lon 為必填參數"}), 400

    try:
        lat = float(lat_str)
        lon = float(lon_str)
        radius = int(radius_str)
    except Exception:
        return jsonify({"ok": False, "error": "lat/lon/radius 格式錯誤"}), 400

    black_docs = list(blacklists_col.find({"userId": user_id}))
    black_index = {(d.get("osmType"), int(d.get("osmId"))): str(d["_id"]) for d in black_docs}

    try:
        elements = query_overpass_restaurants(lat, lon, radius, cuisine)
    except requests.RequestException as e:
        return jsonify({"ok": False, "error": f"Overpass API 錯誤: {e}"}), 502

    restaurants = []
    for elem in elements:
        r = normalize_osm_element(elem)
        if r["lat"] is None or r["lon"] is None:
            continue

        key = (r["osmType"], int(r["osmId"]))
        bl_id = black_index.get(key)

        r["distance"] = haversine_distance_m(lat, lon, r["lat"], r["lon"])
        r["isBlacklisted"] = bl_id is not None
        if bl_id:
            r["blacklistId"] = bl_id

        restaurants.append(r)

    restaurants.sort(key=lambda x: x.get("distance") or 0)
    return jsonify({"ok": True, "restaurants": restaurants})

# ======================
# Local run (Render uses gunicorn)
# ======================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
