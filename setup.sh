#!/bin/bash

echo "🚀 Setting up Vault Loan Management System..."
echo "=============================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Visit: https://www.postgresql.org/download/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if Angular CLI is installed
if ! command -v ng &> /dev/null; then
    echo "📦 Installing Angular CLI..."
    npm install -g @angular/cli
fi

echo "✅ Prerequisites check passed!"

# Create database
echo "🗄️  Setting up database..."
echo "Enter your PostgreSQL password when prompted:"
createdb -U postgres vault_db 2>/dev/null || echo "Database 'vault_db' already exists or creation failed"

# Backend setup
echo "🔧 Setting up backend..."
cd backend
npm install

# Create uploads directory
mkdir -p uploads

echo "✅ Backend setup completed!"

# Frontend setup
echo "🎨 Setting up frontend..."
cd ../frontend
npm install

echo "✅ Frontend setup completed!"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your database credentials in backend/.env"
echo "2. Start the backend: cd backend && npm start"
echo "3. Start the frontend: cd frontend && ng serve"
echo "4. Access the application at http://localhost:4200"
echo ""
echo "🔐 Default login: admin / admin123"
echo ""
echo "📚 For more information, see README.md"
