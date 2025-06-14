import { useState, useEffect, useCallback, useRef } from "react";
import {
  BotForgeAPIClient,
  generateUserIdentifier,
  createFallbackResponse,
} from "../utils/api";
import { BotForgeMessage, BotForgeUser } from "../types";

interface UseBotForgeAPIProps {
  chatbotId: string;
  apiUrl?: string;
  anonKey?: string;
  user?: BotForgeUser;
  debug?: boolean;
  onError?: (error: Error) => void;
  onMessage?: (message: BotForgeMessage) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export const useBotForgeAPI = ({
  chatbotId,
  apiUrl,
  anonKey,
  user,
  debug = false,
  onError,
  onMessage,
  onConnectionChange,
}: UseBotForgeAPIProps) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const apiClientRef = useRef<BotForgeAPIClient | null>(null);
  const initializationInProgressRef = useRef(false);
  const apiClientCreatedRef = useRef(false);

  // Create a stable key for this widget instance
  const instanceKey = useRef(`widget-${chatbotId}-${Date.now()}`);

  // Initialize API client ONCE and ONLY ONCE
  useEffect(() => {
    if (apiClientCreatedRef.current) {
      if (debug) {
        console.log(
          "[BotForge Widget] API client already exists, skipping creation"
        );
      }
      return;
    }

    try {
      if (!apiUrl || !anonKey) {
        throw new Error("API URL and anonymous key are required");
      }

      if (debug) {
        console.log("[BotForge Widget] Creating API client...");
      }

      apiClientRef.current = new BotForgeAPIClient(
        chatbotId,
        apiUrl,
        anonKey,
        debug
      );

      // Set user identifier
      const identifier = user?.id || generateUserIdentifier();
      apiClientRef.current.setUserIdentifier(identifier);
      setUserIdentifier(identifier);

      // Mark as created to prevent recreation
      apiClientCreatedRef.current = true;

      if (debug) {
        console.log("[BotForge Widget] API client created successfully");
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to initialize API client");
      setError(error);
      onError?.(error);
      if (debug) {
        console.error(
          "[BotForge Widget] Failed to initialize API client:",
          error
        );
      }
    }
  }, [chatbotId, apiUrl, anonKey, debug, user?.id]);

  // Monitor connection status
  useEffect(() => {
    if (!apiClientRef.current) return;

    const checkConnection = () => {
      if (apiClientRef.current) {
        const isOffline = apiClientRef.current.isOffline();
        const newConnectionStatus = !isOffline;

        if (newConnectionStatus !== isConnected) {
          setIsConnected(newConnectionStatus);
          onConnectionChange?.(newConnectionStatus);

          if (debug) {
            console.log(
              "[BotForge Widget] Connection status changed:",
              newConnectionStatus ? "online" : "offline"
            );
          }
        }
      }
    };

    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, [isConnected, debug, onConnectionChange]);

  // Initialize conversation
  const initializeConversation = useCallback(async () => {
    if (
      !apiClientRef.current ||
      isInitialized ||
      initializationInProgressRef.current
    ) {
      if (debug) {
        console.log("[BotForge Widget] Skipping initialization:", {
          hasClient: !!apiClientRef.current,
          isInitialized,
          inProgress: initializationInProgressRef.current,
        });
      }
      return null;
    }

    initializationInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    if (debug) {
      console.log("[BotForge Widget] Starting conversation initialization...");
    }

    try {
      const result = await apiClientRef.current.initializeConversation();

      // CRITICAL: Update React state with the API result
      setConversationId(result.conversationId);
      setUserIdentifier(result.userIdentifier);
      setIsInitialized(true);

      // Update connection status
      const isOffline = apiClientRef.current.isOffline();
      setIsConnected(!isOffline);

      if (debug) {
        console.log("[BotForge Widget] Conversation initialized:", result);
        console.log("[BotForge Widget] React state updated with:", {
          conversationId: result.conversationId,
          userIdentifier: result.userIdentifier,
          isInitialized: true,
        });
      }

      // Always return a welcome message, even if none was provided
      const welcomeMessage = result.welcomeMessage || {
        id: "welcome-default",
        content:
          "Hi! I'm your BotForge assistant. I can help you create chatbots, understand features, troubleshoot issues, and more. What would you like to know?",
        sender: "bot" as const,
        timestamp: new Date(),
        type: "text" as const,
      };

      if (debug) {
        console.log(
          "[BotForge Widget] Returning welcome message:",
          welcomeMessage
        );
      }

      // If there's a follow-up message, add it after a short delay
      if (result.followUpMessage) {
        setTimeout(() => {
          if (debug) {
            console.log(
              "[BotForge Widget] Adding follow-up message:",
              result.followUpMessage
            );
          }
          if (result.followUpMessage) {
            onMessage?.(result.followUpMessage);
          }
        }, 1000);
      }

      return welcomeMessage;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to initialize conversation");
      setError(error);
      setIsConnected(false);
      onError?.(error);

      if (debug) {
        console.error("[BotForge Widget] Initialization failed:", error);
      }

      // Still mark as initialized and provide a fallback welcome message
      setIsInitialized(true);

      const fallbackWelcome: BotForgeMessage = {
        id: "welcome-fallback",
        content:
          "Hello! I'm currently in offline mode, but I can still help you with basic questions.",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
        metadata: { offline: true },
      };

      return fallbackWelcome;
    } finally {
      setIsLoading(false);
      initializationInProgressRef.current = false;
    }
  }, [debug, onError, isInitialized, onMessage]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, type: "text" | "file" = "text") => {
      if (!apiClientRef.current || !conversationId) {
        throw new Error("Conversation not initialized");
      }

      if (debug) {
        console.log("[BotForge Widget] Sending message:", content);
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiClientRef.current.sendMessage(content, type);

        // Update connection status
        const isOffline = apiClientRef.current.isOffline();
        setIsConnected(!isOffline);

        // Notify about messages
        if (debug) {
          console.log("[BotForge Widget] Message exchange complete:", result);
        }

        onMessage?.(result.userMessage);
        onMessage?.(result.botMessage);

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to send message");
        setError(error);
        onError?.(error);

        if (debug) {
          console.error("[BotForge Widget] Send message failed:", error);
        }

        // Create fallback response
        const userMessage: BotForgeMessage = {
          id: `user-${Date.now()}`,
          content,
          sender: "user",
          timestamp: new Date(),
          type,
        };

        const botMessage = createFallbackResponse(content);

        onMessage?.(userMessage);
        onMessage?.(botMessage);

        return { userMessage, botMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, debug, onError, onMessage]
  );

  // Update user information
  const updateUser = useCallback((newUser: BotForgeUser) => {
    if (newUser.id && apiClientRef.current) {
      apiClientRef.current.setUserIdentifier(newUser.id);
      setUserIdentifier(newUser.id);
    }
  }, []);

  // Get chatbot flow
  const getChatbotFlow = useCallback(async () => {
    if (!apiClientRef.current) return null;

    try {
      return await apiClientRef.current.getChatbotFlow();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to get chatbot flow");
      setError(error);
      onError?.(error);
      return null;
    }
  }, [onError]);

  // Reset conversation - DO NOT reset the API client
  const resetConversation = useCallback(() => {
    if (debug) {
      console.log("[BotForge Widget] Resetting conversation state only");
    }

    // Only reset conversation-specific state, NOT the API client
    setConversationId(null);
    setIsInitialized(false);
    setIsConnected(true);
    setError(null);
    initializationInProgressRef.current = false;

    // Reset conversation in API client without destroying it
    if (apiClientRef.current) {
      apiClientRef.current.reset();
    }
  }, [debug]);

  return {
    // State
    isConnected,
    isLoading,
    conversationId,
    userIdentifier,
    error,
    isInitialized,
    setIsLoading,

    // Actions
    initializeConversation,
    sendMessage,
    updateUser,
    getChatbotFlow,
    resetConversation,
  };
};
