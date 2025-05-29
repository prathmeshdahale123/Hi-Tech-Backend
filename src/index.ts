import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { connectDatabase } from './config/database';
import { config, validateEnvironment } from './config/environment';
import authRoutes from './routes/authRoutes';
import noticeRoutes from './routes/noticeRoutes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import cookieParser from 'cookie-parser';
import galleryRoutes from './routes/galleryRoutes';

/**
 * Hi-Tech Institute Admin Backend Server
 * Production-ready TypeScript backend with admin authentication and notice board management
 */

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware functions
   */
  private initializeMiddlewares(): void {
    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // HTTP request logging
    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(cookieParser());

    // Serve static files from uploads directory
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // Security headers
    this.app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Hi-Tech Institute Backend is running',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/notices', noticeRoutes);
    this.app.use('/api/gallery', galleryRoutes);

    // API documentation endpoint
    this.app.get('/api', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Hi-Tech Institute Admin Backend API',
        version: '1.0.0',
        endpoints: {
          auth: {
            signin: 'POST /api/auth/signin',
            profile: 'GET /api/auth/profile',
            verify: 'GET /api/auth/verify'
          },
          notices: {
            create: 'POST /api/notices',
            getAll: 'GET /api/notices',
            getById: 'GET /api/notices/:id',
            update: 'PUT /api/notices/:id',
            delete: 'DELETE /api/notices/:id'
          },
          gallery: {
            uploadImage : 'POST /api/gallery'
          }
        },
        documentation: 'https://github.com/hitech-institute/admin-backend'
      });
    });
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // Handle 404 errors
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Validate environment variables
      validateEnvironment();

      // Connect to database
      await connectDatabase();

      // Start server
      this.app.listen(config.PORT, '0.0.0.0', () => {
        console.log(`
🚀 Hi-Tech Institute Admin Backend Server Started
📍 Server: http://0.0.0.0:${config.PORT}
🌍 Environment: ${config.NODE_ENV}
📊 Health Check: http://0.0.0.0:${config.PORT}/health
📚 API Docs: http://0.0.0.0:${config.PORT}/api
🔒 Auth Endpoint: http://0.0.0.0:${config.PORT}/api/auth
📋 Notices Endpoint: http://0.0.0.0:${config.PORT}/api/notices
        `);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down server gracefully...');
    
    // Close database connection
    const { closeDatabase } = await import('./config/database');
    await closeDatabase();
    
    console.log('✅ Server shutdown completed');
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM signal
process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received');
  const server = new Server();
  await server.shutdown();
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('📴 SIGINT received');
  const server = new Server();
  await server.shutdown();
});

// Start the server
const server = new Server();
server.start().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
