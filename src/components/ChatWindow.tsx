import React, { useState, useRef, useEffect } from "react";
import { BotForgeMessage, BotForgeConfig } from "../types";

interface ChatWindowProps {
  messages: BotForgeMessage[];
  onSendMessage: (content: string, type?: "text" | "file") => void;
  onFileUpload?: (file: File) => void;
  onClose: () => void;
  isLoading: boolean;
  isConnected: boolean;
  config: BotForgeConfig;
  error?: Error | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  onFileUpload,
  onClose,
  isLoading,
  isConnected,
  config,
  error,
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
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
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

  const windowStyles: React.CSSProperties = {
    width: config.theme?.chatWidth || "380px",
    height: config.theme?.chatHeight || "500px",
    backgroundColor: config.theme?.backgroundColor || "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: config.theme?.borderRadius || "12px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    display: "flex",
    flexDirection: "column",
    marginBottom: "80px",
    overflow: "hidden",
    fontFamily: config.theme?.fontFamily || "inherit",
  };

  const headerStyles: React.CSSProperties = {
    backgroundColor:
      config.theme?.headerColor || config.theme?.primaryColor || "#3B82F6",
    color: "white",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const messagesStyles: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#f9fafb",
    position: "relative",
  };

  const inputContainerStyles: React.CSSProperties = {
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
    backgroundColor: config.theme?.backgroundColor || "#ffffff",
  };

  const inputStyles: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    color: config.theme?.textColor || "#000000",
    fontFamily: "inherit",
  };

  return (
    <div style={windowStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "16px" }}>
            {config.title || "Chat with us"}
          </div>
          {config.subtitle && (
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              {config.subtitle}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "20px",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          ×
        </button>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#fef3c7",
            color: "#92400e",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          {error ? "Connection failed - using offline mode" : "Connecting..."}
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
            <div style={{ color: "#3b82f6", fontWeight: "bold" }}>
              Drop file here to upload
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent:
                message.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "18px",
                backgroundColor:
                  message.sender === "user"
                    ? config.theme?.userMessageColor ||
                      config.theme?.primaryColor ||
                      "#3B82F6"
                    : config.theme?.botMessageColor || "#ffffff",
                color:
                  message.sender === "user"
                    ? "white"
                    : config.theme?.textColor || "#000000",
                fontSize: "14px",
                lineHeight: "1.4",
                boxShadow:
                  message.sender === "bot"
                    ? "0 1px 2px rgba(0, 0, 0, 0.1)"
                    : "none",
                border: message.isError
                  ? "1px solid #ef4444"
                  : message.sender === "bot"
                  ? "1px solid #e5e7eb"
                  : "none",
                wordWrap: "break-word",
              }}
            >
              <div>{message.content}</div>
              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.7,
                  marginTop: "4px",
                  textAlign: message.sender === "user" ? "right" : "left",
                }}
              >
                {formatTime(message.timestamp)}
                {message.metadata?.fallback && (
                  <span style={{ marginLeft: "4px" }}>• Offline</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && config.enableTypingIndicator && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "18px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e5e7eb",
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
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={config.placeholder || "Type your message..."}
            disabled={isLoading}
            style={inputStyles}
          />

          {config.enableFileUpload && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: "16px",
                  opacity: isLoading ? 0.5 : 1,
                }}
                title="Upload file"
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
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: "12px 16px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: config.theme?.primaryColor || "#3B82F6",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              opacity: !inputValue.trim() || isLoading ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </div>

      {config.showBranding && (
        <div
          style={{
            padding: "8px 16px",
            textAlign: "center",
            fontSize: "11px",
            color: "#9ca3af",
            borderTop: "1px solid #e5e7eb",
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
              fontWeight: "bold",
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
        `}
      </style>
    </div>
  );
};
