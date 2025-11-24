import React, { useEffect, useRef } from "react";
import "./LoadingPage.css";

const LoadingPage = ({ onFinish }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height;

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Particles
    const particles = [];
    const particleCount = 250;
    const colorBlue = "rgba(0, 51, 255, 0.1)";
    const colorRed = "rgba(199, 0, 57, 0.1)";
    const colorPurple = "rgba(61, 0, 102, 0.15)";

    class Particle {
      constructor(x, y) {
        this.x = x || Math.random() * width;
        this.y = y || Math.random() * height;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color =
          Math.random() < 0.5
            ? colorBlue
            : Math.random() < 0.5
            ? colorRed
            : colorPurple;
        this.opacity = Math.random() * 0.5 + 0.01;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > width || this.x < 0) this.speedX *= -1;
        if (this.y > height || this.y < 0) this.speedY *= -1;
      }
      draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const lines = [];
    const lineCount = 5;
    class ElectricLine {
      constructor(isBlue) {
        this.isBlue = isBlue;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.length = Math.random() * 100 + 50;
        this.speed = Math.random() * 2 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.color = isBlue ? "#0033FF" : "#C70039";
      }
      update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        if (
          this.x > width + this.length ||
          this.x < -this.length ||
          this.y > height + this.length ||
          this.y < -this.length
        ) {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        }
      }
      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x + Math.cos(this.angle) * this.length,
          this.y + Math.sin(this.angle) * this.length
        );
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    function initParticles() {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function initLines() {
      for (let i = 0; i < lineCount; i++) {
        lines.push(new ElectricLine(i % 2 === 0));
      }
    }

    function animate() {
      ctx.fillStyle = "rgba(11, 12, 16, 0.1)";
      ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      lines.forEach((l) => {
        l.update();
        l.draw();
      });
      requestAnimationFrame(animate);
    }

    initParticles();
    initLines();
    animate();

    const timer = setTimeout(() => onFinish(), 5000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [onFinish]);

  return (
    <div className="loading-page-container">
      <canvas id="backgroundCanvas" ref={canvasRef}></canvas>
      <div className="loading-page-overlay">
        <div className="loading-page-title loading-page-glitch" data-text="INCOGNITO">
          INCOGNITO
        </div>
        <div className="loading-page-subtitle">INVESTIGATION</div>
        <p className="loading-page-tagline">INITIATING MULTIVERSAL PURSUIT...</p>
        <div className="loading-page-bar-container">
          <div className="loading-page-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;