# Collaborative AI-Powered Ideation & Project Management Platform

[**Live Demo**](https://g11-project-1-ai-powered-collaborat.vercel.app/)

A comprehensive platform that enables teams to collaboratively brainstorm ideas, plan projects, and manage tasks with real-time interaction and AI assistance for enhanced productivity. Built with modern MERN stack technology and integrated with AI APIs for next-generation project collaboration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Core Modules](#core-modules)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

**Problem Statement:** Traditional project management tools lack intelligent brainstorming capabilities and real-time collaborative features that modern distributed teams need.

**Solution:** A unified platform that combines:
- AI-powered collaborative ideation
- Real-time project management
- Interactive whiteboard collaboration
- Role-based team coordination
- Intelligent task management

## Features

### 🤖 AI-Powered Intelligence
- **Smart Idea Generation** - Generate creative project ideas using Google Gemini AI with contextual prompts
- **AI Chat Assistant** - Get real-time help with project planning, task breakdown, and problem-solving
- **Intelligent Suggestions** - AI-powered recommendations for task assignments and project optimization
- **Automated Insights** - AI-driven analytics that identify bottlenecks and suggest improvements

### 🎨 Collaborative Whiteboard & Ideation
- **Real-Time Drawing** - Synchronized drawing tools with multiple brush types and colors
- **Interactive Elements** - Add sticky notes, shapes, text boxes, and connectors
- **Mind Mapping** - Create and collaborate on visual mind maps for brainstorming

### 📊 Advanced Project Management
- **Customizable Kanban Boards** - Create unlimited boards with custom columns and swimlanes
- **Priority Management** - Color-coded priorities with automatic sorting and filtering
- **Time Tracking** - Built-in time logging for tasks and projects
- **Milestone Tracking** - Set and monitor project milestones with progress visualization
- **Resource Allocation** - Assign team members and track workload distribution
- **Project Templates** - Save successful project structures as reusable templates

### 👥 Team Collaboration & Communication
- **Real-Time Messaging** - Instant chat with emoji reactions and file sharing
- **Threaded Discussions** - Organized conversations around specific tasks and topics
- **Voice Notes** - Quick audio messages for faster communication
- **Status Updates** - Share progress updates and announcements
- **Activity Feed** - Real-time stream of all project activities and changes

### 🔐 Advanced Security & Access Control
- **Multi-Level RBAC** - Granular permissions for different user roles and responsibilities
- **Project-Level Permissions** - Control access to specific projects and features
- **Two-Factor Authentication** - Enhanced security with OTP verification
- **Session Management** - Secure session handling with automatic timeout
- **Audit Logging** - Comprehensive activity logs for security and compliance
- **Data Encryption** - End-to-end encryption for sensitive project data
- **API Rate Limiting** - Protection against abuse and unauthorized access

### 📄 Document Management & Version Control
- **Collaborative Editing** - Real-time document editing with conflict resolution
- **Version History** - Complete revision tracking with diff visualization
- **Export Formats** - Support for PDF, Word, and other popular formats

### 📈 Analytics & Reporting
- **Project Dashboards** - Visual overview of project health and progress
- **Team Performance Metrics** - Individual and team productivity analytics
- **Trend Analysis** - Identify patterns in team performance and project outcomes

### 🔄 Real-Time Synchronization
- **Live Updates** - Instant synchronization across all connected devices
- **Cross-Platform** - Seamless experience across desktop, tablet, and mobile devices  

## Technology Stack

### Frontend
- **React.js 19** - Modern UI library with hooks and context
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router v7** - Client-side routing
- **Framer Motion** - Animation library
- **React Hook Form** - Form handling and validation

### Backend
- **Node.js** - Runtime environment
- **Express.js 5** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication

### AI & External Services
- **Google Gemini AI** - AI-powered idea generation and assistance
- **Brevo (Sendinblue)** - Email service for OTP and notifications
- **Cloudinary** - Cloud-based image and video management
- **tldraw** - Collaborative whiteboard and drawing SDK

### Development Tools
- **ESLint** - Code linting and formatting
- **Nodemon** - Development server auto-restart
- **Node-cron** - Scheduled task management

## Core Modules

### 1. AI-Powered Brainstorming
- Generate creative ideas using Google Gemini AI
- Collaborative idea refinement and categorization
- Smart suggestion system based on project context
- Save and organize ideas for future reference

### 2. Real-Time Collaborative Whiteboard
- Interactive drawing and sketching capabilities
- Sticky notes and mind mapping tools
- Real-time synchronization across all participants
- Powered by tldraw SDK with Socket.IO integration

### 3. Project Management
- **Kanban Boards** - Customizable columns with drag-and-drop functionality
- **Task Management** - Create, assign, and track task progress
- **Project Organization** - Multi-project workspace management
- **Deadline Tracking** - Due date management and notifications

### 4. Role-Based Access Control (RBAC)
- **Super Admin** - Full platform control and user management
- **Admin** - Project oversight and team management
- **Project Manager** - Project-specific control and task assignment
- **Team Member** - Task execution and collaboration
- **Guest** - Limited read-only access

### 5. Communication Hub
- **Real-Time Chat** - Instant messaging within projects
- **Threaded Comments** - Task-specific discussions
- **Meeting Management** - Schedule and conduct team meetings
- **Notification System** - Stay updated on project activities

### 6. Document Management
- **Collaborative Editing** - Real-time document collaboration
- **Version Control** - Track changes and restore previous versions
- **File Storage** - Secure cloud storage integration
- **Document Sharing** - Controlled access and permissions

### 7. Analytics & Insights
- **Project Progress Tracking** - Visual representation of completion status
- **Team Performance Metrics** - Individual and team productivity insights
- **Activity Monitoring** - Comprehensive activity logs
- **Custom Reports** - Generate detailed project reports

## How It Works

### Getting Started
1. **User Registration** - Sign up with email verification
2. **Profile Setup** - Complete user profile and preferences
3. **Project Creation** - Create new projects or join existing ones
4. **Team Collaboration** - Invite team members and assign roles

### Project Workflow
1. **Ideation Phase**
   - Use AI-powered brainstorming to generate ideas
   - Collaborate on the whiteboard to visualize concepts
   - Organize and prioritize ideas for implementation

2. **Planning Phase**
   - Create project structure and milestones
   - Break down ideas into actionable tasks
   - Assign responsibilities and set deadlines

3. **Execution Phase**
   - Track progress using Kanban boards
   - Communicate through real-time chat and comments
   - Collaborate on documents and resources

4. **Monitoring Phase**
   - Monitor progress through analytics dashboard
   - Generate reports and insights
   - Conduct regular team meetings and reviews


## Project Structure

```
G11-PROJECT1/
├── backend/                    # Node.js Express Server
│   ├── config/                 # Database and service configurations
│   ├── controllers/            # API request handlers
│   ├── middleware/             # Authentication and authorization
│   ├── models/                 # MongoDB schemas and models
│   ├── routes/                 # API route definitions
│   ├── services/              # Business logic and external APIs
│   ├── socket/                # Socket.IO real-time handlers
│   └── utils/                 # Helper functions and utilities
│
├── Collab-Ideation/           # React Frontend Application
│   ├── public/                # Static assets and files
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── admin/         # Admin panel components
│   │   │   ├── ai/            # AI-related components
│   │   │   ├── analytics/     # Dashboard and charts
│   │   │   ├── auth/          # Authentication forms
│   │   │   ├── chat/          # Messaging components
│   │   │   ├── documents/     # Document editor
│   │   │   ├── meetings/      # Meeting management
│   │   │   ├── projects/      # Project management
│   │   │   └── tasks/         # Task management
│   │   ├── context/           # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API communication
│   │   └── utils/             # Frontend utilities
│   └── package.json
│
└── README.md                  # Project documentation
```

## Contributing

We welcome contributions to improve the platform! Here's how you can get involved:

### Development Guidelines
- **Code Quality** - Follow existing code patterns and conventions
- **Error Handling** - Implement proper validation and error boundaries
- **Testing** - Test all functionality thoroughly, especially real-time features
- **Documentation** - Add clear comments for complex logic and components
- **RBAC Compliance** - Ensure all changes respect role-based permissions

### Code Standards
- Use meaningful variable and function names
- Follow React best practices and modern hooks patterns
- Implement proper loading states and error boundaries
- Maintain responsive design principles across all devices
- Follow the established project structure and naming conventions
- Write clean, self-documenting code with appropriate comments

### Areas for Contribution
- **Feature Development** - Add new collaborative tools and AI capabilities
- **Performance Optimization** - Improve real-time sync and rendering performance
- **User Experience** - Enhance accessibility, usability, and interface design
- **Testing & Quality** - Add comprehensive unit, integration, and end-to-end tests
- **Documentation** - Improve code comments, user guides, and API documentation
- **Security** - Strengthen authentication, authorization, and data protection
- **Mobile Experience** - Optimize mobile responsiveness and PWA features
- **Internationalization** - Add multi-language support and localization

### Technical Priorities
- **Real-Time Performance** - Optimize Socket.IO connections and data synchronization
- **AI Integration** - Enhance AI capabilities and add new intelligent features
- **Scalability** - Improve database queries and implement caching strategies
- **Cross-Browser Support** - Ensure compatibility across all major browsers
- **API Development** - Expand REST API endpoints and improve error handling

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author
- **Pranav Raj Chaudhary** 
 

---
 

⭐ If you find this project useful, please consider giving it a star on GitHub!
```

🤝 Contributing

Contributions are welcome!

Fork this repo

Create your feature branch (git checkout -b feature-name)

Commit changes (git commit -m 'Add new feature')

Push to branch (git push origin feature-name)

Open a Pull Request 🚀


⭐ If you like this project, don’t forget to star the repo on GitHub!
