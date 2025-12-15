# Lunchpicker
## 系統架構圖
```mermaid
flowchart LR
  U[使用者 ／ 瀏覽器]

  subgraph FE[前端（React + Vite）]
    R[頁面 ／ 路由<br/>首頁 Home ／ <br/>轉盤 Spin ／ <br/>結果 Result<br/>揪團 Group ／ <br/>黑名單 Blacklist ／ <br/>個人 Profile]
    AC[AuthContext<br/>登入狀態管理<br/>（login／logout／getMe）]
    LC[LunchContext<br/>餐廳清單 ／ 過濾結果<br/>黑名單 ／ 暫時排除<br/>抽到的餐廳結果]
    API_G[src／api／groupApi.js<br/>揪團 API 封裝]
    API_B[src／api／blacklist.js<br/>黑名單 API 封裝]
    LOC[src／utils／locationApi.js<br/>地址轉座標（Geocode）]
    D3[D3.js 轉盤動畫<br/>（SpinPage）]
  end

  subgraph BE[後端（Flask REST API）]
    AUTH[驗證 ／ 帳號 API<br/>POST ／api／auth／register<br/>POST ／api／auth／login<br/>GET ／api／auth／me<br/>POST ／api／auth／logout]
    GRP[揪團 API<br/>建立 ／ 加入 ／<br/> 投票 ／ 角色]
    BL[黑名單 API<br/>查詢 ／ 新增 ／ 刪除]
    LUNCH[餐廳搜尋 API<br/>GET ／api／lunch／search]
    JWTM[JWT 驗證中介層<br/>HttpOnly Cookie：access_token<br/>login_required 保護路由]
  end

  subgraph DB[資料庫（MongoDB Atlas）]
    USERS[(users)]
    GROUPS[(groups)]
    BLACKS[(blacklists)]
  end

  subgraph EXT[外部服務]
    NOM[Nominatim<br/>地址 → 經緯度]
    OVER[Overpass API<br/>OpenStreetMap 餐廳查詢]
  end

  U --> R
  R --> AC
  R --> LC
  R --> D3
  R --> API_G
  R --> API_B
  R --> LOC

  API_G --> GRP
  API_B --> BL
  R --> LUNCH

  GRP --> GROUPS
  BL --> BLACKS
  AUTH --> USERS

  LOC --> NOM
  LUNCH --> OVER



```

## ERD
```mermaid
erDiagram
  USERS ||--o{ GROUP_MEMBERS : joins
  USERS ||--o{ GROUPS : owns
  USERS ||--o{ BLACKLISTS : has

  GROUPS ||--o{ GROUP_MEMBERS : includes
  GROUPS ||--o{ GROUP_CANDIDATES : has
  GROUPS ||--o{ GROUP_ANNOUNCEMENTS : posts
  GROUP_CANDIDATES ||--o{ GROUP_VOTES : receives

  USERS {
    string _id PK
    string email "unique"
    string passwordHash
    string displayName
    datetime createdAt
  }

  GROUPS {
    string _id PK
    string name
    string code "unique (6 chars)"
    string ownerId FK
    boolean votingClosed
    boolean groupClosed
    datetime createdAt
  }

  GROUP_MEMBERS {
    string groupId FK
    string userId FK
    string role "leader | member"
    string status "join | not_join"
    string displayName
    datetime joinedAt
  }

  GROUP_ANNOUNCEMENTS {
    string groupId FK
    string id "uuid / short id"
    string content
    datetime createdAt
  }

  GROUP_CANDIDATES {
    string groupId FK
    string candidateId PK
    string name
    string osmType
    string osmId
    string address
    float lat
    float lon
    int voteCount
    datetime createdAt
  }

  GROUP_VOTES {
    string groupId FK
    string candidateId FK
    string userId FK
    datetime createdAt
  }

  BLACKLISTS {
    string _id PK
    string userId FK
    string osmType
    string osmId
    string name
    string address
    float lat
    float lon
    datetime createdAt
    string uniqueKey "unique: userId + osmType + osmId"
  }


```

## | How to run 
### First-time installation（只有第一次需要安裝）
```
npm install
npm install bootstrap
```
### Run（之後每次啟動只要輸入這個即可）
#### Frontend :
```
cd lunchpicker
npm run dev
```
#### Backend :
```
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
py app.py
```

## | How to clone/pull/push
### 1. Clone repo.
```
git clone https://github.com/PhoebeLu1011/Lunchpicker.git
cd Lunchpicker
```
### 2. 轉移至&同步main
```
git switch main
git pull origin main
```
### 3. 創建&切換至自己所建立的分支
```
# ex: git checkout -b feature/draw_lots
git checkout -b <新分支名字>
```
### 完成開發後push
```
git add .
git commit -m "填寫自己完成的事項(ex.抽籤功能完成)"
```
```
# ex: git push -u origin feature/draw_lots
git push -u origin <分支名字>
```
push完應該會有pull request merge前記得在群組講一聲

## | File Structure
```
LUNCHPICKER/
│
├── backend/
│   ├── .venv/
│   ├── .env
│   ├── .gitignore
│   ├── app.py
│   └── requirements.txt
│
├── lunchpicker/
│   ├── node_modules/
│   ├── public/
│   │   └── ... (靜態資源)
│   │
│   └── src/
│       ├── api/
│       │   ├── groupApi.js
│       │   └── locationApi.js
│       │
│       ├── assets/
│       │   └── react.svg
│       │
│       ├── components/
│       │   ├── LunchRunner.css
│       │   ├── LunchRunner.jsx
│       │   └── TopBar.jsx
│       │
│       ├── modules/
│       │   ├── ModuleGroup.jsx
│       │   ├── ModuleLunchMain.jsx
│       │   ├── ModuleProfile.jsx
│       │   └── ModuleSimple.jsx
│       │
│       ├── modules/group/
│       │   ├── GroupCandidates.jsx
│       │   ├── GroupCreateForm.jsx
│       │   ├── GroupCreateSuccess.jsx
│       │   ├── GroupDetail.jsx
│       │   ├── GroupJoin.jsx
│       │   └── GroupOverview.jsx
│       │
│       ├── pages/
│       │   ├── AuthPage.css
│       │   ├── AuthPage.jsx
│       │   └── HomePage.jsx
│       │
│       ├── styles/
│       │   ├── Group.css
│       │   ├── App.jsx
│       │   ├── authClient.js
│       │   ├── index.css
│       │   ├── LunchPicker.jsx
│       │   └── main.jsx
│       │
│       ├── .gitignore
│       ├── eslint.config.js
│       ├── index.html
│       ├── package-lock.json
│       └── package.json
│
├── README.md
└── vite.config.js
```
