"use client";

import { useEffect, useRef, useState } from "react";

export function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    // Selectors for interactive elements
    const interactiveSelectors = [
      "a[href]",
      "button",
      '[data-slot="button"]',
      'input[type="submit"]',
      '[role="button"]',
      "input",
      "textarea",
      "select",
    ].join(", ");

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Check if hovering over interactive element
      const target = e.target as HTMLElement | null;
      const isInteractive = target?.closest?.(interactiveSelectors);

      if (isInteractive) {
        setIsHovering(true);
        const rect = (isInteractive as HTMLElement).getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from cursor to center
        const deltaX = targetX - centerX;
        const deltaY = targetY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Magnetic effect within 80px radius
        if (distance < 80) {
          const pullStrength = 0.3;
          targetX = targetX - deltaX * pullStrength;
          targetY = targetY - deltaY * pullStrength;
        }
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const animate = () => {
      // Smooth interpolation
      const ease = 0.15;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      setPosition({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main cursor dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isHovering ? "width 0.2s, height 0.2s" : "none",
        }}
      >
        <div
          className="relative -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{
            width: isHovering ? "36px" : "8px",
            height: isHovering ? "36px" : "8px",
            transition: "width 0.2s, height 0.2s",
          }}
        />
      </div>

      {/* Outer ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] mix-blend-difference hidden md:block"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <div
          className="relative -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
          style={{
            width: isHovering ? "48px" : "28px",
            height: isHovering ? "48px" : "28px",
            transition: "width 0.25s ease-out, height 0.25s ease-out, opacity 0.2s",
            opacity: isHovering ? 0 : 0.6,
          }}
        />
      </div>
    </>
  );
}
