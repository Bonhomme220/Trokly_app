"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { TroklyNotification } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<TroklyNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/notifications")
      .then(res => setNotifications(res.data.data || res.data || []))
      .finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  async function markRead(id: number) {
    await api.post(`/notifications/${id}/read`).catch(() => {});
    setNotifications(n => n.map(x => x.id === id ? { ...x, read_at: new Date().toISOString() } : x));
  }

  async function markAllRead() {
    await api.post("/notifications/read-all").catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
  }

  const unread = notifications.filter(n => !n.read_at);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center relative" style={{ background: "rgba(0,208,132,0.1)" }}>
            <Bell size={20} style={{ color: "#00D084" }} />
            {unread.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: "#00D084", color: "#0B1A2B" }}>
                {unread.length}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0B1A2B" }}>Notifications</h1>
            <p className="text-sm" style={{ color: "#8A99AA" }}>{unread.length} non lue{unread.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {unread.length > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} />
            Tout marquer lu
          </Button>
        )}
      </div>

      {dataLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="card h-16 animate-pulse" style={{ background: "#E8E4DF" }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={40} className="mx-auto mb-3 opacity-15" style={{ color: "#0B1A2B" }} />
          <p className="font-semibold" style={{ color: "#0B1A2B" }}>Aucune notification</p>
          <p className="text-sm mt-1" style={{ color: "#8A99AA" }}>Vous serez notifié ici de l'activité sur vos annonces et trocs.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <button
              key={notif.id}
              className="w-full card p-4 text-left transition-all"
              style={{
                background: notif.read_at ? "white" : "rgba(0,208,132,0.04)",
                borderColor: notif.read_at ? "rgba(11,26,43,0.08)" : "rgba(0,208,132,0.2)",
              }}
              onClick={() => !notif.read_at && markRead(notif.id)}
            >
              <div className="flex items-start gap-3">
                {!notif.read_at && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#00D084" }} />
                )}
                <div className={!notif.read_at ? "" : "pl-5"}>
                  <p className="font-semibold text-sm" style={{ color: "#0B1A2B" }}>{notif.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#8A99AA" }}>{notif.body}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(138,153,170,0.7)" }}>{formatDate(notif.created_at)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
