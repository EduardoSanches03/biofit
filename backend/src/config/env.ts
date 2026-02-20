import "dotenv/config";

const rawPort = Number(process.env.PORT ?? 3001);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL nao configurada. Defina no arquivo .env.");
}

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET nao configurada. Usando valor padrao inseguro para desenvolvimento.");
}

export const PORT = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3001;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
export const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || "7d";
