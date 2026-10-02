import { Outlet } from "react-router-dom";
import AppHeader from "../components/AppHeader";

const LINKS = [
  { to: "/admin", label: "Financial Overview", end: true },
  { to: "/admin/fleet", label: "Live Fleet Map" },
  { to: "/admin/trips", label: "Trips Ledger" },
  { to: "/admin/drivers", label: "Driver Fleet" },
  { to: "/admin/riders", label: "Riders Directory" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader links={LINKS} basePath="/admin" />
      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
