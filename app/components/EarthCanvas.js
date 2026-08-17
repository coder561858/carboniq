'use client';

import { useEffect, useRef } from 'react';

export default function EarthCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const DPR = window.devicePixelRatio || 1;
    const SIZE = 100;
    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    const cx = SIZE / 2, cy = SIZE / 2, R = SIZE / 2 - 2;
    let angle = 0;
    let animationId;

    // Simplified continent shapes as lat/lon polygons [lon, lat] in degrees
    const continents = [
      [[-10, 70], [40, 72], [80, 75], [140, 68], [145, 50], [140, 30], [110, 20], [80, 10], [60, 22], [40, 36], [20, 38], [10, 52], [0, 58], [-10, 64], [-10, 70]],
      [[-18, 14], [0, 5], [15, 0], [40, -5], [50, 10], [45, 28], [36, 22], [28, 5], [20, -18], [14, -35], [18, -34], [36, -20], [50, -10], [44, 12], [26, 22], [14, 36], [-2, 34], [-10, 22], [-18, 14]],
      [[-165, 68], [-140, 72], [-90, 72], [-80, 50], [-65, 44], [-80, 26], [-90, 20], [-80, 10], [-90, 14], [-110, 22], [-120, 32], [-125, 48], [-140, 58], [-165, 68]],
      [[-80, 10], [-70, 12], [-50, 5], [-36, -5], [-36, -18], [-56, -38], [-68, -54], [-75, -50], [-72, -40], [-56, -28], [-46, -24], [-42, -4], [-60, 5], [-72, 10], [-80, 10]],
      [[114, -22], [126, -14], [137, -12], [148, -18], [150, -30], [140, -38], [130, -36], [118, -34], [114, -30], [114, -22]],
      [[-46, 84], [-20, 84], [-18, 74], [-28, 68], [-44, 64], [-58, 70], [-60, 78], [-46, 84]],
      [[-180, -70], [0, -72], [180, -70], [180, -80], [-180, -80], [-180, -70]],
    ];

    function lonLatToXY(lon, lat, rotAngle) {
      const phi = (lat * Math.PI) / 180;
      const lam = ((lon + rotAngle * 57.2958) * Math.PI) / 180;
      const x3 = Math.cos(phi) * Math.sin(lam);
      const y3 = Math.sin(phi);
      const z3 = Math.cos(phi) * Math.cos(lam);
      if (z3 < 0) return null;
      const px = cx + x3 * R;
      const py = cy - y3 * R;
      return { x: px, y: py, z: z3 };
    }

    function drawFrame() {
      ctx.clearRect(0, 0, SIZE, SIZE);

      const ocean = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
      ocean.addColorStop(0, '#5bc8f5');
      ocean.addColorStop(0.5, '#1a8fc1');
      ocean.addColorStop(1, '#0a3d62');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();

      ctx.fillStyle = '#4caf6e';
      ctx.strokeStyle = 'rgba(34,120,60,0.5)';
      ctx.lineWidth = 0.4;

      for (const poly of continents) {
        const pts = poly.map(([lo, la]) => lonLatToXY(lo, la, angle)).filter(Boolean);
        if (pts.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        const shade = Math.floor(40 + avgZ * 80);
        ctx.fillStyle = `rgb(${shade + 30}, ${shade + 100}, ${shade + 50})`;
        ctx.fill();
        ctx.stroke();
      }

      const atmo = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.08);
      atmo.addColorStop(0, 'rgba(100,210,255,0.0)');
      atmo.addColorStop(0.5, 'rgba(80,180,255,0.18)');
      atmo.addColorStop(1, 'rgba(60,140,255,0.0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
      ctx.fillStyle = atmo;
      ctx.fill();

      const spec = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.38, 0, cx - R * 0.38, cy - R * 0.38, R * 0.65);
      spec.addColorStop(0, 'rgba(255,255,255,0.45)');
      spec.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      const term = ctx.createRadialGradient(cx + R * 0.6, cy + R * 0.6, 0, cx, cy, R);
      term.addColorStop(0.6, 'rgba(0,0,0,0)');
      term.addColorStop(1, 'rgba(0,0,30,0.45)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = term;
      ctx.fill();

      angle += 0.004;
      animationId = requestAnimationFrame(drawFrame);
    }

    animationId = requestAnimationFrame(drawFrame);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cta-earth-canvas"
      width="100"
      height="100"
      aria-label="Rotating Earth animation"
    />
  );
}
