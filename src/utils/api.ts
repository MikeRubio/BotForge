import { BotForgeMessage, APIResponse, BotForgeUser } from "../types";

export class BotForgeAPIClient {
  private baseUrl: string;
  private anonKey: string | null;
  private chatbotId: string;
  private conversationId: string | null = null;
  private userIdentifier: string | null = null;
  private debug: boolean = false;
  private isInitializing: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 2;
  private isOfflineMode: boolean = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    chatbotId: string,
    apiUrl?: string,
    anonKey?: string,
    debug: boolean = false
  ) {
    this.chatbotId = chatbotId;

    // Default to BotForge's production backend
    this.baseUrl = (
      apiUrl || "https://zp1v56uxy8rdx5ypatb0ockcb9tr6a.supabase.co"
    ).replace(/\/$/, "");
    this.anonKey =
      anonKey ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwMXY1NnV4eThydng1eXBhdGIwb2NrY2I5dHI2YSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM2NzI5NzE5LCJleHAiOjIwNTIzMDU3MTl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"; // BotForge's anon key
    this.debug = debug;

    if (debug) {
      console.log("[BotForge Widget] Initialized with API URL:", this.baseUrl);
    }

    // Start connection monitoring
    this.startConnectionMonitoring();
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log("[BotForge Widget]", ...args);
    }
  }

  private startConnectionMonitoring() {
    // Check connection every 30 seconds if in offline mode
    this.connectionCheckInterval = setInterval(() => {
      if (this.isOfflineMode) {
        this.checkConnection();
      }
    }, 30000);
  }

  private async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/functions/v1/widget-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.anonKey}`,
        },
        body: JSON.stringify({
          chatbotId: this.chatbotId,
          action: "get_flow",
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok || response.status === 401) {
        this.isOfflineMode = false;
        this.log("Connection restored");
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async makeRequest(
    endpoint: string,
    data: any,
    retryAttempt: number = 0
  ): Promise<APIResponse> {
    // If we're in offline mode and this isn't a connection check, return fallback immediately
    if (this.isOfflineMode && retryAttempt === 0) {
      this.log("In offline mode, using fallback response");
      return {
        success: false,
        error: "Offline mode - using fallback response",
      };
    }

    const url = `${this.baseUrl}/functions/v1/${endpoint}`;
    this.log(
      "Making request to:",
      url,
      "with data:",
      data,
      "attempt:",
      retryAttempt + 1
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // Add authorization header
      if (this.anonKey) {
        headers["Authorization"] = `Bearer ${this.anonKey}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        this.log("Error response:", errorText);

        // If it's a server error and we haven't exceeded retry limit, retry
        if (response.status >= 500 && retryAttempt < this.maxRetries) {
          this.log(
            `Server error, retrying in ${(retryAttempt + 1) * 1000}ms...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, (retryAttempt + 1) * 1000)
          );
          return this.makeRequest(endpoint, data, retryAttempt + 1);
        }

        // If we've exhausted retries, enter offline mode
        if (retryAttempt >= this.maxRetries) {
          this.isOfflineMode = true;
          this.log("Entering offline mode due to repeated failures");
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.log("Response data:", result);

      // Reset retry count and offline mode on successful request
      this.retryCount = 0;
      this.isOfflineMode = false;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.log("Request failed:", error);

      // If it's a network error and we haven't exceeded retry limit, retry
      if (
        ((typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as any).name === "AbortError") ||
          (typeof error === "object" &&
            error !== null &&
            "message" in error &&
            ((error as any).message.includes("fetch") ||
              (error as any).message.includes("Failed to fetch")))) &&
        retryAttempt < this.maxRetries
      ) {
        this.log(
          `Network error, retrying in ${(retryAttempt + 1) * 2000}ms...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, (retryAttempt + 1) * 2000)
        );
        return this.makeRequest(endpoint, data, retryAttempt + 1);
      }

      // If we've exhausted retries, enter offline mode
      if (retryAttempt >= this.maxRetries) {
        this.isOfflineMode = true;
        this.log("Entering offline mode due to network errors");
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async initializeConversation(): Promise<{
    conversationId: string;
    userIdentifier: string;
    welcomeMessage?: BotForgeMessage;
  }> {
    // Prevent multiple simultaneous initialization attempts
    if (this.isInitializing) {
      this.log("Initialization already in progress, waiting...");
      let attempts = 0;
      while (this.isInitializing && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (this.conversationId && this.userIdentifier) {
        return {
          conversationId: this.conversationId,
          userIdentifier: this.userIdentifier,
        };
      }
    }

    // If already initialized, return existing data
    if (this.conversationId && this.userIdentifier) {
      this.log("Already initialized, returning existing data");
      return {
        conversationId: this.conversationId,
        userIdentifier: this.userIdentifier,
      };
    }

    this.isInitializing = true;
    this.log("Initializing conversation for chatbot:", this.chatbotId);

    try {
      const response = await this.makeRequest("widget-chat", {
        chatbotId: this.chatbotId,
        action: "initialize",
        userIdentifier: this.userIdentifier,
      });

      if (!response.success || !response.data) {
        // Use fallback initialization
        this.conversationId = `offline-${Date.now()}`;
        this.userIdentifier = this.userIdentifier || generateUserIdentifier();

        this.log("Using offline initialization:", {
          conversationId: this.conversationId,
          userIdentifier: this.userIdentifier,
        });

        const welcomeMessage: BotForgeMessage = {
          id: "welcome-offline",
          content:
            "Hello! I'm currently in offline mode, but I can still help you with basic questions.",
          sender: "bot",
          timestamp: new Date(),
          type: "text",
          metadata: { offline: true },
        };

        return {
          conversationId: this.conversationId,
          userIdentifier: this.userIdentifier,
          welcomeMessage,
        };
      }

      this.conversationId = response.data.conversationId;
      this.userIdentifier = response.data.userIdentifier;

      this.log("Conversation initialized:", {
        conversationId: this.conversationId,
        userIdentifier: this.userIdentifier,
      });

      // Return welcome message if provided
      const welcomeMessage = response.data.welcomeMessage
        ? {
            id: response.data.welcomeMessage.id || "welcome",
            content:
              response.data.welcomeMessage.content ||
              "Hello! How can I help you today?",
            sender: "bot" as const,
            timestamp: new Date(
              response.data.welcomeMessage.timestamp || Date.now()
            ),
            type: "text" as const,
          }
        : undefined;

      return {
        conversationId: this.conversationId,
        userIdentifier: this.userIdentifier,
        welcomeMessage,
      };
    } finally {
      this.isInitializing = false;
    }
  }

  async sendMessage(
    content: string,
    type: "text" | "file" = "text"
  ): Promise<{
    userMessage: BotForgeMessage;
    botMessage: BotForgeMessage;
  }> {
    if (!this.conversationId) {
      throw new Error(
        "Conversation not initialized. Call initializeConversation() first."
      );
    }

    this.log("Sending message:", content, "type:", type);

    const userMessage: BotForgeMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
      type,
    };

    // If we're in offline mode or the API fails, use fallback
    if (this.isOfflineMode) {
      const botMessage = createFallbackResponse(content);
      this.log("Using offline response for message");
      return { userMessage, botMessage };
    }

    const response = await this.makeRequest("widget-chat", {
      chatbotId: this.chatbotId,
      conversationId: this.conversationId,
      message: content,
      messageType: type,
      userIdentifier: this.userIdentifier,
      action: "send_message",
    });

    if (!response.success || !response.data) {
      // Use fallback response
      const botMessage = createFallbackResponse(content);
      this.log("Using fallback response due to API failure");
      return { userMessage, botMessage };
    }

    const botMessage: BotForgeMessage = {
      id: response.data.botMessage?.id || `bot-${Date.now()}`,
      content:
        response.data.botMessage?.content ||
        "I understand. How can I help you further?",
      sender: "bot",
      timestamp: new Date(response.data.botMessage?.timestamp || Date.now()),
      type: "text",
      metadata: response.data.botMessage?.metadata,
    };

    this.log("Messages created:", { userMessage, botMessage });

    return { userMessage, botMessage };
  }

  async getChatbotFlow(): Promise<any> {
    this.log("Getting chatbot flow for:", this.chatbotId);

    const response = await this.makeRequest("widget-chat", {
      chatbotId: this.chatbotId,
      action: "get_flow",
    });

    if (!response.success || !response.data) {
      // Return basic flow structure as fallback
      return {
        flow: {
          nodes: [
            {
              id: "start",
              type: "start",
              data: { content: "Hello! How can I help you today?" },
            },
          ],
          edges: [],
        },
        name: "Offline Bot",
        description: "Currently in offline mode",
      };
    }

    return response.data;
  }

  setUserIdentifier(userIdentifier: string) {
    this.userIdentifier = userIdentifier;
    this.log("User identifier set to:", userIdentifier);
  }

  getConversationId(): string | null {
    return this.conversationId;
  }

  getUserIdentifier(): string | null {
    return this.userIdentifier;
  }

  isOffline(): boolean {
    return this.isOfflineMode;
  }

  reset() {
    this.conversationId = null;
    this.userIdentifier = null;
    this.isInitializing = false;
    this.retryCount = 0;
    this.isOfflineMode = false;

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    this.log("API client reset");
  }

  destroy() {
    this.reset();
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }
}

