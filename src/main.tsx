import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkAndClearOldStorage } from "./utils/storageVersioning";

// Check storage version before rendering app
checkAndClearOldStorage();

createRoot(document.getElementById("root")!).render(<App />);
