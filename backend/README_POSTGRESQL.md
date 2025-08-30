# PostgreSQL Migration Guide

This guide will help you migrate from SQLite to PostgreSQL while maintaining the same schema and API functionality.

## Prerequisites

1. **PostgreSQL installed** on your system
2. **Node.js** with the required dependencies (already installed)

## Setup Steps

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE vault_db;
CREATE USER vault_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vault_db TO vault_user;
\q
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with:

```env
# PostgreSQL Database Configuration
DB_USER=vault_user
DB_HOST=localhost
DB_NAME=vault_db
DB_PASSWORD=your_password
DB_PORT=5432

# Server Configuration
PORT=8080
SESSION_SECRET=your_session_secret_here
```

### 3. Initialize PostgreSQL Schema

```bash
# Connect to your database
psql -U vault_user -d vault_db -h localhost

# Run the schema file
\i schema.sql

# Exit
\q
```

### 4. Migrate Data from SQLite

```bash
# Run the migration script
node migrate.js
```

### 5. Test the Application

```bash
# Start the server
npm start
```

## What Changed

### Database Layer
- **SQLite3** → **PostgreSQL** with `pg` package
- **Connection pooling** for better performance
- **Parameterized queries** using `$1, $2, ...` syntax

### SQL Compatibility
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `strftime('%m', date)` → `EXTRACT(MONTH FROM date::date)`
- `IFNULL()` → `COALESCE()`
- `?` placeholders → `$1, $2, ...` placeholders

### API Compatibility
- All existing API endpoints work exactly the same
- Same request/response formats
- Same authentication and session handling
- Same business logic

## Verification

After migration, verify:

1. **Login works**: `POST /login` with admin/admin123
2. **Customer operations**: All CRUD operations work
3. **Reports**: EMI and customer reports generate correctly
4. **Dashboard**: Metrics display properly

## Troubleshooting

### Connection Issues
- Check PostgreSQL service is running: `sudo systemctl status postgresql`
- Verify credentials in `.env` file
- Check firewall settings

### Migration Errors
- Ensure PostgreSQL schema is created before migration
- Check table permissions for the database user
- Verify SQLite database file exists and is accessible

### Data Issues
- Check PostgreSQL logs for constraint violations
- Verify data types match between SQLite and PostgreSQL
- Use `\dt` in psql to list tables and verify structure

## Rollback

If you need to rollback to SQLite:

1. Stop the server
2. Restore the original `db.js` file
3. Restart the server

The SQLite database file remains unchanged during migration.
