const asyncHandler = require('../utils/asyncHandler');
const { generateText } = require('../services/aiService');
const Project = require('../models/Project');
const Task = require('../models/Task');

const platformResponses = {
  'hi': {
    message: 'Hi! I\'m your AI assistant. How can I help you with our collaboration platform?',
    options: [
      'How do I create a project?',
      'How do I add team members?',
      'How does the Kanban board work?',
      'How do I use the AI idea generator?'
    ]
  },
  'How do I create a project?': {
    message: 'To create a project:\n1. Go to the Projects page\n2. Click "New Project" button\n3. Fill in title and description\n4. Add team members\n5. Click "Create Project"\n\nYour project will be ready with a Kanban board!',
    options: [
      'How do I add tasks?',
      'How do I manage team members?',
      'Tell me about Kanban boards'
    ]
  },
  'How do I add team members?': {
    message: 'You can add team members:\n\n**When creating:** Select from dropdown\n**For existing:** Projects → Edit → Add Members → Save',
    options: [
      'What are user roles?',
      'How do permissions work?'
    ]
  },
  'How does the Kanban board work?': {
    message: 'Our Kanban has 3 columns:\n📋 **To Do** - New tasks\n⚡ **In Progress** - Active\n✅ **Done** - Complete\n\nDrag & drop between columns for real-time updates!',
    options: [
      'How do I create tasks?',
      'How do I assign tasks?'
    ]
  },
  'How do I use the AI idea generator?': {
    message: 'AI Ideas help brainstorm:\n1. Open any project\n2. Click "AI Ideas"\n3. Enter your prompt\n4. Get contextual suggestions with priorities!',
    options: [
      'What makes good prompts?',
      'How are ideas saved?'
    ]
  }
};

exports.chatWithAI = asyncHandler(async (req, res) => {
  console.log('💬 AI Chat Request:', req.body);
  const { message } = req.body;
  const userMessage = message.toLowerCase().trim();

  let response = platformResponses[message] || platformResponses[userMessage];
  
  if (!response) {
    const keys = Object.keys(platformResponses);
    const partialMatch = keys.find(key => 
      key.toLowerCase().includes(userMessage) || 
      userMessage.includes(key.toLowerCase())
    );
    if (partialMatch) {
      response = platformResponses[partialMatch];
    }
  }

  if (!response) {
    try {
      const platformPrompt = `You are a helpful AI assistant for "Collab-Ideation", a modern project collaboration platform. 

Our platform features:
- Project management with Kanban boards (To Do, In Progress, Done)
- Real-time chat and messaging between team members
- AI-powered idea generation for projects
- Document collaboration and version control
- Team management with roles (admin, pm, member, guest)
- Task assignment and due date tracking
- Analytics and project insights

User question: "${message}"

Please provide a helpful, concise answer (max 200 words) related to our platform. If the question isn't about our platform, politely redirect them to our collaboration features. Always be friendly and professional.`;

      const aiResponse = await generateText(platformPrompt);
      
      return res.json({
        message: aiResponse,
        isAdvanced: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Gemini AI error:', error);
      response = {
        message: "I'm having trouble right now. Let me help you with these platform features:",
        options: [
          'How do I create a project?',
          'How do I add team members?',
          'How does the Kanban board work?'
        ]
      };
    }
  }

  res.json({
    message: response.message,
    options: response.options || null,
    timestamp: new Date().toISOString()
  });
});

exports.projectChatWithAI = asyncHandler(async (req, res) => {
  console.log('🎯 Project AI Chat Request:', req.body);
  const { message, projectId } = req.body;

  try {
    const project = await Project.findById(projectId).populate('members', 'name');
    const tasks = await Task.find({ project: projectId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const memberNames = project.members.map(m => m.name).join(', ');

    const projectPrompt = `You are an AI assistant helping with the project "${project.title}".

Project Details:
- Title: ${project.title}
- Description: ${project.description || 'No description provided'}
- Team Members: ${memberNames || 'No members assigned'}
- Tasks Status:
  * To Do: ${todoTasks} tasks
  * In Progress: ${inProgressTasks} tasks  
  * Done: ${doneTasks} tasks
- Total Tasks: ${tasks.length}

Recent Tasks: ${tasks.slice(0, 5).map(t => `- ${t.title} (${t.status})`).join('\n') || 'No tasks yet'}

User question: "${message}"

Provide helpful advice specific to this project. You can suggest:
- Task management strategies
- Team collaboration improvements  
- Project organization tips
- Next steps based on current progress

Keep responses concise (max 150 words) and actionable.`;

    const aiResponse = await generateText(projectPrompt);

    res.json({
      message: aiResponse,
      isProjectSpecific: true,
      projectTitle: project.title,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Project AI chat error:', error);
    res.json({
      message: "I'm having trouble accessing project details right now. Try asking about general project management tips!",
      timestamp: new Date().toISOString()
    });
  }
});

exports.generateProjectIdeas = asyncHandler(async (req, res) => {
  console.log('💡 Project Ideas Request:', req.body);
  const { topic, industry } = req.body;

  try {
    const ideaPrompt = `Generate 5 creative project ideas for: "${topic}"
${industry ? `Industry focus: ${industry}` : ''}

For each project idea, provide:
- Project Title (catchy and descriptive)
- Brief Description (2-3 sentences)
- Target Audience
- Key Features (3-4 main features)
- Difficulty Level (Beginner/Intermediate/Advanced)
- Estimated Timeline
- Technology Suggestions

Make ideas innovative, feasible, and market-relevant. Focus on projects that teams can collaborate on using our platform.

Format as clean, readable text (not JSON).`;

    const aiResponse = await generateText(ideaPrompt);

    res.json({
      message: aiResponse,
      isIdeaGeneration: true,
      topic,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Project ideas generation error:', error);
    res.json({
      message: `Here are some ${topic} project ideas:\n\n1. **${topic} Management Platform** - Build a comprehensive solution for managing ${topic}-related tasks and workflows\n\n2. **${topic} Analytics Dashboard** - Create insights and reporting tools for ${topic} data\n\n3. **${topic} Mobile App** - Develop a user-friendly mobile application focused on ${topic}\n\n4. **${topic} Automation Tool** - Design workflows to automate common ${topic} processes\n\n5. **${topic} Community Platform** - Build a social platform for ${topic} enthusiasts to collaborate`,
      isIdeaGeneration: true,
      topic,
      timestamp: new Date().toISOString()
    });
  }
});
