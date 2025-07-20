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
import {
  SmartToy,
  Close,
  Send
} from '@mui/icons-material';
import aiService from '../services/aiService';

/**
 * Global AI Chatbot component
 * Can be used across the app to provide AI assistance
 */
const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Expose methods globally for other components to use
  useEffect(() => {
    window.aiChatbot = {
      open: () => setIsOpen(true),
      addContextMessage: (message) => {
        setMessages(prev => [...prev, {
          role: 'user',
          content: message
        }]);
        setIsOpen(true);
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
          role: 'assistant',
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
          width: 350,
          height: 'calc(100vh - 64px)',
          bgcolor: 'background.paper',
          boxShadow: 3,
          zIndex: 1300,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid`, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Accessibility AI Assistant</Typography>
          <IconButton onClick={toggleChat} size="small">
            <Close />
          </IconButton>
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
                  bgcolor: message.role === 'user' ? 'primary.main' : 'background.default',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  border: message.role === 'assistant' ? `1px solid` : 'none',
                  borderColor: 'divider'
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
                              bgcolor: '#f8f9fa', 
                              p: 2, 
                              borderRadius: 2, 
                              overflow: 'auto',
                              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                              fontSize: '0.875rem',
                              lineHeight: 1.5,
                              border: '1px solid #e1e4e8',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                              m: 0,
                              '& .hljs-tag': { color: '#22863a' },
                              '& .hljs-name': { color: '#22863a' },
                              '& .hljs-attr': { color: '#6f42c1' },
                              '& .hljs-string': { color: '#032f62' },
                              '& .hljs-keyword': { color: '#d73a49', fontWeight: 'bold' },
                              '& .hljs-comment': { color: '#6a737d', fontStyle: 'italic' }
                            }}
                          >
                            <code 
                              style={{ 
                                display: 'block',
                                whiteSpace: 'pre',
                                color: '#24292e'
                              }}
                              dangerouslySetInnerHTML={{ 
                                __html: code
                                  .replace(/&/g, '&amp;')
                                  .replace(/</g, '&lt;')
                                  .replace(/>/g, '&gt;')
                                  // HTML tag highlighting
                                  .replace(/(&lt;\/?)(\w+)/g, '<span class="hljs-tag">&lt;<span class="hljs-name">$2</span></span>')
                                  .replace(/(&gt;)/g, '<span class="hljs-tag">&gt;</span>')
                                  // Attribute highlighting
                                  .replace(/(\w+)=/g, '<span class="hljs-attr">$1</span>=')
                                  // String highlighting
                                  .replace(/"([^"]*)"/g, '<span class="hljs-string">"$1"</span>')
                                  .replace(/'([^']*)'/g, '<span class="hljs-string">\&#39;$1\&#39;</span>')
                                  // Comment highlighting
                                  .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hljs-comment">$1</span>')
                              }} 
                            />
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
                  bgcolor: 'background.default',
                  border: `1px solid`,
                  borderColor: 'divider'
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