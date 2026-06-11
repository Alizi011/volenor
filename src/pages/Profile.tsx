import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
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
            <p style={{ color: "var(--text-secondary)" }}>
              Du må logge inn for å se profilen din.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate("/login")}
              style={{
                backgroundColor: "var(--accent-yellow)",
                color: "#0a0a0a",
              }}
            >
              Logg inn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("nb-NO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Ukjent";

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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
              Profil
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Administrer din konto
            </p>
          </div>
        </div>

        {/* Profile card */}
        <Card
          className="mb-6 border-0"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl"
                  style={{
                    backgroundColor: "var(--accent-yellow)",
                    color: "#0a0a0a",
                  }}
                >
                  {(user.name || "S").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.name || "Bruker"}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user.email || "Ingen e-post"}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-xs mt-2 px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor:
                      user.role === "admin"
                        ? "var(--accent-orange)"
                        : "var(--bg-tertiary)",
                    color: "#0a0a0a",
                  }}
                >
                  <Shield size={12} />
                  {user.role === "admin" ? "Administrator" : "Bruker"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card
          className="mb-6 border-0"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <CardHeader>
            <CardTitle
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Kontoinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User size={18} style={{ color: "var(--accent-yellow)" }} />
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Navn
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.name || "Ikke angitt"}
                </p>
              </div>
            </div>
            <div
              className="h-px"
              style={{ backgroundColor: "var(--border-color)" }}
            />
            <div className="flex items-center gap-3">
              <Mail size={18} style={{ color: "var(--accent-yellow)" }} />
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  E-post
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.email || "Ikke angitt"}
                </p>
              </div>
            </div>
            <div
              className="h-px"
              style={{ backgroundColor: "var(--border-color)" }}
            />
            <div className="flex items-center gap-3">
              <Shield size={18} style={{ color: "var(--accent-yellow)" }} />
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Rolle
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.role === "admin" ? "Administrator" : "Standardbruker"}
                </p>
              </div>
            </div>
            <div
              className="h-px"
              style={{ backgroundColor: "var(--border-color)" }}
            />
            <div className="flex items-center gap-3">
              <Calendar size={18} style={{ color: "var(--accent-yellow)" }} />
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Medlem siden
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {joinDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin link */}
        {user.role === "admin" && (
          <Card
            className="mb-6 border-0 cursor-pointer transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--accent-orange)",
              color: "#0a0a0a",
            }}
            onClick={() => navigate("/admin")}
          >
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={20} />
                <div>
                  <p className="text-sm font-semibold">Administrasjonspanel</p>
                  <p className="text-xs opacity-80">
                    Se brukere og systemstatistikk
                  </p>
                </div>
              </div>
              <ArrowLeft size={16} className="rotate-180" />
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full font-medium"
          size="lg"
          onClick={logout}
          style={{
            borderColor: "var(--accent-red)",
            color: "var(--accent-red)",
            backgroundColor: "transparent",
          }}
        >
          <LogOut size={18} className="mr-2" />
          Logg ut
        </Button>
      </div>
    </div>
  );
}
