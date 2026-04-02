// ============================================================
// src/index.js
// React entry point — imports global CSS then renders App
// ============================================================
import React    from "react";
import ReactDOM from "react-dom/client";

// ── Global stylesheets (order matters) ────────────────────
import "./styles/global.css";      // design tokens, resets, animations
import "./styles/components.css";  // reusable component classes
import "./styles/pages.css";       // page-specific styles

import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
