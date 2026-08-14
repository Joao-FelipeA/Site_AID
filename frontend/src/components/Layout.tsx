import type { ReactNode } from "react";
import { Header } from "./Header";

export function Layout({ children, largura = "max-w-[420px]" }: { children: ReactNode; largura?: string }) {
  return (
    <div className="flex flex-col min-h-screen relative z-0 overflow-x-hidden bg-background text-white font-body">
      <Header />
      <main className="flex-grow flex flex-col items-center pt-4 pb-1 px-4 w-full relative z-10">
        <div className={`w-full ${largura} flex flex-col gap-4`}>{children}</div>
      </main>
    </div>
  );
}
