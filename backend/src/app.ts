import cors from "cors";
import express from "express";
import { registerApiRoutes } from "./routes/api";
import { errorHandler } from "./middlewares/error-handler";

export const app = express();

app.use(cors());
app.use(express.json());

registerApiRoutes(app);

app.use(errorHandler);
