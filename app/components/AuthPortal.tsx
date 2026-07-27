"use client";

import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type UserRole = "citizen" | "operator" | "admin";
type AuthUser = {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: UserRole;
  status: "active" | "suspended";
  createdAt: number;
  lastLoginAt: number | null;
};

type AdminUser = AuthUser & { reportCount?: number; teamCount?: number };
type Team = { id: string; name: string; description: string; status: string; memberCount: number };
type Notification = { id: string; title: string; message: string; kind: string; readAt: number | null; createdAt: number };
type Stats = { ownedReports: number; unreadNotifications: number; teamCount: number };

async function readJson(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Request failed.");
  return payload;
}

export default function AuthPortal() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<Stats>({ ownedReports: 0, unreadNotifications: 0, teamCount: 0 });
  const [mode, setMode] = useState<"login" | "register">("login");
  const [panel, setPanel] = useState(false);
  const [tab, setTab] = useState<"profile" | "notifications" | "users" | "teams">("profile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [membershipTeam, setMembershipTeam] = useState("");
  const [membershipUser, setMembershipUser] = useState("");

  const loadSession = async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const payload = (await response.json()) as { user: AuthUser; stats?: Stats };
      setUser(payload.user);
      setStats(payload.stats ?? { ownedReports: 0, unreadNotifications: 0, teamCount: 0 });
      setName(payload.user.name);
      setOrganization(payload.user.organization);
      document.documentElement.dataset.userRole = payload.user.role;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
  }, []);

  const authenticate = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name, organization }),
      });
      const payload = await readJson(response);
      const ownerClaimed = payload.ownerClaimed === true;
      sessionStorage.setItem(
        "civiclens-auth-message",
        ownerClaimed ? "Owner administrator account created successfully." : "Signed in successfully.",
      );
      window.location.reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const message = sessionStorage.getItem("civiclens-auth-message");
    if (message) {
      setSuccess(message);
      sessionStorage.removeItem("civiclens-auth-message");
      window.setTimeout(() => setSuccess(""), 4500);
    }
  }, [user]);

  const loadPanelData = async (nextTab = tab) => {
    if (!user) return;
    setError("");
    try {
      if (nextTab === "notifications") {
        const payload = await readJson(await fetch("/api/notifications", { cache: "no-store" }));
        setNotifications((payload.notifications as Notification[]) ?? []);
      }
      if (nextTab === "users" && user.role === "admin") {
        const payload = await readJson(await fetch("/api/users", { cache: "no-store" }));
        setAdminUsers((payload.users as AdminUser[]) ?? []);
      }
      if (nextTab === "teams") {
        const payload = await readJson(await fetch("/api/teams", { cache: "no-store" }));
        setTeams((payload.teams as Team[]) ?? []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load account data.");
    }
  };

  const openPanel = () => {
    setPanel(true);
    void loadPanelData(tab);
  };

  const changeTab = (nextTab: typeof tab) => {
    setTab(nextTab);
    void loadPanelData(nextTab);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await readJson(
        await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, organization }),
        }),
      );
      setUser(payload.user as AuthUser);
      setSuccess("Profile updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.reload();
  };

  const updateUserAccess = async (target: AdminUser, role: UserRole, status: "active" | "suspended") => {
    setError("");
    try {
      await readJson(
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: target.id, role, status }),
        }),
      );
      setAdminUsers((items) => items.map((item) => (item.id === target.id ? { ...item, role, status } : item)));
      setSuccess(`${target.name}'s access was updated.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Access update failed.");
    }
  };

  const createTeam = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await readJson(
        await fetch("/api/teams", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: teamName, description: teamDescription }),
        }),
      );
      setTeams((items) => [...items, payload.team as Team]);
      setTeamName("");
      setTeamDescription("");
      setSuccess("Response team created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Team creation failed.");
    } finally {
      setBusy(false);
    }
  };

  const addMembership = async () => {
    setError("");
    try {
      await readJson(
        await fetch("/api/teams", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ teamId: membershipTeam, userId: membershipUser, action: "add" }),
        }),
      );
      setSuccess("Team member assigned.");
      void loadPanelData("teams");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Membership update failed.");
    }
  };

  const markNotificationsRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    }).catch(() => undefined);
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? Date.now() })));
    setStats((current) => ({ ...current, unreadNotifications: 0 }));
  };

  if (loading) {
    return (
      <div className="auth-loading-screen" aria-label="Checking CivicLens account">
        <span className="auth-loader"><ShieldCheck size={22} /></span>
        <strong>Securing your workspace</strong>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-gate">
        <div className="auth-gate-glow" />
        <section className="auth-card">
          <header>
            <span><ShieldCheck size={24} /></span>
            <div><p>CIVICLENS SECURE ACCESS</p><h1>{mode === "login" ? "Welcome back" : "Create your civic account"}</h1></div>
          </header>
          <p className="auth-intro">
            Sign in to submit tracked reports, receive workflow updates, coordinate response teams and access role-based city operations.
          </p>
          <div className="auth-mode-switch">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => { setMode("login"); setError(""); }}><LogIn size={15} /> Sign in</button>
            <button className={mode === "register" ? "active" : ""} type="button" onClick={() => { setMode("register"); setError(""); }}><UserPlus size={15} /> Register</button>
          </div>
          <form onSubmit={authenticate}>
            {mode === "register" && (
              <>
                <label><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} /></label>
                <label><span>Organization <em>optional</em></span><input value={organization} onChange={(event) => setOrganization(event.target.value)} autoComplete="organization" /></label>
              </>
            )}
            <label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
            <label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={10} /></label>
            {mode === "register" && <small className="auth-password-note"><KeyRound size={13} /> Use at least 10 characters with letters and numbers. The first account becomes the owner administrator.</small>}
            {error && <div className="auth-message error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Open secure workspace" : "Create account"}<ChevronRight size={16} /></button>
          </form>
          <footer><span><CheckCircle2 size={14} /> HttpOnly sessions</span><span><ShieldCheck size={14} /> Role-based access</span><span><Users size={14} /> Multi-user ready</span></footer>
        </section>
      </div>
    );
  }

  return (
    <>
      {success && <div className="auth-toast"><CheckCircle2 size={15} /> {success}</div>}
      <button className="auth-account-dock" type="button" onClick={openPanel}>
        <span>{user.name.slice(0, 1).toUpperCase()}</span>
        <div><strong>{user.name}</strong><small>{user.role} · {stats.unreadNotifications} unread</small></div>
        <UserCog size={16} />
      </button>

      {panel && (
        <div className="auth-panel-shell" role="dialog" aria-modal="true" aria-label="CivicLens account center">
          <aside className="auth-panel-nav">
            <div className="auth-panel-user"><span>{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small><em>{user.role}</em></div></div>
            <button className={tab === "profile" ? "active" : ""} type="button" onClick={() => changeTab("profile")}><UserCog size={16} /> Profile</button>
            <button className={tab === "notifications" ? "active" : ""} type="button" onClick={() => changeTab("notifications")}><Bell size={16} /> Notifications {stats.unreadNotifications > 0 && <b>{stats.unreadNotifications}</b>}</button>
            {user.role === "admin" && <button className={tab === "users" ? "active" : ""} type="button" onClick={() => changeTab("users")}><Users size={16} /> Users & roles</button>}
            {(user.role === "operator" || user.role === "admin") && <button className={tab === "teams" ? "active" : ""} type="button" onClick={() => changeTab("teams")}><Building2 size={16} /> Response teams</button>}
            <button className="auth-logout" type="button" onClick={() => void logout()}><LogOut size={16} /> Sign out</button>
          </aside>
          <section className="auth-panel-content">
            <header><div><p>SECURE ACCOUNT CENTER</p><h2>{tab === "profile" ? "Profile & access" : tab === "notifications" ? "Notifications" : tab === "users" ? "User administration" : "Response teams"}</h2></div><button type="button" onClick={() => setPanel(false)} aria-label="Close account center"><X size={18} /></button></header>
            {error && <div className="auth-message error">{error}</div>}

            {tab === "profile" && (
              <div className="auth-profile-grid">
                <form onSubmit={saveProfile}>
                  <label><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label>
                  <label><span>Organization</span><input value={organization} onChange={(event) => setOrganization(event.target.value)} /></label>
                  <label><span>Email</span><input value={user.email} disabled /></label>
                  <button type="submit" disabled={busy}>Save profile</button>
                </form>
                <div className="auth-access-card"><span><ShieldCheck size={22} /></span><h3>{user.role} access</h3><p>{user.role === "admin" ? "Full user, team and city workflow administration." : user.role === "operator" ? "Authority workflow and response-team operations." : "Citizen reporting, personal report history and notifications."}</p><div><small>Owned reports</small><strong>{stats.ownedReports}</strong></div><div><small>Response teams</small><strong>{stats.teamCount}</strong></div></div>
              </div>
            )}

            {tab === "notifications" && (
              <div className="auth-notification-view">
                <button type="button" onClick={() => void markNotificationsRead()}>Mark all as read</button>
                <div>{notifications.length ? notifications.map((item) => <article className={item.readAt ? "" : "unread"} key={item.id}><span><Bell size={15} /></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(Number(item.createdAt)).toLocaleString()}</small></div></article>) : <p className="auth-empty">No notifications yet.</p>}</div>
              </div>
            )}

            {tab === "users" && user.role === "admin" && (
              <div className="auth-user-table">
                <div className="auth-table-head"><span>User</span><span>Role</span><span>Status</span><span>Activity</span></div>
                {adminUsers.map((item) => <article key={item.id}><div><span>{item.name.slice(0, 1).toUpperCase()}</span><p><strong>{item.name}</strong><small>{item.email}</small><em>{item.organization || "Independent citizen"}</em></p></div><select value={item.role} onChange={(event) => void updateUserAccess(item, event.target.value as UserRole, item.status)}><option value="citizen">Citizen</option><option value="operator">Operator</option><option value="admin">Admin</option></select><select value={item.status} onChange={(event) => void updateUserAccess(item, item.role, event.target.value as "active" | "suspended")}><option value="active">Active</option><option value="suspended">Suspended</option></select><p><strong>{Number(item.reportCount ?? 0)} reports</strong><small>{Number(item.teamCount ?? 0)} teams</small></p></article>)}
              </div>
            )}

            {tab === "teams" && (
              <div className="auth-team-view">
                {user.role === "admin" && <form onSubmit={createTeam}><label><span>New response team</span><input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Road Response North" required /></label><label><span>Description</span><input value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} placeholder="Road repair and inspection unit" /></label><button type="submit" disabled={busy}>Create team</button></form>}
                <div className="auth-team-grid">{teams.length ? teams.map((team) => <article key={team.id}><span><Building2 size={18} /></span><div><strong>{team.name}</strong><p>{team.description || "City response team"}</p><small>{Number(team.memberCount)} members · {team.status}</small></div></article>) : <p className="auth-empty">No teams assigned yet.</p>}</div>
                {user.role === "admin" && adminUsers.length > 0 && teams.length > 0 && <div className="auth-membership"><h3>Assign a member</h3><select value={membershipTeam} onChange={(event) => setMembershipTeam(event.target.value)}><option value="">Select team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><select value={membershipUser} onChange={(event) => setMembershipUser(event.target.value)}><option value="">Select user</option>{adminUsers.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</select><button type="button" disabled={!membershipTeam || !membershipUser} onClick={() => void addMembership()}>Assign</button></div>}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
