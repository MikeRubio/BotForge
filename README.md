# @botforge/widget

The official BotForge widget for easy integration into any website or web application.

[![npm version](https://badge.fury.io/js/@botforge%2Fwidget.svg)](https://badge.fury.io/js/@botforge%2Fwidget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Installation

```bash
npm install @botforge/widget
```

### React Integration

```jsx
import React from "react";
import { BotForgeWidget } from "@botforge/widget";

function App() {
  return (
    <div>
      <h1>My Website</h1>
      <BotForgeWidget
        chatbotId="your-chatbot-id" // Get this from your BotForge dashboard
        theme={{
          primaryColor: "#3b82f6",
          borderRadius: "12px",
        }}
        position={{
          bottom: "20px",
          right: "20px",
        }}
        events={{
          onOpen: () => console.log("Chat opened"),
          onMessage: (message) => console.log("New message:", message),
        }}
      />
    </div>
  );
}

export default App;
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
  </head>
  <body>
    <h1>My Website</h1>

    <!-- Load from CDN -->
    <script src="https://unpkg.com/@botforge/widget/dist/botforge-widget.umd.js"></script>
    <script>
      const widget = BotForge.initBotForge({
        chatbotId: "your-chatbot-id", // Get this from your BotForge dashboard
        theme: {
          primaryColor: "#3b82f6",
          borderRadius: "12px",
        },
        position: {
          bottom: "20px",
          right: "20px",
        },
        events: {
          onOpen: () => console.log("Chat opened"),
          onMessage: (message) => console.log("New message:", message),
        },
      });
    </script>
  </body>
</html>
```

### Vue.js Integration

```vue
<template>
  <div>
    <h1>My Website</h1>
    <BotForgeWidget
      :chatbot-id="chatbotId"
      :theme="theme"
      :position="position"
      :events="events"
    />
  </div>
</template>

<script>
import { BotForgeWidget } from "@botforge/widget";

export default {
  components: {
    BotForgeWidget,
  },
  data() {
    return {
      chatbotId: "your-chatbot-id", // Get this from your BotForge dashboard
      theme: {
        primaryColor: "#3b82f6",
        borderRadius: "12px",
      },
      position: {
        bottom: "20px",
        right: "20px",
      },
      events: {
        onOpen: () => console.log("Chat opened"),
        onMessage: (message) => console.log("New message:", message),
      },
    };
  },
};
</script>
```

### Angular Integration

```typescript
// app.component.ts
import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <h1>My Website</h1>
    <div id="botforge-widget"></div>
  `,
})
export class AppComponent implements OnInit {
  async ngOnInit() {
    const { initBotForge } = await import("@botforge/widget");

    initBotForge({
      chatbotId: "your-chatbot-id", // Get this from your BotForge dashboard
      theme: {
        primaryColor: "#3b82f6",
        borderRadius: "12px",
      },
      position: {
        bottom: "20px",
        right: "20px",
      },
      events: {
        onOpen: () => console.log("Chat opened"),
        onMessage: (message) => console.log("New message:", message),
      },
    });
  }
}
```

## ⚙️ Setup Instructions

### 1. Get Your Chatbot ID

1. Log into your [BotForge Dashboard](https://botforge.site/dashboard)
2. Go to your chatbot settings
3. Copy the **Chatbot ID** from the integration section

### 2. Add the Widget

Replace `"your-chatbot-id"` in the examples above with your actual chatbot ID.

**That's it!** The widget automatically connects to BotForge's backend and uses the exact chatbot flow you created in the dashboard.

## 📖 Configuration

### Required Configuration

```typescript
interface BotForgeConfig {
  chatbotId: string; // Your BotForge chatbot ID (required)
}
```

### Optional Configuration

```typescript
interface BotForgeConfig {
  // Appearance
  theme?: BotForgeTheme;
  position?: BotForgePosition;

  // Behavior
  autoOpen?: boolean; // Auto-open chat on load (default: false)
  showBranding?: boolean; // Show "Powered by BotForge" (default: true)

  // User Information
  user?: BotForgeUser;

  // Event Handlers
  events?: BotForgeEvents;

  // Features
  enableFileUpload?: boolean; // Enable file uploads (default: false)
  enableEmoji?: boolean; // Enable emoji picker (default: true)
  enableTypingIndicator?: boolean; // Show typing indicator (default: true)

  // Limits
  maxMessages?: number; // Max messages to keep in memory (default: 100)

