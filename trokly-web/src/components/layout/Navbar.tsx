"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, Menu, X, LayoutDashboard, Truck, Microscope } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useLeadModal } from "@/contexts/LeadContext";

export default function Navbar() {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const { openLeadModal } = useLeadModal();
  const isAdmin = hasRole("admin") || hasRole("super_admin");
  const isExpert = hasRole("expert");
  const isDelivery = hasRole("delivery_agent");
  const dashboardHref = isAdmin ? "/admin" : isExpert ? "/expert" : isDelivery ? "/delivery" : "/seller";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(247,245,240,0.94)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(11,26,43,0.07)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: 60 }}>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/logo-horizontal.svg" alt="Trokly" style={{ height: 32, width: "auto" }} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-black/5"
            style={{ color: "#0B1A2B" }}
          >
            Marketplace
          </Link>

          {isAuthenticated ? (
            <>
              {(isAdmin || isExpert) && (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
                  style={{ background: "rgba(0,208,132,0.1)", color: "#00B070" }}
                >
                  <LayoutDashboard size={14} />
                  {isAdmin ? "Admin" : "Expert"}
                </Link>
              )}
              {isExpert && !isAdmin && (
                <Link
                  href="/expert"
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
                  style={{ background: "rgba(0,208,132,0.08)", color: "#00B070" }}
                >
                  <Microscope size={14} />
                  Expertise
                </Link>
              )}
              {isDelivery && (
                <Link
                  href="/delivery"
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
                  style={{ background: "rgba(0,208,132,0.08)", color: "#00B070" }}
                >
                  <Truck size={14} />
                  Livraisons
                </Link>
              )}
              <Link
                href={dashboardHref}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-black/5 flex items-center gap-1.5"
                style={{ color: "#0B1A2B" }}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <Link
                href="/notifications"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
                style={{ color: "#0B1A2B" }}
              >
                <Bell size={18} />
              </Link>

              {/* Avatar menu */}
              <Link
                href="/seller"
                className="flex items-center gap-2.5 ml-1 px-3 py-1.5 rounded-full transition-colors hover:bg-black/5"
                style={{ color: "#0B1A2B" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#0B1A2B", color: "#00D084" }}
                >
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user?.full_name?.split(" ")[0]}</span>
              </Link>

              <button
                onClick={logout}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 opacity-40 hover:opacity-70"
                style={{ color: "#0B1A2B" }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" onClick={openLeadModal}>Connexion</Button>
              <Button size="sm" onClick={openLeadModal}>Vendre mon iPhone</Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center"
          style={{ color: "#0B1A2B" }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-4 flex flex-col gap-1"
          style={{ borderColor: "rgba(11,26,43,0.07)", background: "#F7F5F0" }}
        >
          <Link
            href="/"
            className="px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: "#0B1A2B" }}
            onClick={() => setMenuOpen(false)}
          >
            Marketplace
          </Link>

          {isAuthenticated ? (
            <>
              {(isAdmin || isExpert) && (
                <Link href="/admin" className="px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ color: "#00B070" }} onClick={() => setMenuOpen(false)}>
                  {isAdmin ? "Admin" : "Expert"} Dashboard
                </Link>
              )}
              {isExpert && !isAdmin && (
                <Link href="/expert" className="px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ color: "#00B070" }} onClick={() => setMenuOpen(false)}>
                  <Microscope size={15} /> File expertise
                </Link>
              )}
              {isDelivery && (
                <Link href="/delivery" className="px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ color: "#00B070" }} onClick={() => setMenuOpen(false)}>
                  <Truck size={15} /> Mes livraisons
                </Link>
              )}
              <Link href={dashboardHref} className="px-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: "#0B1A2B" }} onClick={() => setMenuOpen(false)}>
                Mon dashboard
              </Link>
              <div className="divider my-1" />
              <button
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                style={{ color: "#CC0000" }}
                onClick={() => { logout(); setMenuOpen(false); }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Button variant="secondary" className="w-full" onClick={() => { setMenuOpen(false); openLeadModal(); }}>
                Rejoindre la liste
              </Button>
              <Button className="w-full" onClick={() => { setMenuOpen(false); openLeadModal(); }}>
                Vendre mon iPhone
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
