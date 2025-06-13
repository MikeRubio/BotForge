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
  const initializationAttemptedRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (apiClientRef.current) {
        apiClientRef.current.destroy();
      }
    };
  }, []);

  // Initialize API client
  useEffect(() => {
    if (!mountedRef.current) return;

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

    return () => {
      if (apiClientRef.current) {
        apiClientRef.current.destroy();
      }
    };
  }, [chatbotId, apiUrl, anonKey, debug, user?.id]);

  // Monitor connection status
  useEffect(() => {
    if (!apiClientRef.current) return;

    const checkConnection = () => {
      if (apiClientRef.current && mountedRef.current) {
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
      !mountedRef.current ||
      !apiClientRef.current ||
      isInitialized ||
      initializationAttemptedRef.current
    ) {
      if (debug) {
        console.log("[BotForge Widget] Skipping initialization:", {
          mounted: mountedRef.current,
          hasClient: !!apiClientRef.current,
          isInitialized,
          attempted: initializationAttemptedRef.current,
        });
      }
      return null;
    }

    initializationAttemptedRef.current = true;
    setIsLoading(true);
    setError(null);

    if (debug) {
      console.log("[BotForge Widget] Starting conversation initialization...");
    }

    try {
      const result = await apiClientRef.current.initializeConversation();

      if (!mountedRef.current) return null;

      setConversationId(result.conversationId);
      setUserIdentifier(result.userIdentifier);
      setIsInitialized(true);

      // Update connection status
      const isOffline = apiClientRef.current.isOffline();
      setIsConnected(!isOffline);

      if (debug) {
        console.log("[BotForge Widget] Conversation initialized:", result);
      }

      // Return the welcome message if it exists
      if (result.welcomeMessage) {
        if (debug) {
          console.log(
            "[BotForge Widget] Returning welcome message:",
            result.welcomeMessage
          );
        }
        return result.welcomeMessage;
      }

      return null;
    } catch (err) {
      if (!mountedRef.current) return null;

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

      // Reset the attempt flag on error so it can be retried
      initializationAttemptedRef.current = false;
      return null;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [debug, onError, isInitialized]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, type: "text" | "file" = "text") => {
      if (!mountedRef.current || !apiClientRef.current || !conversationId) {
        throw new Error("Conversation not initialized");
      }

      if (debug) {
        console.log("[BotForge Widget] Sending message:", content);
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiClientRef.current.sendMessage(content, type);

        if (!mountedRef.current) return result;

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
        if (!mountedRef.current) throw err;

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
        if (mountedRef.current) {
          setIsLoading(false);
        }
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

  // Reset conversation
  const resetConversation = useCallback(() => {
    if (apiClientRef.current) {
      apiClientRef.current.reset();
    }
    setConversationId(null);
    setIsInitialized(false);
    setIsConnected(true);
    setError(null);
    initializationAttemptedRef.current = false;
  }, []);

  return {
    // State
    isConnected,
    isLoading,
    conversationId,
    userIdentifier,
    error,
    isInitialized,

    // Actions
    initializeConversation,
    sendMessage,
    updateUser,
    getChatbotFlow,
    resetConversation,
  };
};
