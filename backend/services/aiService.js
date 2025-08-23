const { GoogleGenAI } = require('@google/genai');

// Initialize the client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Fixed text generation
async function generateText(prompt) {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    // FIX: Access text from the first part in the array
    const text = response.candidates[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text content returned');
    }

    return text.trim();
  } catch (error) {
    console.error('Gemini SDK Error:', error);

    if (error.message.includes('quota') || error.message.includes('exceeded')) {
      return "I'm temporarily unavailable due to high usage. Please try again later.";
    }

    throw error;
  }
}

async function generateStructuredData(prompt) {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    });

    // FIX: Access text from the first part in the array
    const text = response.candidates[0]?.content?.parts?.[0]?.text;

    if (!text || text.trim() === '') {
      console.log('❌ Empty response - using fallback');
      console.log('Gemini raw response:', JSON.stringify(response, null, 2));
      return getFallbackIdeas();
    }

    try {
      // Remove Markdown code block if present
      const cleaned = text.replace(/```json\s*([\s\S]*?)```/, '$1').trim();
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.log('❌ JSON parse failed - using fallback');
      return getFallbackIdeas();
    }
  } catch (error) {
    console.error('Gemini SDK Error:', error);
    return getFallbackIdeas();
  }
}

// Fallback ideas function
function getFallbackIdeas() {
  return [
    {
      "Title": "User Experience Enhancement",
      "ShortDescription": "Improve user interface and interaction design to increase user engagement and satisfaction.",
      "Category": "UI/UX",
      "Priority": "High",
      "Feasibility": 8,
      "Tags": "user experience, design, interface"
    },
    {
      "Title": "Performance Optimization", 
      "ShortDescription": "Optimize application performance through code improvements, caching strategies, and resource management.",
      "Category": "Performance",
      "Priority": "High",
      "Feasibility": 7,
      "Tags": "performance, optimization, speed"
    },
    {
      "Title": "Mobile Responsiveness",
      "ShortDescription": "Enhance mobile compatibility and responsive design to ensure seamless experience across all devices.",
      "Category": "Mobile", 
      "Priority": "Medium",
      "Feasibility": 7,
      "Tags": "mobile, responsive, cross-platform"
    },
    {
      "Title": "Security Enhancement",
      "ShortDescription": "Implement advanced security measures including data encryption and vulnerability protection.",
      "Category": "Security",
      "Priority": "High",
      "Feasibility": 8, 
      "Tags": "security, protection, privacy"
    },
    {
      "Title": "Analytics Integration",
      "ShortDescription": "Add comprehensive analytics to track user behavior and generate actionable insights for improvement.",
      "Category": "Analytics",
      "Priority": "Medium",
      "Feasibility": 6,
      "Tags": "analytics, data, insights"
    }
  ];
}

module.exports = { generateText, generateStructuredData };
