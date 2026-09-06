import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Typography,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SmartToy from "@mui/icons-material/SmartToy";
import Close from "@mui/icons-material/Close";
import Send from "@mui/icons-material/Send";
import Minimize from "@mui/icons-material/Minimize";
import Maximize from "@mui/icons-material/Maximize";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Refresh from "@mui/icons-material/Refresh";
import aiService from "../services/aiService";
import "./AiChatbot.css";

const SUGGESTIONS = [
  "Explain WCAG",
  "What is alt text?",
  "How do I fix contrast issues?",
  "What is an ARIA label?",
];

/**
 * Global AI Chatbot component
 * Can be used across the app to provide AI assistance
 */
const AiChatbot = React.memo(() => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatWidth, setChatWidth] = useState(380);
  const messagesRef = useRef(messages);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const lastUserMessageRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Sends the current history to the AI service and appends exactly one
   * assistant response (success or error). Shared by the send flow, the
   * context-message entry point, and retry.
   */
  const respondTo = async (history) => {
    setIsLoading(true);
    try {
      const response = await aiService.sendChatMessage(history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content, isError: false },
      ]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message ||
            "I'm having trouble reaching the AI service right now. Check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sends a user message (or retries a failed one) and appends the reply.
   */
  const sendMessage = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || isLoading) return;

    lastUserMessageRef.current = trimmed;

    // Retry case: the last exchange ended in an error from the same prompt.
    // Drop the stale error bubble instead of duplicating the user message.
    const prior = messagesRef.current;
    const isRetry =
      prior.length >= 2 &&
      prior[prior.length - 1].isError === true &&
      prior[prior.length - 2].role === "user" &&
      prior[prior.length - 2].content === trimmed;

    const history = isRetry ? prior.slice(0, -1) : [...prior, { role: "user", content: trimmed }];
    setMessages(history);
    setInput("");
    void respondTo(history);
  };

  // Expose methods globally for other components to use
  useEffect(() => {
    window.aiChatbot = {
      open: () => setIsOpen(true),
      addContextMessage: async (message) => {
        const trimmed = (message || "").trim();
        if (!trimmed) return;
        lastUserMessageRef.current = trimmed;
        const history = [...messagesRef.current, { role: "user", content: trimmed }];
        setMessages(history);
        setIsOpen(true);
        await respondTo(history);
      },
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
          role: "assistant",
          content:
            "Hello! I'm your accessibility assistant. How can I help you understand or fix accessibility issues today?",
        },
      ]);
    }
  }, [messages]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Manage focus and Escape-to-close when the panel opens/closes
  useEffect(() => {
    if (!isOpen) {
      toggleRef.current?.focus();
      return;
    }
    const onKeyDown = (e) => {
      if (e.key === "Escape") toggleChat();
    };
    document.addEventListener("keydown", onKeyDown);
    inputRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Tooltip title={isOpen ? "Close AI Assistant" : "Ask AI Assistant"}>
          <IconButton
            ref={toggleRef}
            color="primary"
            aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
            aria-expanded={isOpen}
            onClick={toggleChat}
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              boxShadow: "0 6px 16px rgba(16, 24, 40, 0.18)",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {isOpen ? <Close /> : <SmartToy />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Chat Panel */}
      {isOpen && (
        <Box
          role="dialog"
          aria-modal="false"
          aria-labelledby="ai-chat-title"
          aria-describedby="ai-chat-subtitle"
          className="a11y-chat-panel"
          sx={{
            position: "fixed",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
            boxShadow: "0 12px 32px rgba(16, 24, 40, 0.16)",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            zIndex: 1300,
            width: chatWidth,
            height: "min(640px, calc(100vh - 148px))",
            bottom: 96,
            right: 24,
            [theme.breakpoints.down("sm")]: {
              width: "auto",
              height: "calc(100dvh - 92px)",
              top: 8,
              left: 8,
              right: 8,
              bottom: 76,
              borderRadius: 2,
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <Box
                component="span"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  flexShrink: 0,
                }}
              >
                <SmartToy fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography id="ai-chat-title" variant="subtitle1" noWrap>
                  AI Assistant
                </Typography>
                <Typography
                  id="ai-chat-subtitle"
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                  noWrap
                >
                  Accessibility guidance
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
              <Tooltip title={chatWidth >= 560 ? "Shrink panel" : "Expand panel"}>
                <IconButton
                  size="small"
                  aria-label={chatWidth >= 560 ? "Shrink panel" : "Expand panel"}
                  onClick={() => setChatWidth(chatWidth >= 560 ? 380 : 560)}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    [theme.breakpoints.down("sm")]: { display: "none" },
                  }}
                >
                  {chatWidth >= 560 ? <Minimize fontSize="small" /> : <Maximize fontSize="small" />}
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                aria-label="Close AI assistant"
                onClick={toggleChat}
                sx={{ "&:hover": { bgcolor: "action.hover" } }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Messages - the only part that scrolls */}
          <Box
            aria-live="polite"
            sx={{
              flexGrow: 1,
              overflow: "auto",
              px: 2,
              py: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                className="a11y-chat-bubble"
                sx={{
                  mb: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "100%",
                }}
              >
                {message.isError ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      p: 1.5,
                      borderRadius: 2,
                      maxWidth: "85%",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(211, 47, 47, 0.16)"
                          : "#fdecea",
                      color: "text.primary",
                      border: `1px solid ${theme.palette.error.main}`,
                    }}
                  >
                    <ErrorOutline fontSize="small" sx={{ mt: 0.5, color: "error.main" }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                      >
                        {message.content}
                      </Typography>
                      <Button
                        color="inherit"
                        size="small"
                        startIcon={<Refresh />}
                        onClick={() => sendMessage(lastUserMessageRef.current)}
                        disabled={isLoading}
                        aria-label="Retry sending your message"
                        sx={{ alignSelf: "flex-start", minHeight: 32 }}
                      >
                        Retry
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      maxWidth: "85%",
                      bgcolor:
                        message.role === "user"
                          ? "primary.main"
                          : theme.palette.mode === "dark"
                            ? "rgba(230, 233, 238, 0.08)"
                            : "#f2f4f8",
                      color:
                        message.role === "user"
                          ? "primary.contrastText"
                          : "text.primary",
                      borderTopRightRadius: message.role === "user" ? 3 : 2,
                      borderTopLeftRadius: message.role === "user" ? 2 : 3,
                    }}
                  >
                    {message.content.split("```").map((part, i) => {
                      if (i % 2 === 0) {
                        return (
                          <Typography
                            key={i}
                            variant="body2"
                            sx={{
                              whiteSpace: "pre-wrap",
                              mb: part.trim() ? 1 : 0,
                              wordBreak: "break-word",
                            }}
                          >
                            {part
                              .split("**")
                              .map((textPart, j) =>
                                j % 2 === 0 ? (
                                  textPart
                                ) : (
                                  <Box
                                    component="span"
                                    fontWeight="bold"
                                    key={j}
                                  >
                                    {textPart}
                                  </Box>
                                ),
                              )}
                          </Typography>
                        );
                      }
                      const lines = part.split("\n");
                      const language = lines[0]?.trim() || "html";
                      const code = lines.slice(1).join("\n").trim();

                      if (!code) return null;

                      return (
                        <Box key={i} sx={{ my: 1.5 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              mb: 0.5,
                              display: "block",
                              textTransform: "uppercase",
                              fontWeight: "bold",
                              fontSize: "0.7rem",
                            }}
                          >
                            {language}
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              bgcolor:
                                theme.palette.mode === "dark" ? "#23272f" : "#2d3748",
                              color: theme.palette.mode === "dark" ? "#e2e8f0" : "#ffffff",
                              p: 1.5,
                              borderRadius: 1,
                              overflow: "auto",
                              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                              fontSize: "0.8125rem",
                              lineHeight: 1.5,
                              m: 0,
                            }}
                          >
                            <code style={{ color: "inherit" }}>{code}</code>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            ))}

            {isLoading && (
              <Box
                className="a11y-chat-bubble"
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  mb: 1.5,
                }}
              >
                <Box
                  role="status"
                  aria-label="AI is typing"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(230, 233, 238, 0.08)"
                        : "#f2f4f8",
                    color: "text.secondary",
                  }}
                >
                  <span className="a11y-chat-dot" />
                  <span className="a11y-chat-dot" />
                  <span className="a11y-chat-dot" />
                </Box>
              </Box>
            )}

            {/* Suggested prompts shown only before the first real exchange */}
            {messages.length === 1 && !isLoading && (
              <Box
                className="a11y-chat-bubble"
                sx={{
                  mt: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                {SUGGESTIONS.map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    size="small"
                    variant="outlined"
                    onClick={() => sendMessage(suggestion)}
                    sx={{ borderColor: "divider", fontWeight: 500, cursor: "pointer" }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Composer */}
          <Box
            sx={{
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "flex-end",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(230, 233, 238, 0.06)"
                    : "#f2f4f8",
                borderRadius: "18px",
                border: `1px solid transparent`,
                transition: "border-color 150ms ease, box-shadow 150ms ease",
                "&:focus-within": {
                  borderColor: "primary.main",
                  boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`,
                },
              }}
            >
              <TextField
                inputRef={inputRef}
                fullWidth
                variant="standard"
                placeholder="Ask about WCAG, accessibility, ARIA, keyboard navigation..."
                size="small"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                multiline
                maxRows={4}
                aria-label="Message the AI assistant"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    px: 1.5,
                    py: 1,
                    borderRadius: "18px",
                    color: "text.primary",
                  },
                }}
              />
            </Box>
            <IconButton
              color="primary"
              aria-label="Send message"
              disabled={isLoading || !input.trim()}
              onClick={handleSend}
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                flexShrink: 0,
                "&:hover": {
                  bgcolor: "primary.dark",
                  color: "primary.contrastText",
                },
                "&.Mui-disabled": {
                  bgcolor: "action.selected",
                  color: "text.disabled",
                },
              }}
            >
              <Send fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
});

export default AiChatbot;