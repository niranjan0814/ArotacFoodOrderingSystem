import React, { useState, useEffect } from "react";
import axios from "axios"; 
import "./Chatbot.css";  
import { LuBotMessageSquare } from "react-icons/lu";
import { IoMdCloseCircleOutline } from "react-icons/io";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false); 
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ 
        text: "Hello! I'm your restaurant assistant. How can I help you today?", 
        sender: "bot" 
      }]);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === "" || isLoading) return;
    
    // Add user message
    const userMessage = { text: inputText, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/chatbot", 
        { 
          userMessage: inputText
        }
      );

      // Add bot response
      setMessages(prev => [
        ...prev,
        { text: response.data.message, sender: "bot" }
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        { 
          text: error.response?.data?.message || 
               "Sorry, I'm having trouble responding. Please try again later.", 
          sender: "bot" 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="chatbot-icon" onClick={toggleChat}>
        <LuBotMessageSquare />
      </div>

      {isOpen && (
        <div className="chatbot-interface">
          <div className="chat-header">
            Restaurant Assistant
            <button className="close-chat" onClick={toggleChat}>
              <IoMdCloseCircleOutline />
            </button> 
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}
              >
                {message.text}
                {index === messages.length - 1 && message.sender === "bot" && isLoading && (
                  <span className="typing-indicator">...</span>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.sender === "user" && (
              <div className="message bot-message">
                <span className="typing-indicator">...</span>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;