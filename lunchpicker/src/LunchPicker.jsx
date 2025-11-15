// src/LunchPicker.jsx
import { useState } from "react";

export default function LunchPicker() {
  const [options, setOptions] = useState(["便當", "麥當勞", "炒飯", "拉麵"]);
  const [input, setInput] = useState("");
  const [chosen, setChosen] = useState("");

  function addOption(e) {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    setOptions((prev) => [...prev, name]);
    setInput("");
  }

  function randomPick() {
    if (options.length === 0) {
      setChosen("先加一些選項吧 😆");
      return;
    }
    const idx = Math.floor(Math.random() * options.length);
    setChosen(options[idx]);
  }

  return (
    <div>
      <h5 className="mb-2">今天午餐吃什麼？🎲</h5>
      <p className="mb-3 small text-muted">
        之後可以擴充成地圖 / API / 分組投票，現在先把登入系統 &amp; 基本邏輯做好。
      </p>

      <form onSubmit={addOption} className="row g-2 align-items-center mb-3">
        <div className="col-8 col-sm-9">
          <input
            placeholder="新增一個餐廳或品項"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="col-4 col-sm-3 d-grid">
          <button type="submit" className="btn btn-primary">
            新增
          </button>
        </div>
      </form>

      <ul className="list-group mb-3">
        {options.map((o, i) => (
          <li key={i} className="list-group-item py-2">
            {o}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={randomPick}
        className="btn btn-outline-primary"
      >
        幫我選一個！
      </button>

      {chosen && (
        <p className="mt-3 fs-5 mb-0">
          👉 今天就吃：<b>{chosen}</b>
        </p>
      )}
    </div>
  );
}
