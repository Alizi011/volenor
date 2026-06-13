import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Shield, Users, BarChart3 } from "lucide-react";
import { trpc } from "@/providers/trpc";

const features = [
  { icon: Archive, label: "Dokumentarkiv", desc: "Organiser alle dine dokumenter" },
  { icon: BarChart3, label: "Økonomioversikt", desc: "Full kontroll på økonomien" },
  { icon: Shield, label: "Inkassohåndtering", desc: "Følg opp gjeld og saker" },
  { icon: Users, label: "Familiestyring", desc: "Oversikt for hele familien" },
];

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@perun.no");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();

  const isRegister = mode === "register";
  const isLoading = login.isPending || register.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await register.mutateAsync({ name, email, password });
      } else {
        await login.mutateAsync({ email, password });
      }

      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt.");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 shadow-lg"
            style={{
              backgroundColor: "var(--accent-yellow)",
              color: "#0a0a0a",
            }}
          >
            V
          </div>

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Volenor
          </h1>

          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Ditt digitale familiearkiv
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center text-center p-4 rounded-xl"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <f.icon
                size={24}
                style={{ color: "var(--accent-yellow)", marginBottom: "0.5rem" }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {f.label}
              </span>
              <span className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {f.desc}
              </span>
            </div>
          ))}
        </div>

        <Card
          className="border-0 shadow-xl"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <CardHeader className="text-center pb-2">
            <CardTitle
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {isRegister ? "Opprett bruker" : "Velkommen tilbake"}
            </CardTitle>

            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {isRegister
                ? "Lag din første Volenor-konto"
                : "Logg inn for å fortsette til ditt arkiv"}
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <input
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                  }}
                  placeholder="Navn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              <input
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                }}
                placeholder="E-post"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                }}
                placeholder="Passord"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isRegister ? 8 : 1}
              />

              {error && (
                <p className="text-sm text-center" style={{ color: "#ef4444" }}>
                  {error}
                </p>
              )}

              <Button
                className="w-full font-semibold text-sm transition-all duration-200 hover:opacity-90"
                size="lg"
                disabled={isLoading}
                style={{
                  backgroundColor: "var(--accent-yellow)",
                  color: "#0a0a0a",
                }}
                type="submit"
              >
                {isLoading
                  ? "Venter..."
                  : isRegister
                    ? "Registrer bruker"
                    : "Logg inn"}
              </Button>
            </form>

            <button
              type="button"
              className="w-full text-center text-xs mt-4"
              style={{ color: "var(--text-muted)" }}
              onClick={() => {
                setError("");
                setMode(isRegister ? "login" : "register");
              }}
            >
              {isRegister
                ? "Har du allerede konto? Logg inn"
                : "Har du ikke konto? Registrer deg"}
            </button>
          </CardContent>
        </Card>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          Volenor &copy; {new Date().getFullYear()} &middot; Digitalt familiearkiv
        </p>
      </div>
    </div>
  );
}