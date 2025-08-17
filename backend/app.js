const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const docRoutes = require('./routes/documents');
const errorHandler = require('./middleware/error');

const app = express();

// middlewares
app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60*1000, max: 200 }));

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/ai', aiRoutes);
app.use('/documents', docRoutes);

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;