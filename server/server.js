const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['https://your-frontend-app.onrender.com', 'http://localhost:3000']
}));

// ... rest of the existing code ... 