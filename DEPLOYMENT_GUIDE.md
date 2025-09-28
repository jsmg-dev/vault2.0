# Render Deployment Configuration

## Backend Deployment Steps:

### 1. Go to [render.com](https://render.com) and sign up/login

### 2. Create a New Web Service:
- **Connect Repository**: Connect your GitHub account and select `jsmg-dev/vault2.0`
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free

### 3. Environment Variables to Add:
```
NODE_ENV=production
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
SESSION_SECRET=your-session-secret-key
```

### 4. Database Setup:
You'll need a PostgreSQL database. Render provides free PostgreSQL databases:
- Create a new PostgreSQL database in Render
- Use the connection details in your environment variables

### 5. Update Frontend Environment:
Once backend is deployed, update `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-app-name.onrender.com'
};
```

## Alternative: Quick Backend Deployment

If you want to deploy quickly, you can also use:
- **Railway**: railway.app
- **Heroku**: heroku.com (with credit card)
- **Vercel**: vercel.com (for serverless functions)

## Current Issue:
Your frontend is trying to connect to `https://vault2-0.onrender.com` but this backend URL might not exist or be properly configured.
