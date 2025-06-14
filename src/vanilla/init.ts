import { BotForgeConfig, BotForgeAPI } from "../types";
import { BotForgeWidget } from "../components/BotForgeWidget";
import * as ReactDOM from "react-dom/client";
import React from "react";

declare global {
  interface Window {
    BotForge: {
      initBotForge: (config: BotForgeConfig) => BotForgeAPI;
      version: string;
    };
  }
}

let widgetInstance: {
  root: ReactDOM.Root;
  container: HTMLElement;
  api: BotForgeAPI;
} | null = null;

export const initBotForge = (config: BotForgeConfig): BotForgeAPI => {
  if (!config.chatbotId) {
    throw new Error("BotForge: chatbotId is required");
  }

  if (widgetInstance) {
    widgetInstance.api.destroy();
    widgetInstance = null;
  }

  let container = document.getElementById("botforge-widget-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "botforge-widget-container";
    container.style.position = "fixed";
    container.style.zIndex = "9999";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
  }

  const root = ReactDOM.createRoot(container);
  let widgetRef: any = null;

  const api: BotForgeAPI = {
    open: () => widgetRef?.open?.(),
    close: () => widgetRef?.close?.(),
    toggle: () => widgetRef?.toggle?.(),
    sendMessage: (message) => widgetRef?.sendMessage?.(message),
    setUser: (user) => widgetRef?.setUser?.(user),
    isOpen: () => widgetRef?.isOpen?.() || false,
    destroy: () => {
      root.unmount();
      container.remove();
      widgetInstance = null;
    },
    updateConfig: (newConfig) => widgetRef?.updateConfig?.(newConfig),
  };

  root.render(
    React.createElement(BotForgeWidget, {
      ...config,
      ref: (ref: any) => (widgetRef = ref),
      style: { pointerEvents: "auto" },
    })
  );

  widgetInstance = { root, container, api };
  config.events?.onReady?.();

  return api;
};

if (typeof window !== "undefined") {
  window.BotForge = {
    initBotForge,
    version: "1.0.12",
  };
}
