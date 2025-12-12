import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatbotController } from '../controllers/chatbotController';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const { user } = useAuth();
  
  // Helper functions for managing conversation history
  const getStorageKey = () => `chatbot_conversations_${user?._id || user?.id}`;
  
  const loadConversations = () => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(conv => ({
          ...conv,
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
    return [];
  };

  const saveConversations = (conversations) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  const getConversationTitle = (messages) => {
    // Get first user message as title
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      return firstUserMessage.text.substring(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '');
    }
    return 'New Conversation';
  };

  // Initialize conversations
  const [conversations, setConversations] = useState(() => {
    const loaded = loadConversations();
    if (loaded.length === 0) {
      // Create initial conversation
      const initialConv = {
        id: Date.now(),
        title: 'New Conversation',
        messages: [
          {
            id: 1,
            text: "Hello! I'm your AI assistant. How can I help you today?",
            sender: 'bot',
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      saveConversations([initialConv]);
      return [initialConv];
    }
    return loaded;
  });

  const [currentConversationId, setCurrentConversationId] = useState(() => {
    const loaded = loadConversations();
    return loaded.length > 0 ? loaded[loaded.length - 1].id : null;
  });

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId) || conversations[0];
  
  // Initialize messages from current conversation
  const [messages, setMessages] = useState(() => {
    if (currentConversation && currentConversation.messages) {
      return currentConversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
    return [
      {
        id: 1,
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [pendingTicketInfo, setPendingTicketInfo] = useState(null);
  const [showHistory, setShowHistory] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Update messages when conversation changes
  useEffect(() => {
    if (currentConversation && currentConversation.messages) {
      const updatedMessages = currentConversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(updatedMessages);
      setPendingTicketInfo(null);
    }
  }, [currentConversationId]);

  // Save current conversation whenever messages change (with debounce to avoid too many saves)
  useEffect(() => {
    if (messages.length > 0 && user && currentConversationId) {
      const timeoutId = setTimeout(() => {
        const updatedConversations = conversations.map(conv => {
          if (conv.id === currentConversationId) {
            const title = getConversationTitle(messages);
            return {
              ...conv,
              messages: messages,
              title: title,
              updatedAt: new Date(),
            };
          }
          return conv;
        });
        setConversations(updatedConversations);
        saveConversations(updatedConversations);
      }, 500); // Debounce saves by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [messages, user, currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessageText = inputText.trim();
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Send message to chatbot API with conversation context if we have pending ticket info
      const conversationContext = pendingTicketInfo ? {
        originalMessage: pendingTicketInfo.originalMessage,
        category: pendingTicketInfo.category,
      } : null;
      
      const response = await chatbotController.sendMessage(
        userMessageText, 
        user?._id || user?.id,
        conversationContext
      );
      
      if (response && response.success && response.data) {
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.text || response.data.message || 'I received your message.',
          sender: 'bot',
          timestamp: new Date(),
          action: response.data.action,
          ticket: response.data.ticket,
        };
        
        setMessages((prev) => [...prev, botMessage]);
        
        // Store pending ticket info if offered
        if (response.data.action === 'ticket_offer' && response.data.conversationContext) {
          setPendingTicketInfo({
            category: response.data.conversationContext.category,
            originalMessage: response.data.conversationContext.originalMessage,
          });
        }
        
        // Clear pending ticket info if ticket was created or if user declined
        if (response.data.action === 'ticket_created' && response.data.ticket) {
          setPendingTicketInfo(null);
          console.log('Ticket created:', response.data.ticket);
        } else if (response.data.action !== 'ticket_offer') {
          // Clear pending info if we're not in a ticket offer state
          setPendingTicketInfo(null);
        }
      } else {
        throw new Error(response?.message || 'Failed to get response from server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorText = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorText = error.response.data?.message || 
                   `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorText = 'Cannot connect to server. Please make sure the backend is running.';
      } else {
        // Error setting up request
        errorText = error.message || 'An unexpected error occurred.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const quickSuggestions = [
    "How can I create a ticket?",
    "Check my ticket status",
    "What services are available?",
    "Help with OTR request",
  ];

  const handleQuickSuggestion = (suggestion) => {
    setInputText(suggestion);
  };

  const handleNewChat = () => {
    const newConv = {
      id: Date.now(),
      title: 'New Conversation',
      messages: [
        {
          id: 1,
          text: "Hello! I'm your AI assistant. How can I help you today?",
          sender: 'bot',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedConversations = [...conversations, newConv];
    setConversations(updatedConversations);
    setCurrentConversationId(newConv.id);
    setMessages(newConv.messages);
    setPendingTicketInfo(null);
    saveConversations(updatedConversations);
  };

  const handleSelectConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setMessages(conv.messages);
      setPendingTicketInfo(null);
    }
  };

  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();
    const updatedConversations = conversations.filter(c => c.id !== convId);
    
    if (updatedConversations.length === 0) {
      // If no conversations left, create a new one
      handleNewChat();
    } else {
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
      
      // If deleted conversation was current, switch to the last one
      if (convId === currentConversationId) {
        const lastConv = updatedConversations[updatedConversations.length - 1];
        setCurrentConversationId(lastConv.id);
        setMessages(lastConv.messages);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper function to detect ticket category (simplified version)
  const detectTicketCategory = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('otr') || lowerMessage.includes('transcript')) return 'OTR Request';
    if (lowerMessage.includes('enroll') || lowerMessage.includes('subject')) return 'Subject Enrollment';
    if (lowerMessage.includes('grade')) return 'Grade Inquiry';
    if (lowerMessage.includes('document') || lowerMessage.includes('certificate')) return 'Document Request';
    return 'General Inquiry';
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-container">
        <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar">
            <span>🤖</span>
          </div>
          <div className="chatbot-header-text">
            <h3>AI Assistant</h3>
            <p className="chatbot-status">
              <span className="status-indicator online"></span>
              Online
            </p>
          </div>
        </div>
        <div className="chatbot-actions">
          <button 
            className="chatbot-action-btn" 
            title="New Chat"
            onClick={handleNewChat}
          >
            💬
          </button>
          <button 
            className="chatbot-action-btn" 
            title="Clear chat"
            onClick={handleNewChat}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              {message.sender === 'bot' && (
                <div className="message-avatar">🤖</div>
              )}
              <div className="message-bubble">
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                {message.ticket && (
                  <div className="ticket-created-badge">
                    🎫 Ticket #{message.ticket.ticketNumber} created
                  </div>
                )}
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              {message.sender === 'user' && (
                <div className="message-avatar user-avatar">👤</div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message bot-message">
            <div className="message-content">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="quick-suggestions">
          <p className="suggestions-title">Quick suggestions:</p>
          <div className="suggestions-list">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => handleQuickSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chatbot-input-form">
        <div className="chatbot-input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="chatbot-input"
          />
          <button
            type="submit"
            className="chatbot-send-button"
            disabled={!inputText.trim() || isTyping}
          >
            <span>➤</span>
          </button>
        </div>
        <p className="chatbot-hint">
          Press Enter to send • The chatbot can help you with tickets, inquiries, and more
        </p>
      </form>
      </div>

      {/* Chat History Sidebar */}
      <div className={`chatbot-history-sidebar ${showHistory ? 'open' : ''}`}>
        <div className="history-sidebar-header">
          <h3>Chat History</h3>
          <button
            className="history-toggle-btn"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? 'Hide History' : 'Show History'}
          >
            {showHistory ? '◀' : '▶'}
          </button>
        </div>
        
        <div className="history-sidebar-content">
            <div className="history-list">
              {conversations.length === 0 ? (
                <div className="history-empty">No conversations yet</div>
              ) : (
                conversations
                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .map((conv) => (
                    <div
                      key={conv.id}
                      className={`history-item ${conv.id === currentConversationId ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <div className="history-item-content">
                        <div className="history-item-title">{conv.title}</div>
                        <div className="history-item-meta">
                          <span className="history-item-date">{formatDate(conv.updatedAt)}</span>
                          <span className="history-item-count">
                            {conv.messages.filter(m => m.sender === 'user').length} messages
                          </span>
                        </div>
                      </div>
                      <button
                        className="history-item-delete"
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        title="Delete conversation"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

