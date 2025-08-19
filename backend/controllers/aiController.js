const { generateStructuredData } = require('../services/aiService');
const Idea = require('../models/Idea');
const Project = require('../models/Project');

const generateIdeas = async (req, res) => {
  const { prompt, projectId } = req.body;

  try {
    let finalPrompt = '';
    let isProjectMode = false;

    // If projectId is provided → add project context
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const existingIdeas = await Idea.find({ project: projectId }).select('text');
      const existingTexts = existingIdeas.map(i => i.text);

      finalPrompt = `You are an expert product strategist.

Project Title: ${project.title}
Description: ${project.description}
User Prompt: ${prompt}
Existing Ideas: ${existingTexts.length ? existingTexts.join("; ") : "None"}

Generate 5 unique and creative ideas for this project. Avoid repeating existing ideas.

For each idea, return exactly this JSON structure:
{
  "Title": "Creative title here",
  "ShortDescription": "Detailed 2-3 sentence description",
  "Category": "UI/UX/AI/Performance/Marketing/Feature/etc",
  "Priority": "High/Medium/Low",
  "Feasibility": 8,
  "Tags": "tag1, tag2, tag3"
}

Return only a JSON array of exactly 5 ideas, no extra text or markdown.`;

      isProjectMode = true;
    } else {
      // General idea generation
      finalPrompt = `Generate 5 creative ideas for: ${prompt}

For each idea, return exactly this JSON structure:
{
  "Title": "Creative title here", 
  "ShortDescription": "Detailed 2-3 sentence description",
  "Category": "General",
  "Priority": "Medium",
  "Feasibility": 7,
  "Tags": "creative, innovative, practical"
}

Return only a JSON array of exactly 5 ideas, no extra text or markdown.`;
    }

    const ideasArray = await generateStructuredData(finalPrompt);
    
    // Ensure we have an array
    if (!Array.isArray(ideasArray)) {
      throw new Error('AI did not return an array of ideas');
    }

    let savedIdeas = [];

    if (isProjectMode) {
      // Save ideas to database
      savedIdeas = await Idea.insertMany(
        ideasArray.map(idea => ({
          text: idea.Title,
          description: idea.ShortDescription,
          category: idea.Category,
          priority: idea.Priority,
          feasibility: idea.Feasibility,
          tags: idea.Tags ? idea.Tags.split(",").map(t => t.trim()) : [],
          project: projectId,
          createdBy: req.user.id
        }))
      );
    }

    res.status(201).json({
      mode: isProjectMode ? "project" : "general",
      ideas: isProjectMode ? savedIdeas : ideasArray,
      success: true
    });

  } catch (error) {
    console.error("AI Idea Generation Error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to generate ideas.",
      success: false 
    });
  }
};

module.exports = { generateIdeas };
