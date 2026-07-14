// Bootstrap must come BEFORE our CSS so Tailwind & our variables win on conflicts
import "bootstrap/dist/css/bootstrap.min.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);
