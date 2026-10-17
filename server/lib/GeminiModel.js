const axios = require('axios');

class GeminiModel {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    this.apiKey = apiKey;
    this.model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.provider = 'Gemini (' + this.model + ')';
  }

  isConfigured() {
    return Boolean(
      this.apiKey &&
      this.apiKey.trim() !== '' &&
      this.apiKey !== 'YOUR_GEMINI_API_KEY_HERE'
    );
  }

  /**
   * Generates a context-grounded response using Google Gemini API.
   * If API key is not configured or fails, falls back gracefully to
   * high-precision extractive grounding from retrieved chunks.
   * 
   * @param {string} systemPrompt 
   * @param {string} userQuery 
   * @param {Array<{ text: string, metadata: object, score: number }>} retrievedChunks
   * @returns {Promise<string>}
   */
  async generateAnswer(systemPrompt, userQuery, retrievedChunks = []) {
    if (this.isConfigured()) {
      try {
        console.log(`[GeminiModel] Dispatching query to Google Gemini API (${this.model})...`);
        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
        
        const payload = {
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userQuery }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024
          }
        };

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000
        });

        const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return candidateText.trim();
        }
      } catch (err) {
        const errorDetails = err.response?.data?.error?.message || err.response?.data || err.message;
        console.warn(`[GeminiModel] Gemini API request failed: ${JSON.stringify(errorDetails)}. Falling back to context grounding engine.`);
        return this.synthesizeGroundedAnswer(userQuery, retrievedChunks, `(Live Gemini API notice: ${errorDetails})`);
      }
    }

    // High-precision grounded extractive engine when live API key is not configured
    return this.synthesizeGroundedAnswer(
      userQuery,
      retrievedChunks,
      '(Generated via StudyTree Grounded Engine. Add GEMINI_API_KEY in server/.env for generative Gemini responses.)'
    );
  }

  /**
   * Generates a concise summary and key takeaways from document text using Gemini.
   */
  async generateSummaryAndKeyPoints(fullText, filename) {
    if (this.isConfigured()) {
      try {
        const prompt = `Analyze this technical document "${filename}" and return a JSON object with:
"summary": a clear 2-3 sentence overview of the main topic and purpose.
"keyPoints": an array of exactly 3 to 5 core concepts or key takeaways from the text.

Only return valid JSON without code fences or preamble:
{"summary": "...", "keyPoints": ["...", "..."]}

DOCUMENT TEXT EXCERPT:
${fullText.slice(0, 5000)}`;

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await axios.post(url, {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 600,
            responseMimeType: 'application/json'
          }
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000
        });

        const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.summary && Array.isArray(parsed.keyPoints)) {
          return parsed;
        }
      } catch (err) {
        console.warn('[GeminiModel] Summary generation via Gemini failed, using extractive extractor:', err.message);
      }
    }

    // Extractive summary fallback
    return this.extractSummaryFromText(fullText, filename);
  }

  /**
   * Deterministic, extractive summarizer from raw text without requiring API credits.
   */
  extractSummaryFromText(text, filename) {
    const sentences = text
      .replace(/\r?\n/g, ' ')
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 250);

    const firstSentences = sentences.slice(0, 3).join(' ');
    const summary = firstSentences || `Overview of ${filename} containing structured study content.`;

    const candidates = sentences.slice(3, 15);
    const keyPoints = [];
    for (const sent of candidates) {
      if (keyPoints.length >= 4) break;
      if (!keyPoints.includes(sent)) {
        keyPoints.push(sent);
      }
    }

    if (keyPoints.length === 0) {
      keyPoints.push(`Document indexed with vector embeddings for semantic query retrieval.`);
      keyPoints.push(`Ready for interactive Q&A and knowledge testing in Exam Mode.`);
    }

    return {
      summary,
      keyPoints
    };
  }

  /**
   * Context-grounded response synthesizer.
   * Matches keywords and queries against retrieved chunks to present an accurate answer
   * without hallucination.
   */
  synthesizeGroundedAnswer(userQuery, retrievedChunks, notice = '') {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return `I could not find information regarding "${userQuery}" in the uploaded document(s). Based strictly on the provided material, this topic is not discussed.`;
    }

    const queryWords = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    
    const matchingSentences = [];
    const sources = new Set();

    for (const chunk of retrievedChunks) {
      const source = chunk.metadata?.source || 'Document';
      sources.add(source);
      const sentences = chunk.text.split(/(?<=[.?!])\s+/);
      
      for (const sent of sentences) {
        const clean = sent.trim();
        if (clean.length < 20) continue;
        const lower = clean.toLowerCase();
        let matchCount = 0;
        for (const word of queryWords) {
          if (lower.includes(word)) matchCount++;
        }
        if (matchCount > 0) {
          matchingSentences.push({
            text: clean,
            source,
            score: (matchCount * 2) + (chunk.score || 0)
          });
        }
      }
    }

    matchingSentences.sort((a, b) => b.score - a.score);

    let answerBody = '';
    if (matchingSentences.length > 0) {
      const topSentences = matchingSentences.slice(0, 4).map(s => `• ${s.text} *[From ${s.source}]*`).join('\n\n');
      answerBody = `Based on the uploaded document(s), here is the relevant information found:\n\n${topSentences}`;
    } else {
      const topChunk = retrievedChunks[0];
      answerBody = `From **${topChunk.metadata?.source || 'your document'}**:\n\n"${topChunk.text.trim().slice(0, 450)}..."`;
    }

    return `${answerBody}\n\n${notice}`.trim();
  }
}

module.exports = GeminiModel;
