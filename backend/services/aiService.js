const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Returns plain text from Gemini
async function generateText(prompt) {
  const MODEL = 'gemini-2.0-flash-exp';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();

  if (data && data.error) {
    throw new Error(data.error.message || 'Gemini API error');
  }

  const rawText = 
      data &&
      Array.isArray(data.candidates) &&
      data.candidates[0] &&
      data.candidates.content &&
      Array.isArray(data.candidates.content.parts) &&
      data.candidates.content.parts &&
      typeof data.candidates.content.parts.text === 'string'
        ? data.candidates.content.parts.text
        : null;

  if (!rawText) {
    throw new Error('No content returned from Gemini');
  }

  return rawText;
}

//Returns JSON (parsed) from Gemini for structured prompts
async function generateStructuredData(prompt) {
  const MODEL = 'gemini-2.0-flash-exp';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();

  if (data && data.error) {
    throw new Error(data.error.message || 'Gemini API error');
  }

  let rawText = 
      data &&
      Array.isArray(data.candidates) &&
      data.candidates[0] &&
      data.candidates.content &&
      Array.isArray(data.candidates.content.parts) &&
      data.candidates.content.parts &&
      typeof data.candidates.content.parts.text === 'string'
        ? data.candidates.content.parts.text
        : null;

  if (!rawText) {
    throw new Error('No content returned from Gemini');
  }

  try {
    // Strip markdown fences and extra whitespace
    rawText = rawText.replace(/``````\n?/g, '').trim();
    return JSON.parse(rawText);
  } catch (err) {
    throw new Error('Invalid JSON format from Gemini');
  }
}

module.exports = { generateText, generateStructuredData };
