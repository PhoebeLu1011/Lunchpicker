// src/modules/ResultPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLunch } from "../context/LunchContext";
import Layout from "../components/Spin";
import "../styles/ResultPage.css";

export const ResultPage = () => {
  const navigate = useNavigate();
  const {
    selectedRestaurant,
    setSelectedRestaurant,
    isBlacklisted,
    addToBlacklist,
    removeFromBlacklist,
  } = useLunch();

  useEffect(() => {
    if (!selectedRestaurant) {
      navigate("/");
    }
  }, [selectedRestaurant, navigate]);

  if (!selectedRestaurant) return null;

  const blocked = isBlacklisted(selectedRestaurant);

  const handleReset = () => {
    setSelectedRestaurant(null);
    navigate("/");
  };

  const handleRetry = () => {
    navigate("/spin", { state: { autoSpin: true } });
  };


  const handleToggleBlacklist = async () => {
    if (blocked) {
      await removeFromBlacklist(selectedRestaurant);
    } else {
      await addToBlacklist(selectedRestaurant);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    selectedRestaurant.name + " " + selectedRestaurant.address
  )}&query_place_id=${selectedRestaurant.lat},${selectedRestaurant.lon}`;

  return (
    <Layout title="抽到的店家">
      <div className="result-page">
        <div className="result-card">
          {/* 店家名稱區 */}
          <div className="result-header">
            <h2 className="result-name">{selectedRestaurant.name}</h2>
            <p className="result-cuisine">
              {selectedRestaurant.cuisine || "Restaurant"}
            </p>
          </div>

          <div className="result-body">
            {/* 地址 */}
            <section className="result-section">
              <div className="section-label">地址</div>
              <p className="section-main">{selectedRestaurant.address}</p>
              <p className="section-sub">
                約 {Math.round(selectedRestaurant.distance || 0)} 公尺
              </p>
            </section>


            {/* Google Maps 按鈕 */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="result-btn result-btn-primary full-width-btn"
            >
              在 Google Maps 打開
            </a>

            {/* 黑名單按鈕 */}
            <button
              type="button"
              onClick={handleToggleBlacklist}
              className={`blacklist-btn ${
                blocked ? "blacklist-btn--blocked" : "blacklist-btn--add"
              }`}
            >
              {blocked ? "已在黑名單（點此移除）" : "將這間店加入黑名單"}
            </button>
          </div>
        </div>

        {/* 底部操作按鈕 */}
        <div className="result-footer">
          <button
            type="button"
            onClick={handleRetry}
            className="result-btn result-btn-outline"
          >
            再抽一次
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="result-btn result-btn-secondary"
          >
            重新搜尋
          </button>
        </div>
      </div>
    </Layout>
  );
};
