import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Import Routes
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import pizzaRoutes from './routes/pizzas.js';
import addressRoutes from './routes/addresses.js';

// Import Utilities
import seedData from './utils/seeder.js';

// Load Env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middlewares
app.use(cors({
  origin: '*', // For development flexibility
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// Setup HTTP Server and Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Attach Socket.io to the express app context
app.set('socketio', io);

// Socket.io Connection Handlers
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // User joins a room specific to their order ID to watch status updates
  socket.on('joinOrderRoom', (orderId) => {
    socket.join(orderId);
    console.log(`👤 Client ${socket.id} joined room for Order: ${orderId}`);
  });

  // User leaves order room
  socket.on('leaveOrderRoom', (orderId) => {
    socket.leave(orderId);
    console.log(`👤 Client ${socket.id} left room for Order: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Setup API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pizzas', pizzaRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Pizza Delivery Application Backend API is running.');
});

// Connect to Database & Start Server
const startServer = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.log('No MONGODB_URI environment variable detected.');
      console.log('Spinning up a localized MongoDB Memory Server instance...');
      const mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          ip: '127.0.0.1',
          port: 27019
        }
      });
      mongoUri = mongoMemoryServer.getUri();
      console.log(`✅ Local MongoDB Memory Server running at: ${mongoUri}`);
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // Seed data
    await seedData();

    // Start listening
    httpServer.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Backend Server running in development mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
