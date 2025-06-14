import React, { useState, useRef, useEffect } from "react";
import { BotForgeMessage, BotForgeConfig } from "../types";

interface ChatWindowProps {
  messages: BotForgeMessage[];
  onSendMessage: (content: string, type?: "text" | "file") => void;
  onFileUpload?: (file: File) => void;
  onClose: () => void;
  onRestart?: () => void;
  isLoading: boolean;
  isConnected: boolean;
  config: BotForgeConfig;
  error?: Error | null;
  isInitialized: boolean;
  conversationId: string | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  onFileUpload,
  onClose,
  onRestart,
  isLoading,
  isConnected,
  config,
  error,
  isInitialized,
  conversationId,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current && isInitialized) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && isInitialized && conversationId) {
      if (config.debug) {
        console.log("[BotForge Widget] Submitting message:", inputValue.trim());
      }
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (config.debug) {
      console.log("[BotForge Widget] Input value changed:", e.target.value);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // Reset input
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle quick reply option clicks
  const handleQuickReply = (option: string) => {
    if (config.debug) {
      console.log("[BotForge Widget] Quick reply selected:", option);
    }
    onSendMessage(option);
  };

  // Check if the chat is ready for user input
  const isChatReady = isInitialized && conversationId && !isLoading;

  const windowStyles: React.CSSProperties = {
    width: config.theme?.chatWidth || "400px",
    height: config.theme?.chatHeight || "600px",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    marginBottom: "80px",
    overflow: "hidden",
    fontFamily:
      config.theme?.fontFamily ||
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const headerStyles: React.CSSProperties = {
    backgroundColor: "#1f2937",
    color: "#f3f4f6",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #374151",
  };

  const messagesStyles: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "#111827",
    position: "relative",
  };

  const inputContainerStyles: React.CSSProperties = {
    padding: "20px",
    borderTop: "1px solid #374151",
    backgroundColor: "#1f2937",
  };

  const inputStyles: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #4b5563",
    borderRadius: "12px",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#374151",
    color: "#f3f4f6",
    fontFamily: "inherit",
    transition: "border-color 0.2s ease",
  };

  const getConnectionStatusMessage = () => {
    if (!isConnected) {
      return "Offline mode - Limited functionality";
    }
    if (error) {
      return "Connection issues - Using offline responses";
    }
    return null;
  };

  const connectionStatus = getConnectionStatusMessage();

  if (config.debug) {
    console.log("[BotForge Widget] ChatWindow render:", {
      messagesCount: messages.length,
      inputValue,
      isLoading,
      isConnected,
      isInitialized,
      conversationId,
      isChatReady,
    });
  }

  return (
    <div style={windowStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div>
          <div
            style={{
              fontWeight: "600",
              fontSize: "18px",
              color: "#f3f4f6",
              marginBottom: "4px",
            }}
          >
            {config.title || "BotForge Support"}
          </div>
          {config.subtitle && (
            <div
              style={{
                fontSize: "14px",
                color: "#9ca3af",
              }}
            >
              {config.subtitle}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "8px",
              fontSize: "12px",
              color: isConnected ? "#10b981" : "#ef4444",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: isConnected ? "#10b981" : "#ef4444",
                borderRadius: "50%",
                marginRight: "6px",
              }}
            />
            {isConnected ? "Online" : "Offline"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Restart button */}
          {onRestart && (
            <button
              onClick={onRestart}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                fontSize: "18px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#374151";
                e.currentTarget.style.color = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#9ca3af";
              }}
              title="Restart chat"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#374151";
              e.currentTarget.style.color = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#9ca3af";
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: isConnected ? "#fef3c7" : "#fee2e2",
            color: isConnected ? "#92400e" : "#991b1b",
            fontSize: "13px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isConnected ? "#f59e0b" : "#ef4444",
            }}
          />
          {connectionStatus}
        </div>
      )}

      {/* Messages */}
      <div
        style={messagesStyles}
        onDragOver={config.enableFileUpload ? handleDragOver : undefined}
        onDragLeave={config.enableFileUpload ? handleDragLeave : undefined}
        onDrop={config.enableFileUpload ? handleDrop : undefined}
      >
        {isDragging && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "2px dashed #3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: "8px",
            }}
          >
            <div style={{ color: "#3b82f6", fontWeight: "600" }}>
              Drop file here to upload
            </div>
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div
            style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: "15px",
              padding: "40px 20px",
              lineHeight: "1.6",
            }}
          >
            {config.greeting ||
              "Hi! I'm your BotForge assistant. I can help you create chatbots, understand features, troubleshoot issues, and more. What would you like to know?"}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent:
                message.sender === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            {message.sender === "bot" && (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor:
                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "4px",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="m14 8-2 2-2-2" />
                  <path d="M18 12h2" />
                  <path d="M22 12v6" />
                  <path d="M4 12H2" />
                  <path d="M2 12v6" />
                </svg>
              </div>
            )}

            <div
              style={{
                maxWidth: "75%",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius:
                    message.sender === "user"
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                  backgroundColor:
                    message.sender === "user" ? "#3b82f6" : "#374151",
                  color: message.sender === "user" ? "white" : "#f3f4f6",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                  border: message.isError ? "1px solid #ef4444" : "none",
                  wordWrap: "break-word",
                  position: "relative",
                }}
              >
                <div>{message.content}</div>
                <div
                  style={{
                    fontSize: "11px",
                    opacity: 0.7,
                    marginTop: "6px",
                    textAlign: message.sender === "user" ? "right" : "left",
                    display: "flex",
                    justifyContent:
                      message.sender === "user" ? "flex-end" : "flex-start",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{formatTime(message.timestamp)}</span>
                  {(message.metadata?.fallback ||
                    message.metadata?.offline) && (
                    <span
                      style={{
                        fontSize: "10px",
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                        padding: "2px 6px",
                        borderRadius: "6px",
                      }}
                    >
                      Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Reply Options */}
              {message.sender === "bot" && message.metadata?.options && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {message.metadata.options.map(
                    (option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(option)}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#4b5563",
                          color: "#f3f4f6",
                          border: "1px solid #6b7280",
                          borderRadius: "8px",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#374151";
                          e.currentTarget.style.borderColor = "#9ca3af";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#4b5563";
                          e.currentTarget.style.borderColor = "#6b7280";
                        }}
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {message.sender === "user" && (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#3b82f6",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "4px",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Only show typing indicator when actually loading a response, not during initialization */}
        {isLoading && messages.length > 0 && config.enableTypingIndicator && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "4px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="m14 8-2 2-2-2" />
                <path d="M18 12h2" />
                <path d="M22 12v6" />
                <path d="M4 12H2" />
                <path d="M2 12v6" />
              </svg>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                backgroundColor: "#374151",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{ display: "flex", gap: "4px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#9ca3af",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#9ca3af",
                    animation: "pulse 1.5s ease-in-out infinite 0.2s",
                  }}
                />
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#9ca3af",
                    animation: "pulse 1.5s ease-in-out infinite 0.4s",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={inputContainerStyles}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                !isChatReady
                  ? "Initializing chat..."
                  : config.placeholder ||
                    "Ask me about BotForge features, pricing, or how to build chatbots..."
              }
              disabled={!isChatReady}
              style={{
                ...inputStyles,
                opacity: !isChatReady ? 0.5 : 1,
                cursor: !isChatReady ? "not-allowed" : "text",
              }}
              onFocus={(e) => {
                if (isChatReady) {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#4b5563";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {config.enableFileUpload && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isChatReady}
                style={{
                  padding: "12px",
                  border: "1px solid #4b5563",
                  borderRadius: "12px",
                  backgroundColor: "#374151",
                  color: "#9ca3af",
                  cursor: isChatReady ? "pointer" : "not-allowed",
                  fontSize: "16px",
                  opacity: !isChatReady ? 0.5 : 1,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                }}
                title="Upload file"
                onMouseEnter={(e) => {
                  if (isChatReady) {
                    e.currentTarget.style.backgroundColor = "#4b5563";
                    e.currentTarget.style.color = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#374151";
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </>
          )}

          <button
            type="submit"
            disabled={!inputValue.trim() || !isChatReady}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "12px",
              backgroundColor: config.theme?.primaryColor || "#3b82f6",
              color: "white",
              cursor:
                !inputValue.trim() || !isChatReady ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              opacity: !inputValue.trim() || !isChatReady ? 0.5 : 1,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "60px",
              height: "44px",
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && isChatReady) {
                e.currentTarget.style.backgroundColor = "#2563eb";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                config.theme?.primaryColor || "#3b82f6";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {!isChatReady ? (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {config.showBranding && (
        <div
          style={{
            padding: "12px 20px",
            textAlign: "center",
            fontSize: "12px",
            color: "#6b7280",
            borderTop: "1px solid #374151",
            backgroundColor: "#1f2937",
          }}
        >
          Powered by{" "}
          <a
            href="https://botforge.site"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            BotForge
          </a>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 80%, 100% {
              opacity: 0.3;
            }
            40% {
              opacity: 1;
            }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
