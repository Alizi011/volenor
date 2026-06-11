import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Shield, Users, BarChart3 } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

const features = [
  { icon: Archive, label: "Dokumentarkiv", desc: "Organiser alle dine dokumenter" },
  { icon: BarChart3, label: "Økonomioversikt", desc: "Full kontroll på finansene" },
  { icon: Shield, label: "Inkassohåndtering", desc: "Følg opp gjeld og saker" },
  { icon: Users, label: "Familiestyring", desc: "Oversikt for hele familien" },
];

export default function Login() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 shadow-lg"
            style={{
              backgroundColor: "var(--accent-yellow)",
              color: "#0a0a0a",
            }}
          >
            S
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Synapse
          </h1>
          <p
            className="text-sm mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Ditt personlige digitale arkiv
          </p>
        </div>

        {/* Feature highlights */}
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
              <span
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {f.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Login card */}
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
              Velkommen tilbake
            </CardTitle>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Logg inn for å fortsette til ditt arkiv
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              className="w-full font-semibold text-sm transition-all duration-200 hover:opacity-90"
              size="lg"
              style={{
                backgroundColor: "var(--accent-yellow)",
                color: "#0a0a0a",
              }}
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              Logg inn med Kimi
            </Button>

            <p
              className="text-center text-xs mt-4"
              style={{ color: "var(--text-muted)" }}
            >
              Sikker innlogging med OAuth 2.0
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--text-muted)" }}
        >
          Synapse &copy; {new Date().getFullYear()} &middot; Personlig digital
          arkivløsning
        </p>
      </div>
    </div>
  );
}
