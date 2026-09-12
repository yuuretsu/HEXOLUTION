import "./index.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./app";
import { startWorkerApi } from "@/shared/api";

const bootstrap = () => {
  document.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    },
    { passive: false },
  );

  startWorkerApi();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

bootstrap();
