"use client";

import { useState, useEffect, useCallback } from "react";

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    // Calculate total scrollable height (document height minus viewport height)
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    // Avoid division by zero
    const totalScroll = docHeight > 0 ? docHeight : 1;
    const clamped = Math.min(Math.max(scrollY / totalScroll, 0), 1);
    setProgress(clamped);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Also recalculate on resize since document height may change
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  return { progress };
}
