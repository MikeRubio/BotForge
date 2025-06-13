import React from "react";
import { BotForgeConfig } from "../types";

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  config: BotForgeConfig;
  hasUnreadMessages: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = ({
  onClick,
  isOpen,
  config,
  hasUnreadMessages,
}) => {
  const getButtonSize = () => {
    switch (config.theme?.buttonSize) {
      case "small":
        return { width: "50px", height: "50px", fontSize: "20px" };
      case "large":
        return { width: "70px", height: "70px", fontSize: "28px" };
      default:
        return { width: "60px", height: "60px", fontSize: "24px" };
    }
  };

  const buttonSize = getButtonSize();

  const buttonStyles: React.CSSProperties = {
    ...buttonSize,
    borderRadius: "50%",
    backgroundColor: config.theme?.primaryColor || "#3B82F6",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    transition: "all 0.3s ease",
    position: "relative",
    color: "white",
    fontFamily: config.theme?.fontFamily || "inherit",
  };

  const pulseStyles: React.CSSProperties = {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    width: "12px",
    height: "12px",
    backgroundColor: "#ef4444",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  };

  const iconSize =
    config.theme?.buttonSize === "small"
      ? "20px"
      : config.theme?.buttonSize === "large"
      ? "28px"
      : "24px";

  return (
    <>
      <button
        onClick={onClick}
        style={buttonStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        title={isOpen ? "Close chat" : "Open chat"}
      >
        {hasUnreadMessages && !isOpen && <div style={pulseStyles} />}

        {isOpen ? (
          // Close icon (X)
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Chat icon (message bubble)
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
          </svg>
        )}
      </button>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
            }
          }
        `}
      </style>
    </>
  );
};
