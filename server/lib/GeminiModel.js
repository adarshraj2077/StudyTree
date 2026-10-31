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
   * Cleans raw PDF-extracted text before feeding it to the model.
   * Removes page markers, null bytes, and other PDF artefacts.
   * @param {string} text
   * @returns {string}
   */
  _cleanPdfText(text) {
    return (text || '')
      // Remove PDF page markers like "-- 3 of 65 --"
      .replace(/--\s*\d+\s*of\s*\d+\s*--/g, '')
      // Remove control characters (bell \x07 shown as •, null \x00, etc.)
      .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, '')
      // Collapse excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Generates a clean, human-readable response using Google Gemini API.
   * Falls back to the grounded extractive engine on failure.
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
            temperature: 0.3,
            maxOutputTokens: 1500
          }
        };

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 28000
        });

        const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return candidateText.trim();
        }
      } catch (err) {
        const errorDetails = err.response?.data?.error?.message || err.response?.data || err.message;
        console.warn(`[GeminiModel] Gemini API request failed: ${JSON.stringify(errorDetails)}. Falling back to context grounding engine.`);
      }
    }

    // High-precision grounded extractive engine when live API key is not configured or fails
    return this.synthesizeGroundedAnswer(userQuery, retrievedChunks);
  }

  /**
   * Generates a concise summary and key takeaways from document text using Gemini.
   */
  async generateSummaryAndKeyPoints(fullText, filename) {
    const cleanedText = this._cleanPdfText(fullText);

    if (this.isConfigured()) {
      try {
        const prompt = `You are a study assistant. Analyze the following document titled "${filename}" and return a JSON object.

"summary": Write 2-3 clear, human-readable sentences explaining what this document covers and its main purpose. Do NOT copy raw text directly — paraphrase cleanly.
"keyPoints": An array of exactly 3 to 5 key concepts or takeaways, each written as a clean, complete sentence that a student can understand.

Return ONLY valid JSON, no markdown, no code fences:
{"summary": "...", "keyPoints": ["...", "..."]}

DOCUMENT TEXT (first 5000 chars):
${cleanedText.slice(0, 5000)}`;

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await axios.post(url, {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 700
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
    return this.extractSummaryFromText(cleanedText, filename);
  }

  /**
   * Deterministic, extractive summarizer from raw text without requiring API credits.
   * Cleans PDF artefacts before extracting.
   */
  extractSummaryFromText(text, filename) {
    const cleanedText = this._cleanPdfText(text);

    const sentences = cleanedText
      .replace(/\r?\n/g, ' ')
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      // Filter out short/noisy strings and raw PDF dump lines
      .filter(s =>
        s.length > 30 &&
        s.length < 300 &&
        !/^[\d\s•\-–—]+$/.test(s) &&          // pure numbers/dashes/bullets
        !/^(page|chapter|\d+\s+of\s+\d+)/i.test(s) // page numbers
      );

    const firstSentences = sentences.slice(0, 3).join(' ');
    const summary = firstSentences || `Overview of ${filename} containing structured study content.`;

    const candidates = sentences.slice(3, 20);
    const keyPoints = [];
    for (const sent of candidates) {
      if (keyPoints.length >= 4) break;
      if (!keyPoints.some(k => k.toLowerCase().includes(sent.slice(0, 30).toLowerCase()))) {
        keyPoints.push(sent);
      }
    }

    if (keyPoints.length === 0) {
      keyPoints.push('Document indexed with vector embeddings for semantic query retrieval.');
      keyPoints.push('Ready for interactive Q&A and knowledge testing in Exam Mode.');
    }

    return { summary, keyPoints };
  }

  /**
   * Clean, human-readable extractive grounded answer synthesizer.
   * Used when Gemini API is unavailable.
   */
  synthesizeGroundedAnswer(userQuery, retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return `I couldn't find information about "${userQuery}" in the uploaded document(s). This topic may not be covered in your current study material — try rephrasing or uploading a relevant document.`;
    }

    const queryWords = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);

    const matchingSentences = [];
    const sourceSet = new Set();

    for (const chunk of retrievedChunks) {
      const source = chunk.metadata?.source || 'Document';
      sourceSet.add(source);

      // Clean the chunk text before extracting sentences from it
      const cleanedChunkText = this._cleanPdfText(chunk.text);
      const sentences = cleanedChunkText.split(/(?<=[.?!])\s+/);

      for (const sent of sentences) {
        const clean = sent.trim();
        // Filter out very short or clearly noisy lines
        if (clean.length < 25 || /^[\d\s•\-–—]+$/.test(clean)) continue;

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

    const sources = Array.from(sourceSet);
    const sourceNote = sources.length > 0 ? `\n\n*Sources: ${sources.join(', ')}*` : '';

    if (matchingSentences.length > 0) {
      const topSentences = matchingSentences
        .slice(0, 5)
        .map(s => `- ${s.text}`)
        .join('\n');

      return `Here is what your study material says about **"${userQuery}"**:\n\n${topSentences}${sourceNote}`;
    } else {
      // Fallback: show a cleaned excerpt from the top chunk
      const topChunk = retrievedChunks[0];
      const cleanedExcerpt = this._cleanPdfText(topChunk.text).slice(0, 500);
      return `Based on your uploaded documents, here's the most relevant section:\n\n${cleanedExcerpt}...${sourceNote}`;
    }
  }
}

module.exports = GeminiModel;
