/**
 * AI Service
 * Handles API calls to the Gemini AI integration endpoints
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get an AI explanation for an accessibility issue
 * @param {Object} issue - The issue object to explain
 * @returns {Promise<Object>} The explanation response
 */
export const getIssueExplanation = async (issue) => {
  try {
    const response = await axios.post(`${API_URL}/api/chat/explain`, {
      issue: issue
    });
    // Handle both success and error responses from backend
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    return response.data;
  } catch (error) {
    console.error('Error getting AI explanation:', error);
    // Provide more specific error messages
    if (error.response?.status === 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to connect to AI service. Please check your connection.');
    }
  }
};

/**
 * Get an AI summary of accessibility results
 * @param {Object} results - The accessibility results
 * @returns {Promise<Object>} The summary response
 */
export const getResultsSummary = async (results) => {
  try {
    const response = await axios.post(`${API_URL}/api/chat/summary`, {
      results: results
    });
    // Handle both success and error responses from backend
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    return response.data;
  } catch (error) {
    console.error('Error getting AI summary:', error);
    // Provide more specific error messages
    if (error.response?.status === 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to connect to AI service. Please check your connection.');
    }
  }
};

/**
 * Send a chat message to the AI assistant
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options like model and temperature
 * @returns {Promise<Object>} The chat completion response
 */
export const sendChatMessage = async (messages, options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/api/chat/completion`, {
      messages: messages,
      model: options.model || 'gemini-pro',
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens
    });
    // Handle both success and error responses from backend
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    // Provide more specific error messages
    if (error.response?.status === 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to connect to AI service. Please check your connection.');
    }
  }
};

export default {
  getIssueExplanation,
  getResultsSummary,
  sendChatMessage
};