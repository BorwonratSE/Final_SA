require('dotenv').config();
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/tasks');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.get('/api/tasks/health', (_, res) => res.json({ status: 'ok', service: 'task-service' }));

app.listen(process.env.PORT || 3002, () => console.log('Task Service on 3002'));