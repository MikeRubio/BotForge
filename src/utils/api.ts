import { BotForgeMessage, APIResponse, BotForgeUser } from "../types";

export class BotForgeAPIClient {
  private baseUrl: string;
  private chatbotId: string;
  private conversationId: string | null = null;
  private userIdentifier: string | null = null;
  private debug: boolean = false;

  constructor(
    chatbotId: string,
    apiUrl: string = "https://api.botforge.site",
    debug: boolean = false
  ) {
    this.chatbotId = chatbotId;
    this.baseUrl = apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.debug = debug;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log("[BotForge Widget]", ...args);
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<APIResponse> {
    const url = `${this.baseUrl}/functions/v1/${endpoint}`;

    this.log("Making request to:", url, "with data:", data);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      this.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        this.log("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.log("Response data:", result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.log("Request failed:", error);
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
    this.log("Initializing conversation for chatbot:", this.chatbotId);

    const response = await this.makeRequest("widget-chat", {
      chatbotId: this.chatbotId,
      action: "initialize",
      userIdentifier: this.userIdentifier,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to initialize conversation");
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

    const response = await this.makeRequest("widget-chat", {
      chatbotId: this.chatbotId,
      conversationId: this.conversationId,
      message: content,
      messageType: type,
      userIdentifier: this.userIdentifier,
      action: "send_message",
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to send message");
    }

    const userMessage: BotForgeMessage = {
      id: response.data.userMessage?.id || `user-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(response.data.userMessage?.timestamp || Date.now()),
      type,
    };

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
      throw new Error(response.error || "Failed to get chatbot flow");
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

  reset() {
    this.conversationId = null;
    this.userIdentifier = null;
    this.log("API client reset");
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
  const fallbackResponses = [
    "I understand your message. Let me help you with that.",
    "Thank you for your message. How can I assist you further?",
    "I'm here to help! Could you please provide more details?",
    "I appreciate you reaching out. What specific information do you need?",
  ];

  const randomResponse =
    fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

  return {
    id: `fallback-${Date.now()}`,
    content: randomResponse,
    sender: "bot",
    timestamp: new Date(),
    type: "text",
    metadata: { fallback: true },
  };
};
