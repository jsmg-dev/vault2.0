# Vault - Loan Management System

A modern loan management system built with Angular frontend and Node.js/PostgreSQL backend, migrated from the legacy SQLite version.

## 🚀 Features

### Core Functionality
- **User Management**: Admin and user roles with secure authentication
- **Customer Management**: Complete customer lifecycle with file uploads
- **Deposit Tracking**: Monitor customer deposits and payments
- **LIC Policies**: Comprehensive insurance policy management
- **Reports**: Detailed financial and customer reports
- **EMI Calculator**: Loan EMI calculations and tracking

### Technical Features
- **Modern UI**: Beautiful, responsive Angular interface
- **File Uploads**: Customer photos and documents
- **Real-time Updates**: Live data synchronization
- **Secure API**: JWT-based authentication
- **Database**: PostgreSQL with optimized queries
- **Responsive Design**: Works on all devices

## 🛠️ Technology Stack

### Frontend
- **Angular 17**: Modern web framework
- **TypeScript**: Type-safe development
- **CSS3**: Modern styling with responsive design
- **Font Awesome**: Icon library

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **PostgreSQL**: Relational database
- **Multer**: File upload handling
- **Express Session**: User session management
- **CORS**: Cross-origin resource sharing

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Angular CLI 17+

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vault
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create PostgreSQL database
createdb vault_db

# Copy environment configuration
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migrate

# Start the server
npm start
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve
```

### 4. Access the Application
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080

## 🗄️ Database Schema

### Users Table
- User authentication and role management
- Admin and regular user roles

### Customers Table
- Customer information and loan details
- File uploads (photos and documents)
- EMI calculations and tracking

### Deposits Table
- Customer deposit tracking
- Payment history

### LIC Policies Table
- Insurance policy management
- Comprehensive policy details
- Nominee and banking information

## 🔐 Authentication

- Session-based authentication
- Role-based access control
- Secure password handling
- CORS protection

## 📁 File Structure

```
vault/
├── backend/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── uploads/            # File uploads
│   ├── config.js           # Configuration
│   ├── db.js              # Database connection
│   ├── server.js          # Main server file
│   └── schema.sql         # Database schema
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/     # Page components
│   │   │   └── app.routes.ts
│   │   └── assets/        # Static assets
│   └── package.json
└── README.md
```

## 🚀 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Customers
- `GET /customers/list` - Get all customers
- `POST /customers/create` - Create new customer
- `PUT /customers/update/:id` - Update customer
- `DELETE /customers/delete/:id` - Delete customer

### Policies
- `GET /policies/list` - Get all policies
- `POST /policies/add` - Create new policy
- `PUT /policies/update/:id` - Update policy
- `DELETE /policies/delete/:id` - Delete policy

### Deposits
- `GET /deposits/list` - Get all deposits
- `POST /deposits/add` - Add new deposit
- `PUT /deposits/update/:id` - Update deposit

### Reports
- `GET /reports/generate` - Generate reports
- `GET /emi/notifications` - EMI notifications

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=vault_db
DB_PASSWORD=your_password
DB_PORT=5432
SESSION_SECRET=your_secret_key
PORT=8080
```

### Database Configuration
The application uses PostgreSQL with the following default settings:
- Host: localhost
- Port: 5432
- Database: vault_db
- User: postgres

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
ng build --prod

# Backend
cd backend
npm run build
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists

2. **File Upload Issues**
   - Check uploads directory permissions
   - Verify file size limits
   - Check CORS configuration

3. **CORS Errors**
   - Verify frontend URL in CORS config
   - Check credentials setting

## 📝 Migration Notes

This application has been migrated from a legacy SQLite-based system with the following improvements:

- **Database**: SQLite → PostgreSQL
- **Frontend**: HTML templates → Angular SPA
- **Architecture**: Monolithic → Frontend/Backend separation
- **File Handling**: Enhanced file upload capabilities
- **UI/UX**: Modern, responsive design
- **Security**: Improved authentication and authorization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This is a production-ready application that has been migrated from a legacy system. All functionality from the original beta version has been preserved and enhanced.
