// src/pages/SpinPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // ⭐ 加上 useLocation
import * as d3 from "d3";
import { useLunch } from "../context/LunchContext";
import Layout from "../components/Spin";
import TopBar from "../components/TopBar";
import "../styles/SpinPage.css";

export const SpinPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 

  const { filteredRestaurants, setSelectedRestaurant } = useLunch();
  const svgRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState("lunch");
  const user = { email: "user@example.com" };

  const handleChangeActive = (key) => {
    setActive(key);

    switch (key) {
      case "home":
        navigate("/");
        break;
      case "lunch":
        navigate("/spin");
        break;
      case "group":
        navigate("/group");
        break;
      case "blacklist":
        navigate("/blacklist");
        break;
      case "simple":
        navigate("/simple");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
 
    console.log("logout");
    navigate("/login");
  };


  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);

    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const winner = filteredRestaurants[randomIndex];

    const sliceAngle = 360 / filteredRestaurants.length;
    const winnerCenterAngle = randomIndex * sliceAngle + sliceAngle / 2;
    const finalRotation = -winnerCenterAngle + 360 * 5;

    const g = d3.select(svgRef.current).select("g");

    g.transition()
      .duration(3000)
      .ease(d3.easeCubicOut)
      .attrTween("transform", function () {
        return d3.interpolateString(
          "translate(160,160) rotate(0)",
          `translate(160,160) rotate(${finalRotation})`
        );
      })
      .on("end", () => {
        setTimeout(() => {
          setSelectedRestaurant(winner);
          navigate("/result");
        }, 500);
      });
  };


  useEffect(() => {
    if (filteredRestaurants.length < 1) {
      navigate("/");
    }
  }, [filteredRestaurants, navigate]);

  // 畫輪盤
  useEffect(() => {
    if (!svgRef.current || filteredRestaurants.length === 0) return;

    const width = 320;
    const height = 320;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .html(null); // Clear previous

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemePastel1);

    const pie = d3.pie().value(1);
    const data_ready = pie(filteredRestaurants);

    const arcGenerator = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Build the pie chart
    g.selectAll("path")
      .data(data_ready)
      .enter()
      .append("path")
      .attr("d", arcGenerator)
      .attr("fill", (d, i) => color(i.toString()))
      .attr("stroke", "white")
      .style("stroke-width", "2px");

    // Arrow pointer
    svg
      .append("polygon")
      .attr(
        "points",
        `${width / 2 - 10},10 ${width / 2 + 10},10 ${width / 2},35`
      )
      .style("fill", "#F97316")
      .style("stroke", "white")
      .style("stroke-width", "2px");
  }, [filteredRestaurants]);


  useEffect(() => {
    if (
      location.state?.autoSpin &&
      filteredRestaurants.length > 0 &&
      svgRef.current
    ) {
      setSpinning(true);

      const timer = setTimeout(() => {
        spinWheel();
      }, 150); 

      return () => clearTimeout(timer);
    }
  }, [location.state, filteredRestaurants]); 

  return (
    <>
      <TopBar
        active={active}
        onChangeActive={handleChangeActive}
        user={user}
        onLogout={handleLogout}
      />

      <Layout title="Spinning...">
        <div className="spin-page">
          <h2 className="spin-title">Where are we eating?</h2>

          <div className="spin-wheel-wrapper">
            <svg
              ref={svgRef}
              width="320"
              height="320"
              className="spin-wheel"
            ></svg>
          </div>

          {!spinning && (
            <button onClick={spinWheel} className="spin-button">
              SPIN!
            </button>
          )}

          {spinning && (
            <p className="spin-status">Selecting your destiny...</p>
          )}
        </div>
      </Layout>
    </>
  );
};
