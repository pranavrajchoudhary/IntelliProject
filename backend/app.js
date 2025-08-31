const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const docRoutes = require('./routes/documents');
const errorHandler = require('./middleware/error');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const aiRoutes = require('./routes/ai');
const aiChatRoutes = require('./routes/aiChat');
const uploadRoutes = require('./routes/upload');
const meetingRoutes = require('./routes/meetings');
const ideaRoutes = require('./routes/idea');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60*1000, max: 200 }));

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes); 
app.use('/documents', docRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/upload', uploadRoutes);
app.use('/meetings', meetingRoutes);
app.use('/ideas', ideaRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  message: 'Backend is awake and ready!',
  timestamp: new Date().toISOString() 
}));


app.use(errorHandler);

module.exports = app;