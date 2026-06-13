import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  appSecret: required("APP_SECRET"),
  databaseUrl: required("DATABASE_URL"),
  isProduction: process.env.NODE_ENV === "production",

  adminEmail: process.env.ADMIN_EMAIL ?? "admin@perun.no",
};