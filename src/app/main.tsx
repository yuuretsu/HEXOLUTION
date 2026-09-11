import "./index.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./app";

type ElectronApi = {
  ipcRenderer: {
    on: (
      channel: string,
      listener: (event: unknown, isFullscreen: boolean) => void,
    ) => void;
  };
};

type ElectronWindow = Window & {
  electron?: ElectronApi;
};

const isElectron = navigator.userAgent.toLowerCase().includes('electron');

if (isElectron) {
  document.body.classList.add('is-electron');

  const electronWindow: ElectronWindow = window;
  electronWindow.electron?.ipcRenderer?.on('fullscreen-state', (_event, isFullscreen) => {
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
