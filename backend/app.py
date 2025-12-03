# app.py
import os
import datetime
from functools import wraps

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import random
import string

app = Flask(__name__)
CORS(app)  # 之後需要可以再加 origins 設定

# ====== 環境變數 ======
MONGO_URI = os.getenv("MONGO_URI")  # Atlas 連線字串
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256" #用同一個密鑰（JWT_SECRET）來簽名跟驗證 token
JWT_EXPIRES_DAYS = 7 #token 的有效期限 7 天後前端想要使用它 → 後端會回傳 401 token 已過期 前端就需要讓使用者重新登入

# ====== MongoDB ======
client = MongoClient(MONGO_URI)
db = client["lunchpicker"]
users_col = db["users"]
groups_col = db["groups"]

# ---- 建立唯一索引（只需要執行一次，之後會自動記住） ----
try:
    groups_col.create_index("code", unique=True)
except:
    pass

# ====== JWT 工具 ======

def create_token(user_doc):
    """用 user 資料產生 JWT"""
    payload = {
        "user_id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXPIRES_DAYS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    # PyJWT 2.x 會回 str，如果是 bytes 記得 decode
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def get_current_user_from_request():
    """從 Authorization: Bearer <token> 解析出目前登入的 user"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
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

    user = users_col.find_one({"_id": ObjectId(user_id)})
    return user


def login_required(f):
    """需要登入的路由用這個 decorator 包起來"""

    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({"ok": False, "error": "未登入或 token 無效"}), 401
        g.current_user = user
        return f(*args, **kwargs)

    return wrapper

def generate_group_code(length=5):
    # 避免 0/O/1/I 等容易看錯的字
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choice(chars) for _ in range(length))

def serialize_group(group_doc, detail=False):
    """把 Mongo 的 group doc 轉成前端需要的格式"""
    if not group_doc:
        return None

    base = {
        "id": str(group_doc["_id"]),
        "name": group_doc.get("name"),
        "code": group_doc.get("code"),
        "ownerId": str(group_doc.get("ownerId")) if group_doc.get("ownerId") else None,
        "createdAt": group_doc.get("createdAt").isoformat() if group_doc.get("createdAt") else None,
        "closed": group_doc.get("closed", False),
        "votingClosed": group_doc.get("votingClosed", False),  # 🔸新增
    }

    # summary mode（我的團隊列表用）
    if not detail:
        members = group_doc.get("members", [])
        base["memberCount"] = len(members)
        return base

    # detail mode（團隊內頁用）
    members_out = []
    for m in group_doc.get("members", []):
        raw_status = m.get("status")
        if not raw_status or raw_status == "unknown":
            normalized_status = "join"
        else:
            normalized_status = raw_status

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

    # 方便算「我投哪一個」
    current_uid = None
    if getattr(g, "current_user", None):
        current_uid = g.current_user["_id"]

    cands_out = []
    candidates = group_doc.get("candidates", [])
    total_votes = 0
    # 先算總票數
    for c in candidates:
        voters = c.get("voters", [])
        total_votes += len(voters)

    for c in candidates:
        voters = c.get("voters", [])
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


#====================
#註冊 API
#====================
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

    # 檢查 email 是否已存在
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
        }
    }), 201
#====================
#登入 API
#====================
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"ok": False, "error": "email 與 password 為必填"}), 400

    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"ok": False, "error": "帳號或密碼錯誤"}), 401

    if not check_password_hash(user.get("passwordHash", ""), password):
        return jsonify({"ok": False, "error": "帳號或密碼錯誤"}), 401

    # 更新最後登入時間
    users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLoginAt": datetime.datetime.utcnow()}}
    )

    token = create_token(user)

    return jsonify({
        "ok": True,
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
        }
    })
#====================
#查看當前登入者
#====================
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
#====================
#登出
#====================
@app.route("/api/auth/logout", methods=["POST"])
def logout():
    # JWT 這種 stateless token，後端通常不用清除，
    # 前端把 localStorage 裡的 token 刪掉就算登出。
    return jsonify({"ok": True})

@app.route("/api/user/profile", methods=["PUT"])
@login_required
def update_profile():
    data = request.get_json() or {}
    nickname = (data.get("nickname") or "").strip()

    users_col.update_one(
        {"_id": g.current_user["_id"]},
        {"$set": {"name": nickname}}
    )

    # 重新查最新資料（可選）
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

@app.route("/api/groups", methods=["POST"])
@login_required
def create_group():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"ok": False, "error": "團隊名稱必填"}), 400

    # ====== 產生不重複的代碼 ======
    code = None
    for _ in range(10):  # 最多嘗試 10 次
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

    # 找出所有「我有在 members 裡」的團隊
    docs = groups_col.find({"members.userId": uid}).sort("createdAt", -1)

    groups = []
    for doc in docs:
        members = doc.get("members", [])

        # 找出「我在這個團」的角色（leader / member）
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

    # 只允許「有在 members 裡的人」看
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

    # 找到這個代碼的團隊（且沒被關閉）
    group = groups_col.find_one({"code": code, "closed": False})
    if not group:
        return jsonify({"ok": False, "error": "找不到此代碼或團隊已關閉"}), 404

    uid = g.current_user["_id"]
    display_name = g.current_user.get("name") or g.current_user["email"]

    members = group.get("members", [])
    exists = False
    for m in members:
        if m.get("userId") == uid:
            exists = True
            break

    # 如果還不是成員 → 加進去
    if not exists:
        members.append({
            "userId": uid,
            "displayName": display_name,
            "role": "member",
            "status": "join",
            "joinedAt": datetime.datetime.utcnow(),
        })
        groups_col.update_one(
            {"_id": group["_id"]},
            {"$set": {"members": members}}
        )
        group["members"] = members  # 更新記憶體裡的 group

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

    # 只有團長可以發公告
    uid = g.current_user["_id"]
    group = groups_col.find_one({"_id": oid, "ownerId": uid})
    if not group:
        return jsonify({"ok": False, "error": "只有團長可以發布公告"}), 403

    ann = {
        "_id": ObjectId(),
        "content": content,
        "createdAt": datetime.datetime.utcnow(),
    }

    groups_col.update_one(
        {"_id": oid},
        {"$push": {"announcements": ann}}
    )

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

    # 只要是成員就可以加候選餐廳；投票關閉時也可以視情況鎖住（這裡我先允許）
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
        "voters": [],  # 一開始沒人投
    }

    groups_col.update_one(
        {"_id": oid},
        {"$push": {"candidates": cand}}
    )

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
    cand_id = data.get("candidateId")  # 可以是 None (取消投票)

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

    # 更新 voters：先從所有候選移除我
    changed = False
    for c in candidates:
        voters = c.get("voters", [])
        if uid in voters:
            voters = [v for v in voters if v != uid]
            c["voters"] = voters
            changed = True

    # 如果有指定新的 candidate，幫我加回去（代表投這一家）
    if target_oid is not None:
        found_target = False
        for c in candidates:
            if c.get("_id") == target_oid:
                voters = c.get("voters", [])
                if uid not in voters:
                    voters.append(uid)
                    c["voters"] = voters
                    changed = True
                found_target = True
                break
        if not found_target:
            return jsonify({"ok": False, "error": "找不到此候選餐廳"}), 404

    if changed:
        groups_col.update_one(
            {"_id": oid},
            {"$set": {"candidates": candidates}}
        )

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

    # 只有 owner/團長可以關閉投票
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

    # 只有 owner / leader 可以改所有人
    group = groups_col.find_one({"_id": oid})
    if not group:
        return jsonify({"ok": False, "error": "找不到團隊"}), 404

    is_leader = (
        group.get("ownerId") == uid or
        any(m.get("userId") == uid and m.get("role") == "leader" for m in group.get("members", []))
    )
    if not is_leader:
        return jsonify({"ok": False, "error": "只有團長可以修改其他人狀態"}), 403

    # 更新特定 member
    members = group.get("members", [])
    updated = False
    for m in members:
        if m.get("userId") == target_uid:
            m["status"] = status
            updated = True
            break

    if not updated:
        return jsonify({"ok": False, "error": "找不到此成員"}), 404

    groups_col.update_one(
        {"_id": oid},
        {"$set": {"members": members}}
    )

    group = groups_col.find_one({"_id": oid})
    return jsonify({"ok": True, "group": serialize_group(group, detail=True)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="127.0.0.1", port=port)
