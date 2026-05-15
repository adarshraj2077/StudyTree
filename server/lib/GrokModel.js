const axios = require('axios');

class GrokModel {
  constructor(apiKey = process.env.GROK_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.x.ai/v1'; // Assuming standard OpenAI-compatible xAI endpoint
  }

  /**
   * Generates a response using Grok.
   * @param {string} systemPrompt 
   * @param {string} userQuery 
   */
  async generateAnswer(systemPrompt, userQuery) {
    if (!this.apiKey || this.apiKey === 'YOUR_GROK_API_KEY_HERE') {
      console.warn('[GrokModel] No API key provided, returning a dummy response.');
      return `[MOCK] This is a fallback response. Set GROK_API_KEY to use the real model.\n\nContext provided:\n${systemPrompt}\n\nQuery:\n${userQuery}`;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'grok-beta', // or whichever specific grok model is desired
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.2 // Lower temp for factual RAG responses
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (err) {
      console.error('[GrokModel] API Error:', err.response?.data || err.message);
      throw new Error('Failed to generate response from Grok');
    }
  }
}

module.exports = GrokModel;
