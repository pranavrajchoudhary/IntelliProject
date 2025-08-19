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

    console.log('🔍 Full Gemini Response:', JSON.stringify(response, null, 2));

    // Check if we have candidates
    if (!response.candidates || response.candidates.length === 0) {
      console.log('❌ No candidates returned');
      return "I'm temporarily unavailable due to API issues. Here's a helpful response anyway.";
    }

    const candidate = response.candidates[0];
    console.log('🔍 Candidate:', JSON.stringify(candidate, null, 2));

    // Check if candidate has content
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.log('❌ No content in candidate - Gemini infrastructure issue');
      return "I'm having temporary issues. Let me help you with these platform features instead.";
    }

    // ✅ FIXED: Access text via response structure (not .text() method)
    const text = response.candidates[0]?.content?.parts?.text;
    
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

// async function generateText(prompt, retries = 2) {
//   for (let attempt = 1; attempt <= retries + 1; attempt++) {
//     try {
//       const response = await genAI.models.generateContent({
//         model: 'gemini-2.0-flash-lite',
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: {
//           temperature: 0.7 + (attempt * 0.1), // Slightly vary temperature on retries
//           topK: 40,
//           topP: 0.95,
//           maxOutputTokens: 1024,
//         }
//       });

//       const text = response.candidates?.?.content?.parts?.?.text;
      
//       if (text && text.trim()) {
//         console.log(`✅ Gemini success on attempt ${attempt}`);
//         return text.trim();
//       } else {
//         console.log(`⚠️ Empty response on attempt ${attempt}/${retries + 1}`);
//         if (attempt <= retries) {
//           await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Wait before retry
//           continue;
//         }
//       }
//     } catch (error) {
//       console.error(`❌ Attempt ${attempt} failed:`, error.message);
//       if (attempt <= retries) {
//         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
//         continue;
//       }
//     }
//   }

//   // All retries failed - return contextual fallback
//   console.log('❌ All Gemini attempts failed - using fallback');
  
//   // Return intelligent fallback based on the prompt
//   if (prompt.toLowerCase().includes('project')) {
//     return "For project management, I'd recommend focusing on clear task organization, regular team communication, and setting realistic deadlines. What specific aspect would you like help with?";
//   } else if (prompt.toLowerCase().includes('task')) {
//     return "For task management, break large tasks into smaller ones, set priorities, and use our Kanban board to track progress. Need help with anything specific?";
//   } else {
//     return "I'm having temporary issues, but I'm here to help! You can ask me about creating projects, managing tasks, adding team members, or using our collaboration features.";
//   }
// }


// Fixed structured data generation
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
        // Use structured output
        responseMimeType: "application/json"
      }
    });

    // ✅ FIXED: Access text via response structure
    const text = response.candidates[0]?.content?.parts?.text;
    
    if (!text || text.trim() === '') {
      console.log('❌ Empty response - using fallback');
      return getFallbackIdeas();
    }

    try {
      return JSON.parse(text);
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
