import { useState, useEffect } from 'react';
// 由於 index.css 已經在入口檔案 (main.jsx/App.jsx) 中引入，這裡不需要再次引入。

// localStorage 儲存鍵名
const STORAGE_KEY = 'userProfile';

export default function ModuleProfile({ user }) {
    // 觀看 vs. 編輯模式切換
    const [isEditing, setIsEditing] = useState(false);

    // 設置初始狀態為從 user prop 獲取的值
    const [nickname, setNickname] = useState(user.nickname || user.username || '');
    const [email, setEmail] = useState(user.email || 'example@email.com');
    const [isModified, setIsModified] = useState(false);

    // 模擬帳號資訊
    const userId = user.id || '1763696400002';
    const userCreatedAt = user.createdAt || '2025/11/21';

    // 【步驟 1: 從 localStorage 載入資料】
    useEffect(() => {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                const savedProfile = JSON.parse(storedData);

                // 僅使用 localStorage 的資料來覆蓋可編輯的欄位
                setNickname(savedProfile.nickname);
                setEmail(savedProfile.email);
            }
        } catch (error) {
            console.error("無法從 localStorage 載入資料:", error);
        }
        // 依賴 user prop，確保在 user 資料準備好後執行
    }, [user]);

    // 檢查變更狀態
    const checkModification = (newNickname = nickname, newEmail = email) => {
        // 獲取當前的基準值 (從 localStorage 或 user prop)
        let baseNickname = user.nickname || user.username || '';
        let baseEmail = user.email || 'example@email.com';

        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                const savedProfile = JSON.parse(storedData);
                // 如果有儲存，則以儲存的值作為原始基準
                baseNickname = savedProfile.nickname;
                baseEmail = savedProfile.email;
            }
        } catch (e) {
            // 忽略錯誤，使用 user prop 作為基準
        }

        // 檢查當前狀態與基準值是否不同
        setIsModified(newNickname !== baseNickname || newEmail !== baseEmail);
    };

    // 處理輸入欄位變動
    const handleNicknameChange = (e) => {
        const newNickname = e.target.value;
        setNickname(newNickname);
        checkModification(newNickname, email);
    };

    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        checkModification(nickname, newEmail);
    };

    // 【步驟 2: 儲存資料到 localStorage】
    const handleSave = () => {
        // 1. 儲存到 localStorage
        const profileToSave = { nickname, email };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profileToSave));
            console.log('資料已儲存到 localStorage:', profileToSave);
            alert('儲存變更成功！');
        } catch (error) {
            console.error("無法儲存資料到 localStorage:", error);
            alert('儲存失敗 (LocalStorage Error)');
        }

        // 2. 更新狀態
        setIsModified(false);
        setIsEditing(false); // 儲存後切換回觀看模式
    };

    const handleCancel = () => {
        // 重設回最新的 localStorage 資料或 user prop
        let originalNickname = user.nickname || user.username || '';
        let originalEmail = user.email || 'example@email.com';

        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                const savedProfile = JSON.parse(storedData);
                originalNickname = savedProfile.nickname;
                originalEmail = savedProfile.email;
            }
        } catch (e) {
            // 忽略錯誤
        }

        setNickname(originalNickname);
        setEmail(originalEmail);
        setIsModified(false);
        setIsEditing(false); // 取消後切換回觀看模式
    };

    const handleEdit = () => {
        setIsEditing(true);
        // 確保進入編輯模式時，重新檢查當前狀態是否已修改
        checkModification();
    }

    const isReadOnly = !isEditing;

    // 根據狀態選擇輸入框的樣式類名
    const inputClass = isReadOnly ? 'custom-input-readonly' : 'custom-input';

    // 渲染帶圖標的標籤和輸入框
    const renderField = (label, value, handler, type = "text", svgPath) => (
        <div className="form-group mb-4">
            <label className="form-label d-flex align-items-center small text-muted">
                {/* SVG 圖標 */}
                <svg className="me-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d={svgPath} />
                </svg>
                {label}
            </label>
            <input
                type={type}
                className={`form-control form-control-lg ${inputClass}`}
                value={value}
                onChange={handler}
                readOnly={isReadOnly}
            />
        </div>
    );

    return (
        <form className="module-profile-form" onSubmit={(e) => e.preventDefault()}>

            {/* 頂部區域 - 編輯按鈕 */}
            <div className="d-flex justify-content-end mb-4">
                {!isEditing && (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm btn-edit-profile"
                        onClick={handleEdit}
                    >
                        編輯
                    </button>
                )}
            </div>

            {/* 頂部頭像區 */}
            <div className="text-center mb-5">
                <div className="profile-avatar-large mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.284 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                    </svg>
                </div>
            </div>

            {/* 暱稱輸入框 */}
            {renderField(
                '暱稱',
                nickname,
                handleNicknameChange,
                'text',
                'M15 14s1 0 1-1-1-4-6-4-6 3-6 4 1 1 1 1h10zm-9.995-.944v-.002.002zM1.022 13a2 2 0 0 0-.783.324.787.787 0 0 0 .004.005c.002.002.004.004.007.006a.78 0 0 0 .19.141.64.64 0 0 0 .074.058l.004.003h.001l.003.002.002.001a.72.72 0 0 0 .529.176c.219-.012.437-.03.655-.056.843-.108 1.547-.28 2.158-.455.572-.165 1.144-.31 1.724-.454l.006-.003c.532-.128 1.059-.247 1.58-.337.367-.061.734-.117 1.096-.157.377-.04.754-.075 1.13-.105.38-.031.758-.06 1.134-.087.376-.026.753-.05 1.127-.069.375-.019.749-.033 1.12-.04.372-.008.744-.01 1.112-.008h.005a.7.7 0 0 0 .546.223.774.774 0 0 0 .085.011c.01.002.02.004.03.006.01.002.019.004.029.006a.784.784 0 0 0 .17.069.76.76 0 0 0 .066.027.765.765 0 0 0 .06.025.772.772 0 0 0 .048.02.774.774 0 0 0 .034.015.787.787 0 0 0 .02.008c.005.002.01.004.015.006a.787.787 0 0 0 .003.001h-.001V12a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v1zM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
            )}

            {/* Email 輸入框 */}
            {renderField(
                'Email',
                email,
                handleEmailChange,
                'email',
                'M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm7.361-1.397L16 11.801V4.697l-5.803 3.558Z'
            )}

            {/* 用戶名稱 (不可修改 - 使用 custom-input-readonly-fixed 樣式) */}
            <div className="form-group mb-5">
                <label className="form-label d-flex align-items-center small text-muted">
                    <svg className="me-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    </svg>
                    用戶名稱
                </label>
                {/* custom-input-readonly-fixed 容器用於樣式化整個只讀區塊 */}
                <div className="input-group input-group-lg custom-input-readonly-fixed">
                    <span className="input-group-text bg-transparent border-0 ps-3">@</span>
                    <input
                        type="text"
                        className="form-control bg-transparent border-0"
                        value={user.username}
                        readOnly // 始終為只讀
                    />
                </div>
                <small className="form-text text-muted ms-1">用戶名稱無法修改</small>
            </div>

            {/* 帳號資訊區塊 (保持不變) */}
            <h6 className="fw-semibold text-muted mb-3">帳號資訊</h6>
            <div className="row g-2 small text-muted mb-5">
                <div className="col-12 d-flex justify-content-between">
                    <span>帳號 ID</span>
                    <span className="fw-bold">{userId}</span>
                </div>
                <div className="col-12 d-flex justify-content-between">
                    <span>建立時間</span>
                    <span className="fw-bold">{userCreatedAt}</span>
                </div>
            </div>

            {/* 操作按鈕 - 只在編輯模式下顯示 */}
            {isEditing && (
                <div className="row g-3">
                    <div className="col-6">
                        <button
                            type="button"
                            className="btn btn-outline-secondary w-100 btn-lg"
                            onClick={handleCancel}
                        >
                            取消
                        </button>
                    </div>
                    <div className="col-6">
                        <button
                            type="submit"
                            className="btn w-100 btn-lg btn-save-changes"
                            onClick={handleSave}
                            disabled={!isModified}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm1 1h2.5V2H12v1zM11.5 4h.5a1 1 0 0 1 1 1v1.5a.5.5 0 0 1-1 0V5h-1a1 1 0 0 1-1-1v-.5a.5.5 0 0 1 1 0V4zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" /></svg>
                            儲存變更
                        </button>
                    </div>
                </div>
            )}

            {/* 底部提示訊息 */}
            <div className="text-center small text-muted mt-5 py-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm2 5V3a3 3 0 1 0-6 0v3h6z" /><path d="M10 8H6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z" /></svg>
                所有資料儲存在本地端，不會上傳到伺服器
            </div>
        </form>
    );
}