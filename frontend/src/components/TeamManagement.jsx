import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Users,
  ShieldCheck,
  Crown,
  Lock,
  X,
  Filter,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
 
// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div
    style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: 9999,
    }}
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 18px",
          borderRadius: "10px",
          background: t.type === "success"
            ? "rgba(16,185,129,0.15)"
            : "rgba(239,68,68,0.15)",
          border: `1px solid ${t.type === "success"
            ? "rgba(16,185,129,0.35)"
            : "rgba(239,68,68,0.35)"}`,
          color: t.type === "success" ? "#6ee7b7" : "#fca5a5",
          fontSize: "0.85rem",
          fontWeight: "500",
          backdropFilter: "blur(8px)",
          minWidth: "240px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "slideIn 0.2s ease",
        }}
      >
        {t.type === "success"
          ? <CheckCircle size={16} style={{ flexShrink: 0 }} />
          : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1 }}>{t.message}</span>
        <button
          onClick={() => removeToast(t.id)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "inherit", opacity: 0.6, padding: 0, flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);
 
// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ config, onConfirm, onCancel }) => {
  if (!config) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{
          padding: "28px 32px",
          maxWidth: "400px",
          width: "90%",
          borderRadius: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
            background: config.danger ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {config.danger
              ? <Trash2 size={18} color="#fca5a5" />
              : <ShieldCheck size={18} color="#a5b4fc" />}
          </div>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>
            {config.title}
          </h3>
        </div>
 
        <p style={{ margin: "0 0 24px", fontSize: "0.88rem", opacity: 0.6, lineHeight: 1.6 }}>
          {config.message}
        </p>
 
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={config.danger ? "btn btn-danger" : "btn btn-primary"}
            onClick={onConfirm}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
 
// ── Main Component ────────────────────────────────────────────────────────────
const TeamManagement = () => {
  const { API_URL, token, fetchUsers: refreshGlobalUsers } = useAuth();
 
  const [users, setUsers]           = useState([]);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading]       = useState(true);
  const [toasts, setToasts]         = useState([]);
  const [modal, setModal]           = useState(null); // { title, message, danger, confirmLabel, onConfirm }
 
  // ── Toast helpers ──
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);
 
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
 
  // ── Fetch local list ──
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
      addToast("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, addToast]);
 
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
 
  // ── Refresh both local list and global AuthContext users ──
  const refreshAll = useCallback(async () => {
    await fetchUsers();
    if (typeof refreshGlobalUsers === "function") {
      await refreshGlobalUsers();
    }
  }, [fetchUsers, refreshGlobalUsers]);
 
  // ── Role update ──
  const updateRole = (id, role, username) => {
    setModal({
      title: role === "Team Lead" ? "Promote Member" : "Demote Team Lead",
      message: `Are you sure you want to change ${username}'s role to "${role}"? This will affect their permissions immediately.`,
      danger: false,
      confirmLabel: role === "Team Lead" ? "Promote" : "Demote",
      onConfirm: async () => {
        setModal(null);
        try {
          const res = await fetch(`${API_URL}/auth/users/${id}/role`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role }),
          });
          const data = await res.json();
          if (data.success) {
            addToast(data.message || `Role updated to ${role}.`, "success");
            await refreshAll();
          } else {
            addToast(data.message || "Failed to update role.", "error");
          }
        } catch (err) {
          console.error(err);
          addToast("Something went wrong.", "error");
        }
      },
    });
  };
 
  // ── Delete user ──
  const deleteUser = (id, username) => {
    setModal({
      title: "Delete Member",
      message: `Are you sure you want to permanently delete "${username}"? This action cannot be undone.`,
      danger: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setModal(null);
        try {
          const res = await fetch(`${API_URL}/auth/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            addToast(data.message || "User deleted successfully.", "success");
            await refreshAll();
          } else {
            addToast(data.message || "Failed to delete user.", "error");
          }
        } catch (err) {
          console.error(err);
          addToast("Something went wrong.", "error");
        }
      },
    });
  };
 
  // ── Filtering ──
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });
 
  const totalMembers = users.length;
  const teamLeads    = users.filter((u) => u.role === "Team Lead").length;
  const admins       = users.filter((u) => u.role === "Admin").length;
 
  // ── Style helpers ──
  const getRoleBadge = (role) => {
    const base = {
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem",
      fontWeight: "600", letterSpacing: "0.03em", whiteSpace: "nowrap",
    };
    if (role === "Admin")
      return { ...base, background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" };
    if (role === "Team Lead")
      return { ...base, background: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" };
    return { ...base, background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" };
  };
 
  const filterPillStyle = (active) => ({
    padding: "6px 16px", borderRadius: "20px", fontSize: "0.78rem",
    fontWeight: "600", cursor: "pointer",
    border: active ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.1)",
    background: active ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)",
    color: active ? "#a5b4fc" : "rgba(200,205,230,0.6)",
    transition: "all 0.15s",
  });
 
  // ── Loading state ──
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
      <h2>Loading...</h2>
    </div>
  );
 
  return (
    <>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
 
      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />
 
      {/* Confirm modal */}
      <ConfirmModal
        config={modal}
        onConfirm={modal?.onConfirm}
        onCancel={() => setModal(null)}
      />
 
      <div
        className="animate-fade"
        style={{
          width: "100%",
          height: "100%",
          padding: "32px 40px",
          boxSizing: "border-box",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
 
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", margin: 0 }}>
              Workspace Members
            </h1>
            <p style={{ fontSize: "0.85rem", opacity: 0.45, margin: "4px 0 0" }}>
              Manage roles and access for your team
            </p>
          </div>
          <div style={{
            fontSize: "0.8rem", opacity: 0.4,
            padding: "6px 14px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}>
            {filteredUsers.length} of {totalMembers} members
          </div>
        </div>
 
        {/* ── Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {[
            { icon: <Users size={20} color="#818cf8" />, iconBg: "rgba(99,102,241,0.18)",  value: totalMembers, label: "Total Members" },
            { icon: <ShieldCheck size={20} color="#34d399" />, iconBg: "rgba(16,185,129,0.15)", value: teamLeads,    label: "Team Leads" },
            { icon: <Crown size={20} color="#f87171" />, iconBg: "rgba(239,68,68,0.15)",  value: admins,       label: "Admins" },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass-panel"
              style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: "16px" }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: stat.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.7rem", fontWeight: "700", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.72rem", opacity: 0.5, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
 
        {/* ── Search + Filter Bar ── */}
        <div className="glass-panel" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <Search size={18} style={{ opacity: 0.45, flexShrink: 0 }} />
            <input
              placeholder="Search by name, email or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ flex: 1, fontSize: "0.9rem", background: "transparent", border: "none", outline: "none" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
                  width: "24px", height: "24px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "rgba(200,205,230,0.7)", flexShrink: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
 
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", opacity: 0.4, marginRight: "4px" }}>Filter:</span>
            {["All", "Member", "Team Lead", "Admin"].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} style={filterPillStyle(roleFilter === r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
 
        {/* ── Members List ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {filteredUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: "48px 24px", textAlign: "center", opacity: 0.5 }}>
              <Users size={36} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No members match your search.</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="glass-panel"
                style={{
                  padding: "18px 24px",
                  display: "flex", alignItems: "center", gap: "18px",
                  width: "100%", boxSizing: "border-box",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: "50px", height: "50px", borderRadius: "50%",
                  background: user.avatarColor,
                  display: "flex", justifyContent: "center", alignItems: "center",
                  color: "#fff", fontWeight: "700", fontSize: "0.88rem",
                  flexShrink: 0, letterSpacing: "0.02em",
                }}>
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
 
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "600", fontSize: "1rem" }}>{user.username}</span>
                    <span style={getRoleBadge(user.role)}>
                      {user.role === "Admin"     && <Crown size={10} />}
                      {user.role === "Team Lead" && <ShieldCheck size={10} />}
                      {user.role}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.4 }}>
                    {user.email || `${user.username.toLowerCase().replace(/\s+/g, "")}@taskflow.io`}
                  </div>
                </div>
 
                {/* Actions */}
                {user.role === "Admin" ? (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    fontSize: "0.78rem", color: "rgba(239,68,68,0.65)", fontWeight: "600",
                    padding: "7px 14px", borderRadius: "8px",
                    background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)",
                    flexShrink: 0,
                  }}>
                    <Lock size={13} />
                    Protected
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                    {user.role === "Member" ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => updateRole(user._id, "Team Lead", user.username)}
                      >
                        <ArrowUpCircle size={15} />
                        Promote
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={() => updateRole(user._id, "Member", user.username)}
                      >
                        <ArrowDownCircle size={15} />
                        Demote
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteUser(user._id, user.username)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
 
      </div>
    </>
  );
};
 
export default TeamManagement;