  // Text Content
  greeting?: string; // Welcome message
  placeholder?: string; // Input placeholder
  title?: string; // Chat window title
  subtitle?: string; // Chat window subtitle

  // Advanced
  language?: string; // Language code (default: 'en')
  debug?: boolean; // Enable debug logging (default: false)
}
```

## 🌟 Features

✅ **Plug & Play** - Just provide your chatbot ID and it works  
✅ **Your Exact Flow** - Uses the same conversation flow you built in BotForge  
✅ **Full Logging** - All conversations are logged in your BotForge dashboard  
✅ **Framework Agnostic** - Works with React, Vue, Angular, and vanilla JavaScript  
✅ **TypeScript Support** - Built-in TypeScript definitions  
✅ **Responsive Design** - Optimized for all screen sizes  
✅ **Customizable Themes** - Complete control over appearance  
✅ **Event System** - Comprehensive event callbacks  
✅ **Production Ready** - Optimized bundle size and performance  
✅ **Accessibility** - WCAG compliant with keyboard navigation  
✅ **CDN Ready** - Available via unpkg and jsDelivr

## 🎛️ API Methods

When using React, access the widget API using a ref:

```jsx
import React, { useRef } from "react";
import { BotForgeWidget } from "@botforge/widget";

function App() {
  const widgetRef = useRef();

  const handleOpenChat = () => {
    widgetRef.current?.open();
  };

  const handleSendMessage = () => {
    widgetRef.current?.sendMessage("Hello from the parent app!");
  };

  return (
    <div>
      <button onClick={handleOpenChat}>Open Chat</button>
      <button onClick={handleSendMessage}>Send Message</button>

      <BotForgeWidget ref={widgetRef} chatbotId="your-chatbot-id" />
    </div>
  );
}
```

### Available Methods

```typescript
interface BotForgeAPI {
  open(): void; // Open the chat window
  close(): void; // Close the chat window
  toggle(): void; // Toggle the chat window
  sendMessage(message: string): Promise<void>; // Send a message programmatically
  setUser(user: BotForgeUser): void; // Update user information
  isOpen(): boolean; // Check if chat is open
  destroy(): void; // Remove the widget completely
  updateConfig(config: Partial<BotForgeConfig>): void; // Update configuration
}
```

## 🔧 Advanced Usage

### Custom User Information

```javascript
const widget = BotForge.initBotForge({
  chatbotId: "your-chatbot-id",
  user: {
    id: "user123",
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://example.com/avatar.jpg",
    metadata: {
      plan: "premium",
      signupDate: "2024-01-01",
    },
  },
});
```

### Error Handling

```javascript
const widget = BotForge.initBotForge({
  chatbotId: "your-chatbot-id",
  events: {
    onError: (error) => {
      console.error("Widget error:", error);
      // Handle error (e.g., show notification)
    },
    onReady: () => {
      console.log("Widget is ready!");
    },
  },
  debug: true, // Enable debug logging
});
```

### Dynamic Configuration Updates

```javascript
// Update user information
widget.setUser({
  id: "user456",
  name: "Jane Smith",
});

// Update configuration
widget.updateConfig({
  theme: {
    primaryColor: "#10b981",
  },
});
```

## 📦 Bundle Size

- ES Module: ~45KB (gzipped)
- UMD Bundle: ~50KB (gzipped)
- Zero dependencies (React is a peer dependency)

## 🔒 Security

- All API communications use HTTPS
- Connects to BotForge's secure backend
- No sensitive data is stored in localStorage
- CORS-compliant requests
- XSS protection built-in

## 🐛 Troubleshooting

### Common Issues

**Widget not appearing:**

- Verify your `chatbotId` is correct (check your BotForge dashboard)
- Check browser console for errors
- Ensure the widget container has proper z-index

**Chatbot not responding correctly:**

- Check your chatbot flow in the BotForge dashboard
- Ensure your chatbot is published
- Verify the conversation flow logic

**Styling conflicts:**

- Use CSS specificity or `!important` to override widget styles
- Check for conflicting CSS frameworks

### Debug Mode

Enable debug mode to see detailed logging:

```javascript
BotForge.initBotForge({
  chatbotId: "your-chatbot-id",
  debug: true,
});
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@botforge.site
- 📖 Documentation: https://botforge.site/docs
- 🐛 Issues: https://github.com/MikeRubio/BotForge/issues

Made by the [BotForge](https://botforge.site) team.
