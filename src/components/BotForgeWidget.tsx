import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { ChatWindow } from "./ChatWindow";
import { ChatButton } from "./ChatButton";
import { BotForgeConfig, BotForgeMessage, BotForgeAPI } from "../types";
import { useBotForgeAPI } from "../hooks/useBotForgeAPI";

const defaultConfig: Partial<BotForgeConfig> = {
  theme: {
    primaryColor: "#3B82F6",
    backgroundColor: "#1f2937",
    textColor: "#f3f4f6",
    borderRadius: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    buttonSize: "medium",
    chatHeight: "600px",
    chatWidth: "400px",
    headerColor: "#1f2937",
    userMessageColor: "#3B82F6",
    botMessageColor: "#374151",
  },
  position: {
    bottom: "20px",
    right: "20px",
  },
  autoOpen: false,
  showBranding: true,
  enableFileUpload: false,
  enableEmoji: true,
  enableTypingIndicator: true,
  maxMessages: 100,
  greeting:
    "Hi! I'm your BotForge assistant. I can help you create chatbots, understand features, troubleshoot issues, and more. What would you like to know?",
  placeholder:
    "Ask me about BotForge features, pricing, or how to build chatbots...",
  title: "BotForge Support",
  subtitle: "Get instant help",
  language: "en",
  debug: false,
};

export interface BotForgeWidgetProps extends BotForgeConfig {
  className?: string;
  style?: React.CSSProperties;
}

