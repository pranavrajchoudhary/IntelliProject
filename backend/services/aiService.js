const fetch = require('node-fetch');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateText(prompt) {
    const MODEL = "gemini-1.5-flash";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    );

    const data = await response.json();

 
    if (data.error) {
        throw new Error(data.error.message || "Gemini API error");
    }

 
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
        throw new Error("No content returned from Gemini");
    }


  
    try {
        // Remove markdown code fences if present
        rawText = rawText.replace(/```json|```/g, "").trim();
        return JSON.parse(rawText);
    } catch (err) {
        throw new Error("Invalid JSON format from Gemini");
    }
}

module.exports = { generateText };
