"use client";

import { useEffect, useState } from "react";

export function GradientBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // rAF-throttled so rapid touch scrolling costs at most one DOM read per frame.
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const targetSection = document.querySelector("#services") || document.querySelector("#works");
        if (targetSection) {
          const rect = targetSection.getBoundingClientRect();
          setIsVisible(rect.top < window.innerHeight && rect.bottom > 0);
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className="bottom-gradient-bar transition-opacity duration-500"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    />
  );
}
