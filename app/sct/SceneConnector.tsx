"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface SceneConnectorProps {
  startRef: React.RefObject<HTMLElement | null>;
  endRef: React.RefObject<HTMLElement | null>;
}

const SceneConnector = ({ startRef, endRef }: SceneConnectorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pathData, setPathData] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const calculatePath = () => {
    if (!startRef.current || !endRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const startRect = startRef.current.getBoundingClientRect();
    const endRect = endRef.current.getBoundingClientRect();

    // Calculate positions relative to container
    const startX = startRect.left - containerRect.left + startRect.width / 2;
    const startY = startRect.bottom - containerRect.top;

    const endX = endRect.left - containerRect.left + endRect.width / 2;
    const endY = endRect.top - containerRect.top;

    // SVG dimensions based on container
    const width = containerRect.width;
    const height = endY - startY + 50; // Add buffer
    const offsetY = startY - 25; // Position SVG starting before the line start

    // Control point for bezier curve (creates organic curve)
    const midY = (startY + endY) / 2;
    const curveOffset = (endX - startX) * 0.2; // Slight horizontal curve

    // Generate quadratic bezier path
    const path = `M ${startX} ${startY - offsetY} Q ${startX + curveOffset} ${midY - offsetY}, ${endX} ${endY - offsetY}`;

    setDimensions({ width, height });
    setPathData(path);
  };

  useEffect(() => {
    // Initial calculation
    const timer = setTimeout(calculatePath, 100); // Wait for layout

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculatePath);
    if (startRef.current) resizeObserver.observe(startRef.current);
    if (endRef.current) resizeObserver.observe(endRef.current);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", calculatePath);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculatePath);
    };
  }, []);

  if (!pathData) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0"
        style={{ overflow: "visible" }}
      >
        <defs>
          <style>{`
            @keyframes drawDash {
              from {
                stroke-dashoffset: 1000;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        </defs>
        <motion.path
          d={pathData}
          stroke="#ffffff"
          strokeWidth="2"
          fill="none"
          strokeDasharray="8,8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          viewport={{ once: true, amount: 0.3 }}
        />
      </svg>
    </div>
  );
};

export default SceneConnector;
