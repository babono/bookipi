import express from 'express';
import cors from 'cors';
import redis from './redis'; // Imports our connection

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// A simple health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Flash sale server is running' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});