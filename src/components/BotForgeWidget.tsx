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
  // Default to BotForge's production backend
  apiUrl: "https://zp1v56uxy8rdx5ypatb0ockcb9tr6a.supabase.co",
  theme: {
    primaryColor: "#3B82F6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    borderRadius: "12px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    buttonSize: "medium",
    chatHeight: "500px",
    chatWidth: "380px",
    headerColor: "#3B82F6",
    userMessageColor: "#3B82F6",
    botMessageColor: "#f3f4f6",
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
  greeting: "Hello! How can I help you today?",
  placeholder: "Type your message...",
  title: "Chat with us",
  subtitle: "We're here to help",
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

        initializeConversation().then((welcomeMessage) => {
          if (welcomeMessage) {
            setMessages([welcomeMessage]);
          }
          config.events?.onReady?.();
        });
      }
    }, [isInitialized, initializeConversation, config.events]);

    // Handle auto-open
    useEffect(() => {
      if (config.autoOpen && !isOpen) {
        setIsOpen(true);
        config.events?.onOpen?.();
      }
    }, [config.autoOpen, isOpen, config.events]);

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
      if (!content.trim() || isLoading) return;

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
