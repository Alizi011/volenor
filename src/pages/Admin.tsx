import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Users,
  Archive,
  CheckSquare,
  Gavel,
  BarChart3,
  Shield,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card
      className="border-0"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color + "20" }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          <div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } =
    trpc.admin.stats.useQuery(undefined, {
      enabled: user?.role === "admin",
      retry: false,
    });

  const { data: userList, isLoading: usersLoading } =
    trpc.admin.users.list.useQuery(undefined, {
      enabled: user?.role === "admin",
      retry: false,
    });

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <Skeleton className="h-32 w-96" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <Card
          className="w-full max-w-sm border-0"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <CardContent className="pt-6 text-center">
            <Shield
              size={48}
              className="mx-auto mb-4"
              style={{ color: "var(--accent-red)" }}
            />
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Ingen tilgang
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Du må være administrator for å se denne siden.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 text-sm font-medium underline"
              style={{ color: "var(--accent-yellow)" }}
            >
              Tilbake til forsiden
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <ArrowLeft size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Administrasjon
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Systemoversikt og brukeradministrasjon
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Brukere"
              value={stats.totalUsers}
              color="var(--accent-blue)"
            />
            <StatCard
              icon={Archive}
              label="Dokumenter"
              value={stats.totalDocuments}
              color="var(--accent-yellow)"
            />
            <StatCard
              icon={CheckSquare}
              label="Oppgaver"
              value={stats.totalTasks}
              color="var(--accent-green)"
            />
            <StatCard
              icon={Gavel}
              label="Inkassosaker"
              value={stats.totalDebtCases}
              color="var(--accent-orange)"
            />
            <StatCard
              icon={BarChart3}
              label="Finansposter"
              value={stats.totalFinances}
              color="var(--accent-purple)"
            />
          </div>
        ) : null}

        {/* Users table */}
        <Card
          className="border-0"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <CardHeader>
            <CardTitle
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <Users size={18} style={{ color: "var(--accent-yellow)" }} />
              Brukere
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                {userList?.length ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : userList && userList.length > 0 ? (
              <div className="space-y-2">
                {/* Table header */}
                <div
                  className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  <div className="col-span-4">Bruker</div>
                  <div className="col-span-4">E-post</div>
                  <div className="col-span-2">Rolle</div>
                  <div className="col-span-2">Registrert</div>
                </div>

                {userList.map((u) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 rounded-xl items-center"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                    }}
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: "var(--accent-yellow)",
                          color: "#0a0a0a",
                        }}
                      >
                        {(u.name || "B").charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {u.name || "Ukjent bruker"}
                      </span>
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <Mail
                        size={14}
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span
                        className="text-sm truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {u.email || "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            u.role === "admin"
                              ? "var(--accent-orange)"
                              : "var(--bg-secondary)",
                          color: u.role === "admin" ? "#0a0a0a" : "var(--text-secondary)",
                        }}
                      >
                        <Shield size={10} />
                        {u.role === "admin" ? "Admin" : "Bruker"}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Calendar
                        size={14}
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("nb-NO")
                          : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User
                  size={32}
                  className="mx-auto mb-2"
                  style={{ color: "var(--text-muted)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Ingen brukere funnet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
