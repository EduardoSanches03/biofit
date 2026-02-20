import { app } from "./app";
import { PORT } from "./config/env";
import { ensureDatabase } from "./routes/api";

async function startServer() {
  try {
    await ensureDatabase();
    app.listen(PORT, () => {
      console.log(`BioFit API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar backend:", error);
    process.exit(1);
  }
}

void startServer();
