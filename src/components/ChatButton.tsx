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
        return { width: "56px", height: "56px", fontSize: "20px" };
      case "large":
        return { width: "72px", height: "72px", fontSize: "28px" };
      default:
        return { width: "64px", height: "64px", fontSize: "24px" };
    }
  };

  const buttonSize = getButtonSize();

  const buttonStyles: React.CSSProperties = {
    ...buttonSize,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    color: "white",
    fontFamily: config.theme?.fontFamily || "inherit",
  };

  const pulseStyles: React.CSSProperties = {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    width: "16px",
    height: "16px",
    backgroundColor: "#ef4444",
    borderRadius: "50%",
    border: "2px solid white",
    animation: "pulse 2s infinite",
  };

  const iconSize =
    config.theme?.buttonSize === "small"
      ? "24px"
      : config.theme?.buttonSize === "large"
      ? "32px"
      : "28px";

  return (
    <>
      <button
        onClick={onClick}
        style={buttonStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 12px 40px rgba(59, 130, 246, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 8px 32px rgba(59, 130, 246, 0.3)";
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
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Bot icon
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="m14 8-2 2-2-2" />
            <path d="M18 12h2" />
            <path d="M22 12v6" />
            <path d="M4 12H2" />
            <path d="M2 12v6" />
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
