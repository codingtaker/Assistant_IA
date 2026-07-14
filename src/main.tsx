import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
// Bootstrap utility classes (grid, containers, spacing utilities only)
import "bootstrap/dist/css/bootstrap.min.css";

createRoot(document.getElementById("root")!).render(<App />);
