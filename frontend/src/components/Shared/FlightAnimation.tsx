import { useEffect, useRef, useState } from 'react';

const ROUTES = [
  { d: 'M 60 215 C 165 50, 385 20, 510 135', from: 'New York', to: 'London', fx: 60, fy: 215, tx: 510, ty: 135 },
  { d: 'M 510 135 C 540 200, 620 220, 700 180', from: 'London', to: 'Dubai', fx: 510, fy: 135, tx: 700, ty: 180 },
  { d: 'M 60 215 C 160 260, 300 250, 400 230', from: '', to: 'Paris', fx: 60, fy: 215, tx: 400, ty: 230 },
];

const CITIES = [
  { x: 60, y: 215, name: 'New York', color: '#223843' },
  { x: 510, y: 135, name: 'London', color: '#d77a61' },
  { x: 700, y: 180, name: 'Dubai', color: '#d8b4a0' },
  { x: 400, y: 230, name: 'Paris', color: '#223843' },
];

export default function FlightAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouse, setMouse] = useState({ x: 300, y: 130 });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleMove = (e: MouseEvent) => {
      const r = svg.getBoundingClientRect();
      const sx = ((e.clientX - r.left) / r.width) * 760;
      const sy = ((e.clientY - r.top) / r.height) * 300;
      setMouse({ x: sx, y: sy });
    };
    svg.addEventListener('mousemove', handleMove);
    return () => svg.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 760 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Interactive flight routes connecting world cities"
      className="w-full"
      style={{ cursor: 'crosshair' }}
    >
      {/* Dot grid texture */}
      {Array.from({ length: 18 }).map((_, i) => (
        <circle key={i} cx={80 + (i % 6) * 120} cy={40 + Math.floor(i / 6) * 80} r="1.2" fill="#dbd3d8" opacity="0.5" />
      ))}

      {/* Dashed static routes */}
      {ROUTES.map((r, i) => (
        <path key={`s${i}`} d={r.d} stroke="#dbd3d8" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
      ))}

      {/* Animated route draws */}
      {ROUTES.map((r, i) => (
        <path
          key={`a${i}`}
          className="draw-path-anim"
          d={r.d}
          stroke="#d8b4a0"
          strokeWidth="2"
          pathLength="1"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animation: `drawPath 2.5s ease-out ${0.3 + i * 0.6}s forwards`,
          }}
        />
      ))}

      {/* City markers */}
      {CITIES.map((c) => (
        <g key={c.name}>
          <circle cx={c.x} cy={c.y} r="10" fill={c.color} fillOpacity="0.08" />
          <circle cx={c.x} cy={c.y} r="5" fill={c.color} />
          <text
            x={c.x} y={c.y + 20}
            textAnchor="middle" fontSize="9" fill={c.color}
            fontFamily="Montserrat, sans-serif" fontWeight="600" letterSpacing="0.04em"
          >
            {c.name}
          </text>
        </g>
      ))}

      {/* Hidden path for main plane motion */}
      <path id="mainRoute" d={ROUTES[0].d} stroke="none" fill="none" />

      {/* Main animated plane on primary route */}
      <g className="flight-plane" transform="translate(60,215)">
        <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
          <mpath href="#mainRoute" />
        </animateMotion>
        <path d="M 11 0 L -3 -5.5 L -1 0 L -3 5.5 Z" fill="#d77a61" stroke="#fff" strokeWidth="0.5" />
        <path d="M 1 0 L -5 -9 L -4 0" fill="#d77a61" opacity="0.75" />
        <path d="M 1 0 L -5  9 L -4 0" fill="#d77a61" opacity="0.75" />
      </g>

      {/* Mouse-following compass glow */}
      <circle cx={mouse.x} cy={mouse.y} r="28" fill="url(#mouseGlow)" opacity="0.6" className="transition-all duration-700" />
      <defs>
        <radialGradient id="mouseGlow">
          <stop offset="0%" stopColor="#d8b4a0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d8b4a0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Altitude arc */}
      <path d="M 90 195 Q 285 -10 480 140" stroke="#d8b4a0" strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />
    </svg>
  );
}
