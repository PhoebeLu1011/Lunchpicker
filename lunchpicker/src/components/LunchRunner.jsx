import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./LunchRunner.css";

gsap.registerPlugin(useGSAP);

const FOODS = ["🍕", "🍔", "🥗", "🌮", "🍣", "🍜", "🍛", "🥟"];

export default function LunchRunnerFooter() {
  const footerRef = useRef(null);
  const runnerRef = useRef(null);
  const foodRowRef = useRef(null);

  useGSAP(() => {
    // 小人上下小跳 (跑步)
    gsap.to(runnerRef.current, {
      y: -7,
      repeat: -1,
      yoyo: true,
      duration: 0.32,
      ease: "power1.inOut",
    });

    // 食物跑馬燈
    gsap.to(foodRowRef.current, {
      xPercent: -100,
      repeat: -1,
      duration: 6,
      ease: "none",
    });
  });

  return (
    <div className="lunch-runner-footer" ref={footerRef}>
      <div className="lunch-runner-character" ref={runnerRef}>
        🏃‍♀️
      </div>

      <div className="lunch-runner-track"></div>

      <div className="lunch-runner-food-row" ref={foodRowRef}>
        {FOODS.concat(FOODS).map((f, i) => (
          <div key={i}>{f}</div>
        ))}
      </div>

      <div className="lunch-runner-caption">正在幫你尋找午餐中…</div>
    </div>
  );
}
