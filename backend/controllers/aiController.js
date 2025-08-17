const { generateText } = require('../services/aiService');
const Idea = require('../models/Idea');
const Project = require('../models/Project');

const generateIdeas = async (req, res) => {
    const { prompt, projectId } = req.body;

    try {
        let finalPrompt = `${prompt}.
Return only valid JSON array, no markdown, no code block, no explanation.`;

        let isProjectMode = false;

        // If projectId is provided → add project context
        if (projectId) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            const existingIdeas = await Idea.find({ project: projectId }).select('text');
            const existingTexts = existingIdeas.map(i => i.text);

            finalPrompt = `
You are an expert product strategist.
Project Title: ${project.title}
Description: ${project.description}

User Prompt: ${prompt}

Existing Ideas: ${existingTexts.length ? existingTexts.join("; ") : "None"}

Generate unique and creative ideas for this project.
Avoid repeating existing ideas.
For each idea, return:
- Title
- Short Description[Should give]
- Category (UI, AI, Performance, Marketing, etc.)
- Priority (High, Medium, Low)
- Feasibility score (1 to 10)
- Tags (comma-separated)
Return only raw valid JSON array without any extra text, markdown, or code block formatting.
`;
            isProjectMode = true;
        }

        
        const ideasArray = await generateText(finalPrompt);

         
        let savedIdeas = [];
        if (isProjectMode) {
            savedIdeas = await Idea.insertMany(
                ideasArray.map(idea => ({
                    text: idea.Title,
                    description: idea.ShortDescription,
                    category: idea.Category,
                    priority: idea.Priority,
                    feasibility: idea.Feasibility,
                    tags: idea.Tags.split(",").map(t => t.trim()),
                    project: projectId,
                    createdBy: req.user.id
                }))
            );
        }

        res.status(201).json({
            mode: isProjectMode ? "project" : "general",
            ideas: isProjectMode ? savedIdeas : ideasArray
        });

    } catch (error) {
        console.error("AI Idea Generation Error:", error);
        res.status(500).json({ message: error.message || "Failed to generate ideas." });
    }
};

module.exports = { generateIdeas };