// Utility functions
export const generateUserIdentifier = (): string => {
  // Try to get existing identifier from localStorage
  const storageKey = "botforge-user-id";
  let identifier = "";

  try {
    identifier = localStorage.getItem(storageKey) || "";
  } catch (e) {
    // localStorage might not be available
  }

  if (!identifier) {
    identifier = `user-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    try {
      localStorage.setItem(storageKey, identifier);
    } catch (e) {
      // localStorage might not be available
    }
  }

  return identifier;
};

export const createFallbackResponse = (
  userMessage: string
): BotForgeMessage => {
  const input = userMessage.toLowerCase();

  let response = "";

  if (
    input.includes("hello") ||
    input.includes("hi") ||
    input.includes("hey")
  ) {
    response =
      "Hello! I'm currently in offline mode, but I'm here to help. What can I assist you with?";
  } else if (input.includes("help") || input.includes("support")) {
    response =
      "I'd be happy to help! While I'm in offline mode, I can provide general assistance. What do you need help with?";
  } else if (
    input.includes("price") ||
    input.includes("cost") ||
    input.includes("pricing")
  ) {
    response =
      "For current pricing information, please visit our website or contact our sales team when the connection is restored.";
  } else if (input.includes("thank")) {
    response =
      "You're very welcome! Is there anything else I can help you with?";
  } else if (input.includes("bye") || input.includes("goodbye")) {
    response = "Goodbye! Feel free to reach out anytime. Have a great day!";
  } else if (
    input.includes("contact") ||
    input.includes("email") ||
    input.includes("phone")
  ) {
    response =
      "You can reach our support team at support@botforge.site. We'll get back to you as soon as possible!";
  } else if (input.includes("feature") || input.includes("what can you do")) {
    response =
      "I can help with general questions about our services. For detailed feature information, please visit our website or contact support.";
  } else {
    const responses = [
      "I understand your question. While I'm in offline mode, I recommend visiting our website or contacting support for detailed assistance.",
      "Thank you for your message. For the most accurate information, please reach out to our support team at support@botforge.site.",
      "I appreciate you reaching out! For comprehensive help with your inquiry, our support team will be able to assist you better.",
      "I see what you're asking about. Our support team can provide you with detailed information once the connection is restored.",
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  }

  return {
    id: `fallback-${Date.now()}`,
    content: response,
    sender: "bot",
    timestamp: new Date(),
    type: "text",
    metadata: { fallback: true, offline: true },
  };
};
