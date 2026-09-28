import { Sidebar } from "@/components/Sidebar";

// Every page in this segment reads live data (candidates, JDs, settings) —
// never statically prerender it.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-8">{children}</main>
    </div>
  );
}
