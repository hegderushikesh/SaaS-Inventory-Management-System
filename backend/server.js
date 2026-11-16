require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const startServer = async () => {
  try {
    // Verify MySQL database connection
    await testConnection();

    server.listen(PORT, () => {
      console.log(`[StockFlow Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[StockFlow Backend] Health check accessible at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[StockFlow Backend] Database connection failed. Aborting startup:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[StockFlow Backend] SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('[StockFlow Backend] HTTP server closed.');
    process.exit(0);
  });
});
