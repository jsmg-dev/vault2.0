#!/bin/bash

# PostgreSQL Setup and Migration Script for Vault Application

echo "🚀 Setting up PostgreSQL for Vault Application..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service first."
    echo "   On Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   On macOS: brew services start postgresql"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# PostgreSQL Database Configuration
DB_USER=vault_user
DB_HOST=localhost
DB_NAME=vault_db
DB_PASSWORD=vault_password_123
DB_PORT=5432

# Server Configuration
PORT=8080
SESSION_SECRET=vault_session_secret_$(date +%s)
EOF
    echo "✅ Created .env file with default values"
    echo "   Please review and modify the .env file if needed"
fi

# Load environment variables
source .env

echo "📋 Setting up database: $DB_NAME"
echo "👤 Database user: $DB_USER"

# Create database and user (requires superuser privileges)
echo "🔐 Creating database and user (requires PostgreSQL superuser privileges)..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully"
else
    echo "❌ Failed to create database. You may need to run this script with sudo or manually create the database."
    exit 1
fi

# Initialize schema
echo "📋 Initializing database schema..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h $DB_HOST -f schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema initialized successfully"
else
    echo "❌ Failed to initialize schema"
    exit 1
fi

# Run migration
echo "🔄 Migrating data from SQLite to PostgreSQL..."
npm run migrate

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo ""
echo "🎉 PostgreSQL setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review the .env file and update credentials if needed"
echo "2. Start the server: npm start"
echo "3. Test the application: http://localhost:$PORT"
echo ""
echo "Default admin credentials: admin/admin123"
