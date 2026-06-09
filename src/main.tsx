import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorHandlers } from "./lib/telemetry";
import { registerSwGuarded } from "./pwa/registerSw";

installGlobalErrorHandlers();
registerSwGuarded();

createRoot(document.getElementById("root")!).render(<App />);
