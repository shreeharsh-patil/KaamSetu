"use client";

import { useEffect, useState } from "react";

export function GradientBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const targetSection = document.querySelector("#services") || document.querySelector("#works");
      if (targetSection) {
        const rect = targetSection.getBoundingClientRect();
        const isSectionVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setIsVisible(isSectionVisible);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="bottom-gradient-bar transition-opacity duration-500"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    />
  );
}
