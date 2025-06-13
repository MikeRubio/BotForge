export interface BotForgeMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  type: "text" | "image" | "file";
  metadata?: any;
  isError?: boolean;
}

export interface BotForgeMessageData {
  id?: string;
  content?: string;
  sender?: "user" | "bot";
  timestamp?: string;
  type?: "text" | "image" | "file";
  metadata?: any;
}

export interface BotForgeTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  buttonSize?: "small" | "medium" | "large";
  chatHeight?: string;
  chatWidth?: string;
  headerColor?: string;
  userMessageColor?: string;
  botMessageColor?: string;
}

export interface BotForgePosition {
  bottom?: string;
  right?: string;
  left?: string;
  top?: string;
}

export interface BotForgeUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface BotForgeEvents {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: BotForgeMessage) => void;
  onUserMessage?: (message: BotForgeMessage) => void;
  onBotMessage?: (message: BotForgeMessage) => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export interface BotForgeConfig {
  chatbotId: string; // Required: The chatbot ID from BotForge platform
  apiUrl?: string; // Optional: Defaults to BotForge's backend
  anonKey?: string; // Optional: BotForge's anon key (for better auth)
  theme?: BotForgeTheme;
  position?: BotForgePosition;
  autoOpen?: boolean;
  showBranding?: boolean;
  user?: BotForgeUser;
  events?: BotForgeEvents;
  enableFileUpload?: boolean;
  enableEmoji?: boolean;
  enableTypingIndicator?: boolean;
  maxMessages?: number;
  greeting?: string;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  language?: string;
  debug?: boolean;
}

export interface BotForgeAPI {
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (message: string) => Promise<void>;
  setUser: (user: BotForgeUser) => void;
  isOpen: () => boolean;
  destroy: () => void;
  updateConfig: (config: Partial<BotForgeConfig>) => void;
}

export interface APIResponse {
  success: boolean;
  data?: {
    message?: string;
    conversationId: string;
    userIdentifier: string;
    welcomeMessage?: BotForgeMessageData;
    botMessage?: BotForgeMessageData;
    userMessage?: BotForgeMessageData;
    metadata?: any;
  };
  error?: string;
}

export interface ConversationState {
  id: string | null;
  userIdentifier: string | null;
  isInitialized: boolean;
  messages: BotForgeMessage[];
}
