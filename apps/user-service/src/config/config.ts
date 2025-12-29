import path from "path";
import { config as loadEnv } from "dotenv";

// Always load env from the user-service package root, not the repo root.
// This matters when running via Turborepo (cwd is often the monorepo root).
loadEnv({ path: path.resolve(__dirname, "../../.env") });

const { MONGO_URI, PORT, JWT_SECRET, NODE_ENV, MESSAGE_BROKER_URL } = process.env;

const port = Number(PORT ?? 4000);

export default {
    MONGO_URI,
    PORT: Number.isFinite(port) ? port : 4000,
    JWT_SECRET,
    env: NODE_ENV,
    msgBrokerURL: MESSAGE_BROKER_URL,
};
