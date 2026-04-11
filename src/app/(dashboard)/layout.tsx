import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import SessionProvider from "@/components/providers/SessionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-[#0B0E11]">
        <Sidebar />
        <div className="flex flex-col flex-1 ml-[240px] min-h-screen">
          <Header />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
