import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "../../theme";
import AiChatbot from "../AiChatbot";
import aiService from "../../services/aiService";

vi.mock("../../services/aiService", () => ({
  default: { sendChatMessage: vi.fn() },
}));

const renderChatbot = () =>
  render(
    <ThemeProvider theme={createAppTheme(false)}>
      <AiChatbot />
    </ThemeProvider>,
  );

const openChat = () => {
  renderChatbot();
  fireEvent.click(screen.getByRole("button", { name: "Open AI Assistant" }));
};

const typeAndSend = (text) => {
  const input = screen.getByRole("textbox");
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  ).set;
  setter.call(input, text);
  fireEvent.input(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
};

describe("AiChatbot", () => {
  beforeEach(() => {
    aiService.sendChatMessage.mockReset();
  });

  it("opens to a welcome message and suggested prompts", () => {
    openChat();

    expect(
      screen.getByRole("dialog", { name: "AI Assistant" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/your accessibility assistant/i)).toBeInTheDocument();
    for (const prompt of [
      "Explain WCAG",
      "What is alt text?",
      "How do I fix contrast issues?",
      "What is an ARIA label?",
    ]) {
      expect(screen.getByText(prompt)).toBeInTheDocument();
    }
  });

  it("disables send while the input is empty", () => {
    openChat();
    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeDisabled();
  });

  it("sends one message and appends exactly one assistant response", async () => {
    aiService.sendChatMessage.mockResolvedValue({ content: "Reply one" });
    openChat();

    typeAndSend("check my navgation please");
    await waitFor(() =>
      expect(screen.getByText("Reply one")).toBeInTheDocument(),
    );

    expect(aiService.sendChatMessage).toHaveBeenCalledTimes(1);
    const history = aiService.sendChatMessage.mock.calls[0][0];
    expect(history.at(-1)).toEqual({
      role: "user",
      content: "check my navgation please",
    });
    expect(screen.getAllByText(/check my navgation please/i)).toHaveLength(1);
  });

  it("shows a loading indicator and disables send while pending", async () => {
    let resolveReply;
    aiService.sendChatMessage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        }),
    );
    openChat();

    typeAndSend("what is contrast?");
    expect(screen.getByRole("status", { name: "AI is typing" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeDisabled();

    resolveReply({ content: "Reply finally" });
    await waitFor(() =>
      expect(screen.getByText("Reply finally")).toBeInTheDocument(),
    );
  });

  it("replaces a failed exchange instead of duplicating it on Retry", async () => {
    aiService.sendChatMessage
      .mockRejectedValueOnce(new Error("AI service is temporarily unavailable."))
      .mockResolvedValueOnce({ content: "Recovered reply" });
    openChat();

    typeAndSend("why is this important?");
    await waitFor(() =>
      expect(
        screen.getByText("AI service is temporarily unavailable."),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
    await waitFor(() =>
      expect(screen.getByText("Recovered reply")).toBeInTheDocument(),
    );

    expect(aiService.sendChatMessage).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByText("AI service is temporarily unavailable."),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/why is this important\?/i),
    ).toHaveLength(1);
    expect(screen.queryByText("Recovered reply")).toBeInTheDocument();
  });

  it("sends a suggested prompt when a chip is clicked", async () => {
    aiService.sendChatMessage.mockResolvedValue({ content: "Ask me anything" });
    openChat();

    fireEvent.click(screen.getByText("What is alt text?"));
    await waitFor(() =>
      expect(screen.getByText("Ask me anything")).toBeInTheDocument(),
    );

    const history = aiService.sendChatMessage.mock.calls[0][0];
    expect(history.at(-1).content).toBe("What is alt text?");
  });

  it("closes on Escape and returns focus to the toggle", () => {
    openChat();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open AI Assistant" }),
    ).toHaveFocus();
  });
});
