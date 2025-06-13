// Main exports for the package
export { BotForgeWidget } from "./components/BotForgeWidget";
export { initBotForge } from "./vanilla/init";

// Type exports
export type {
  BotForgeConfig,
  BotForgeTheme,
  BotForgePosition,
  BotForgeUser,
  BotForgeEvents,
  BotForgeMessage,
  BotForgeAPI,
  BotForgeMessageData,
} from "./types";

// Utility exports
export { BotForgeAPIClient, generateUserIdentifier } from "./utils/api";
export { useBotForgeAPI } from "./hooks/useBotForgeAPI";

// Version
export const version = "1.0.0";
