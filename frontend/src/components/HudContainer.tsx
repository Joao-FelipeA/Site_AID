import type { ReactNode } from "react";

export function HudContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hud-container mx-auto w-full mb-1 flex flex-col items-center ${className}`}>
      <div className="corner-accent-tl" />
      <div className="corner-accent-br" />
      {children}
    </div>
  );
}
