import { Outlet } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import AppNav from "@/components/AppNav";
import ComplianceFooter from "@/components/ComplianceFooter";

export default function Layout() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col md:max-w-2xl">
        <AppHeader />
        <main className="flex-1 px-5 pb-32 pt-5 md:px-8">
          <Outlet />
          <ComplianceFooter />
        </main>
        <AppNav />
      </div>
    </div>
  );
}