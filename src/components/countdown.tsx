"use client";

import { useEffect, useState } from "react";

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setLabel(remaining(expiresAt));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  return <p className="text-sm font-bold">Tipo bloqueado · {label ?? "…"}</p>;
}

function remaining(expiresAt: string) {
  const seconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
