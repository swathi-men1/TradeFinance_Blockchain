import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-60 bg-[#081028] border-r border-white/10 p-5">
        <h1 className="text-xl font-bold text-cyan-400 mb-6">TradeChain</h1>

        <div className="space-y-3 text-sm">
          <p className="hover:text-cyan-400 cursor-pointer">Dashboard</p>
          <p className="hover:text-cyan-400 cursor-pointer">Documents</p>
          <p className="hover:text-cyan-400 cursor-pointer">Transactions</p>
          <p className="hover:text-cyan-400 cursor-pointer">Risk</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