export const BotForgeWidget = forwardRef<BotForgeAPI, BotForgeWidgetProps>(
  (props, ref) => {
    const config = { ...defaultConfig, ...props };

    // Validate required props
    if (!config.chatbotId) {
      console.error("[BotForge Widget] chatbotId is required");
      return null;
    }

    if (!config.apiUrl) {
      console.error("[BotForge Widget] apiUrl is required");
      return null;
    }

    if (!config.anonKey) {
      console.error("[BotForge Widget] anonKey is required");
      return null;
    }

    const [isOpen, setIsOpen] = useState(config.autoOpen || false);
    const [messages, setMessages] = useState<BotForgeMessage[]>([]);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string | null>(
      null
    );
    const widgetRef = useRef<HTMLDivElement>(null);
    const initializationTriggeredRef = useRef(false);

    const {
      isConnected,
      isLoading,
      conversationId,
      userIdentifier,
      error,
      isInitialized,
      initializeConversation,
      sendMessage: apiSendMessage,
      updateUser,
      setIsLoading,
      resetConversation,
    } = useBotForgeAPI({
      chatbotId: config.chatbotId,
      apiUrl: config.apiUrl,
      anonKey: config.anonKey,
      user: config.user,
      debug: config.debug,
      onError: (error) => {
        config.events?.onError?.(error);
        if (config.debug) {
          console.error("[BotForge Widget] Error:", error);
        }
      },
      onMessage: (message) => {
        if (config.debug) {
          console.log("[BotForge Widget] Adding message to UI:", message);
        }

        setMessages((prev) => {
          const newMessages = [...prev, message];
          // Limit messages if maxMessages is set
          if (config.maxMessages && newMessages.length > config.maxMessages) {
            return newMessages.slice(-config.maxMessages);
          }
          return newMessages;
        });

        // Mark as unread if chat is closed and it's a bot message
        if (!isOpen && message.sender === "bot") {
          setHasUnreadMessages(true);
        }

        // Trigger events
        config.events?.onMessage?.(message);
        if (message.sender === "user") {
          config.events?.onUserMessage?.(message);
        } else {
          config.events?.onBotMessage?.(message);
        }
      },
      onConnectionChange: (connected) => {
        if (connected) {
          setConnectionStatus(null);
        } else {
          setConnectionStatus("Connection lost - using offline mode");
        }
      },
    });

    // Initialize conversation only once when component mounts
    useEffect(() => {
      if (!isInitialized && !initializationTriggeredRef.current) {
        initializationTriggeredRef.current = true;

        if (config.debug) {
          console.log("[BotForge Widget] Starting initialization...");
        }

        initializeConversation()
          .then((welcomeMessage) => {
            if (config.debug) {
              console.log(
                "[BotForge Widget] Initialization complete, welcome message:",
                welcomeMessage
              );
            }

            if (welcomeMessage) {
              setMessages([welcomeMessage]);
              if (config.debug) {
                console.log("[BotForge Widget] Welcome message added to state");
              }
            }
            setIsLoading(false);
            config.events?.onReady?.();
          })
          .catch((error) => {
            setIsLoading(false);
            if (config.debug) {
              console.error("[BotForge Widget] Initialization failed:", error);
            }
          });
      }
    }, [isInitialized, initializeConversation, config.events, config.debug]);

    // Handle auto-open
    useEffect(() => {
      if (config.autoOpen && !isOpen && isInitialized) {
        setIsOpen(true);
        config.events?.onOpen?.();
      }
    }, [config.autoOpen, isOpen, config.events, isInitialized]);

    // Clear unread messages when chat is opened
    useEffect(() => {
      if (isOpen && hasUnreadMessages) {
        setHasUnreadMessages(false);
      }
    }, [isOpen, hasUnreadMessages]);

    // Show connection status notifications
    useEffect(() => {
      if (connectionStatus && config.debug) {
        console.log("[BotForge Widget]", connectionStatus);
      }
    }, [connectionStatus, config.debug]);

    const handleToggle = () => {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);

      if (newIsOpen) {
        config.events?.onOpen?.();
        setHasUnreadMessages(false);
      } else {
        config.events?.onClose?.();
      }
    };

    const handleSendMessage = async (
      content: string,
      type: "text" | "file" = "text"
    ) => {
      if (!content.trim()) {
        if (config.debug) {
          console.log("[BotForge Widget] Message send blocked: empty content");
        }
        return;
      }

      if (config.debug) {
        console.log("[BotForge Widget] Sending message:", content);
      }

      try {
        await apiSendMessage(content, type);
      } catch (error) {
        if (config.debug) {
          console.error("[BotForge Widget] Failed to send message:", error);
        }
      }
    };

    const handleFileUpload = async (file: File) => {
      if (!config.enableFileUpload) return;

      // For now, we'll send the file name as a message
      // In a full implementation, you'd upload the file to a server first
      await handleSendMessage(`📎 ${file.name}`, "file");
    };

    // Expose API methods via ref
    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setIsOpen(true);
          config.events?.onOpen?.();
          setHasUnreadMessages(false);
        },
        close: () => {
          setIsOpen(false);
          config.events?.onClose?.();
        },
        toggle: handleToggle,
        sendMessage: async (message: string) => {
          await handleSendMessage(message);
        },
        setUser: (user) => {
          updateUser(user);
        },
        isOpen: () => isOpen,
        destroy: () => {
          resetConversation();
          setMessages([]);
          setIsOpen(false);
          initializationTriggeredRef.current = false;
        },
        updateConfig: (newConfig) => {
          // This would require a more complex implementation to update config dynamically
          if (config.debug) {
            console.log(
              "[BotForge Widget] Config update requested:",
              newConfig
            );
          }
        },
      }),
      [
        isOpen,
        handleSendMessage,
        updateUser,
        resetConversation,
        config.events,
        config.debug,
      ]
    );

    const positionStyles: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      fontFamily: config.theme?.fontFamily,
      ...config.position,
    };

    if (config.debug) {
      console.log("[BotForge Widget] Render state:", {
        isOpen,
        messagesCount: messages.length,
        isLoading,
        isConnected,
        conversationId,
        isInitialized,
      });
    }

    return (
      <div
        ref={widgetRef}
        style={{ ...positionStyles, ...props.style }}
        className={props.className}
      >
        {isOpen && (
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onClose={handleToggle}
            isLoading={isLoading}
            isConnected={isConnected}
            config={config}
            error={error}
          />
        )}
        <ChatButton
          onClick={handleToggle}
          isOpen={isOpen}
          config={config}
          hasUnreadMessages={hasUnreadMessages}
        />
      </div>
    );
  }
);

BotForgeWidget.displayName = "BotForgeWidget";

export default BotForgeWidget;
