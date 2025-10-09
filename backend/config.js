// Configuration file for Vault Backend
module.exports = {
  // Database Configuration
  database: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vault_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 60 * 60 * 1000, // 1 hour
      secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
      httpOnly: true,
      sameSite: 'none' // Required for cross-origin requests
    }
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 8080
  },

  // CORS Configuration
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://vaultssb.netlify.app',
        'https://vault.sbbf.in',
        'https://vaultsbbf.netlify.app'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(null, true); // Allow all for development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Cache-Control',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
};
