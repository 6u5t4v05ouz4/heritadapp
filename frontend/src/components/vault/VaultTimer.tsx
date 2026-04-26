"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";

interface VaultTimerProps {
  lastHeartbeat: number;
  inactivityPeriod: number;
  size?: "sm" | "md" | "lg";
}

export default function VaultTimer({ lastHeartbeat, inactivityPeriod, size = "sm" }: VaultTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const nowSec = Math.floor(now / 1000);
  const expiry = lastHeartbeat + inactivityPeriod;
  const diff = expiry - nowSec;

  const isWaiting = lastHeartbeat === 0;
  const isExpired = diff <= 0 && lastHeartbeat > 0;

  const totalSeconds = inactivityPeriod;
  const remainingSeconds = Math.max(0, diff);
  const progress = isWaiting ? 0 : isExpired ? 100 : ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  let variant: "success" | "warning" | "danger" | "neutral" = "success";
  if (isWaiting) variant = "neutral";
  else if (isExpired) variant = "danger";
  else if (remainingSeconds < totalSeconds * 0.25) variant = "danger";
  else if (remainingSeconds < totalSeconds * 0.5) variant = "warning";

  const formatTime = () => {
    if (isWaiting) return "Aguardando depósito";
    if (isExpired) return "Expirado";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const timeText = formatTime();
  const isUrgent = variant === "danger" && !isExpired && !isWaiting;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isUrgent ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-text-tertiary" />
          )}
          <span className="text-xs text-text-tertiary">
            {isWaiting ? "Timer" : isExpired ? "Expirado" : "Tempo restante"}
          </span>
        </div>
        <span
          className={cn(
            "font-mono text-xs font-medium",
            {
              "text-emerald-400": variant === "success",
              "text-amber-400": variant === "warning" || isUrgent,
              "text-rose-400": variant === "danger",
              "text-text-secondary": variant === "neutral",
            }
          )}
        >
          {timeText}
        </span>
      </div>
      <ProgressBar value={progress} variant={variant} />
    </div>
  );
}
