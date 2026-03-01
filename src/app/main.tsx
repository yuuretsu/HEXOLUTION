import "./index.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./app";

const isElectron = navigator.userAgent.toLowerCase().includes('electron');

if (isElectron) {
  document.body.classList.add('is-electron');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electron?.ipcRenderer?.on('fullscreen-state', (_: any, isFullscreen: boolean) => {
    console.log(isFullscreen);
    if (isFullscreen) {
      document.body.classList.add('is-fullscreen');
    } else {
      document.body.classList.remove('is-fullscreen');
    }
  });
}

document.addEventListener('wheel', function (event) {
  if (event.ctrlKey) {
    event.preventDefault();
  }
}, { passive: false });



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
