import React, { useRef } from "react";
import { BotForgeWidget } from "@botforge/widget";

function App() {
  const widgetRef = useRef();

  const handleMessage = (message) => {
    console.log("New message:", message);
  };

  const handleError = (error) => {
    console.error("Widget error:", error);
  };

  const handleOpenChat = () => {
    widgetRef.current?.open();
  };

  const handleSendMessage = () => {
    widgetRef.current?.sendMessage("Hello from React!");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>BotForge Widget - React Example</h1>
      <p>
        This example shows how to integrate the BotForge widget in a React
        application.
      </p>

      <div
        style={{
          backgroundColor: "#e0f2fe",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "20px",
          borderLeft: "4px solid #0288d1",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#01579b" }}>🚀 Easy Setup</h3>
        <p style={{ margin: 0, color: "#01579b" }}>
          Just replace <code>chatbotId="demo-chatbot-id"</code> below with your
          actual chatbot ID from your BotForge dashboard. That's it!
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleOpenChat} style={{ marginRight: "10px" }}>
          Open Chat
        </button>
        <button onClick={handleSendMessage}>Send Test Message</button>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h2>Features Demonstrated:</h2>
        <ul>
          <li>Custom theme with purple primary color</li>
          <li>Event handling for messages and errors</li>
          <li>User information pre-populated</li>
          <li>Custom positioning</li>
          <li>API method calls via ref</li>
          <li>Automatic connection to BotForge backend</li>
          <li>Uses your exact chatbot flow from the dashboard</li>
        </ul>
      </div>

      <BotForgeWidget
        ref={widgetRef}
        chatbotId="demo-chatbot-id" // Replace with your actual chatbot ID
        theme={{
          primaryColor: "#8b5cf6",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          buttonSize: "medium",
          chatHeight: "600px",
          chatWidth: "400px",
        }}
        position={{
          bottom: "20px",
          right: "20px",
        }}
        user={{
          id: "user123",
          name: "John Doe",
          email: "john@example.com",
        }}
        events={{
          onOpen: () => console.log("Chat opened"),
          onClose: () => console.log("Chat closed"),
          onMessage: handleMessage,
          onError: handleError,
          onReady: () => console.log("Widget ready"),
        }}
        autoOpen={false}
        showBranding={true}
        enableFileUpload={true}
        debug={true}
      />
    </div>
  );
}

export default App;
