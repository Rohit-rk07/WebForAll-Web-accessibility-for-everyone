import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  TextField,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  SmartToy,
  Close,
  Send,
  Minimize,
  Maximize
} from '@mui/icons-material';
import aiService from '../services/aiService';

/**
 * Global AI Chatbot component
 * Can be used across the app to provide AI assistance
 */
const AiChatbot = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatWidth, setChatWidth] = useState(350);

  // Expose methods globally for other components to use
  useEffect(() => {
    window.aiChatbot = {
      open: () => setIsOpen(true),
      addContextMessage: async (message) => {
        const userMessage = {
          role: 'user',
          content: message
        };
        
        // Add user message first
        setMessages(prev => [...prev, userMessage]);
        setIsOpen(true);
        setIsLoading(true);
        
        try {
          // Send message with current messages + new user message
          const currentMessages = [...messages, userMessage];
          const response = await aiService.sendChatMessage(currentMessages);
          
          const assistantMessage = {
            role: 'assistant',
            content: response.content
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          console.error('Error sending context message:', error);
          const errorMessage = {
            role: 'assistant',
            content: error.message || `I'm currently experiencing technical difficulties. Please try again later.`
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    return () => {
      delete window.aiChatbot;
    };
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: '',
          content: 'Hello! I\'m your accessibility assistant. How can I help you understand or fix accessibility issues today?'
        }
      ]);
    }
  }, [messages]);

  /**
   * Toggles the chatbot open/closed
   */
  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  /**
   * Handles sending a message
   */
  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Call AI service
    aiService.sendChatMessage([...messages, userMessage])
      .then(response => {
        const assistantMessage = {
          role: 'assistant',
          content: response.content
        };
        setMessages(prev => [...prev, assistantMessage]);
      })
      .catch(error => {
        console.error('Error sending chat message:', error);
        const errorMessage = {
          role: 'assistant',
          content: error.message || `I'm currently experiencing technical difficulties with my AI service. This might be due to API limits or connectivity issues. You can still use the accessibility analyzer features, but some AI capabilities may be limited. Please try again later.`
        };
        setMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  /**
   * Handles pressing Enter to send
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
      >
        <Tooltip title={isOpen ? "Close AI Assistant" : "Ask AI Assistant"}>
          <Button
            variant="contained"
            color="primary"
            onClick={toggleChat}
            sx={{
              borderRadius: '50%',
              minWidth: '60px',
              height: '60px',
              boxShadow: 3
            }}
          >
            {isOpen ? <Close /> : <SmartToy />}
          </Button>
        </Tooltip>
      </Box>

      {/* Chat Panel */}
      <Box
        sx={{
          position: 'fixed',
          top: 64,
          right: 0,
          width: isOpen ? chatWidth : 0,
          height: 'calc(100vh - 64px)',
          bgcolor: 'background.paper',
          boxShadow: 3,
          zIndex: 1300,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out',
          borderLeft: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          minWidth: isOpen ? 300 : 0,
          maxWidth: '80vw'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy color="primary" />
            AI Assistant
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={chatWidth >= 600 ? "Minimize" : "Expand"}>
              <IconButton 
                size="small" 
                onClick={() => setChatWidth(chatWidth >= 600 ? 350 : 1500)}
              >
                {chatWidth >= 600 ? <Minimize /> : <Maximize />}
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={toggleChat}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Messages - This is the only part that should scroll */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', // Allow scrolling only for messages
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  maxWidth: '85%',
                  bgcolor: message.role === 'user' 
                    ? 'primary.main' 
                    : theme.palette.mode === 'dark' 
                      ? 'grey.800' 
                      : '#ffffff',
                  color: message.role === 'user' 
                    ? 'white' 
                    : theme.palette.mode === 'dark' 
                      ? 'grey.100' 
                      : '#000000',
                  border: message.role === 'assistant' ? `2px solid` : 'none',
                  borderColor: theme.palette.mode === 'dark' ? 'grey.700' : '#e0e0e0',
                  boxShadow: message.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Box>
                  {message.content.split('```').map((part, i) => {
                    if (i % 2 === 0) {
                      // Regular text - render markdown-style formatting
                      return (
                        <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: part.trim() ? 1 : 0 }}>
                          {part.split('**').map((textPart, j) => 
                            j % 2 === 0 ? textPart : <strong key={j}>{textPart}</strong>
                          )}
                        </Typography>
                      );
                    } else {
                      // Code block
                      const lines = part.split('\n');
                      const language = lines[0]?.trim() || 'html';
                      const code = lines.slice(1).join('\n').trim();
                      
                      if (!code) return null;
                      
                      return (
                        <Box key={i} sx={{ my: 2 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary', 
                              mb: 0.5, 
                              display: 'block',
                              textTransform: 'uppercase',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          >
                            {language}
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' ? '#23272f' : '#2d3748',
                              color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#ffffff',
                              p: 2,
                              borderRadius: 2,
                              overflow: 'auto',
                              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                              fontSize: '0.875rem',
                              lineHeight: 1.5,
                              border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : '1px solid #4a5568',
                              m: 0
                            }}
                          >
                            <code style={{ color: 'inherit' }}>
                              {code}
                            </code>
                          </Box>
                        </Box>
                      );
                    }
                  })}
                </Box>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : '#ffffff',
                  color: theme.palette.mode === 'dark' ? 'grey.100' : '#000000',
                  border: `2px solid`,
                  borderColor: theme.palette.mode === 'dark' ? 'grey.700' : '#e0e0e0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="body2">AI is thinking...</Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: `1px solid`, borderColor: 'divider', display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about accessibility..."
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <Send fontSize="small" />
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default AiChatbot;