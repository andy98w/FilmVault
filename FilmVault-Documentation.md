# FilmVault Application Technical Documentation

## Overview

FilmVault is a full-stack web application for movie enthusiasts to browse, search, and create personalized movie collections. The application consists of a React frontend and a Node.js/Express backend, deployed on Oracle Cloud Infrastructure.

## Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Database Design](#database-design)
4. [Authentication System](#authentication-system)
5. [Infrastructure and Deployment](#infrastructure-and-deployment)
6. [Object Storage](#object-storage)
7. [Security Considerations](#security-considerations)

## Frontend Architecture

### Core React Technologies

- **React**: v19.1.0 - UI component library
- **TypeScript**: v4.9.5 - Static type checking
- **React Router**: v7.5.0 - Client-side routing
- **Axios**: v1.8.4 - HTTP client
- **JWT-decode**: v4.0.0 - Token parsing

The frontend is a single-page application (SPA) built with Create React App. It employs TypeScript for type safety and follows modern React best practices.

### Key Application Structure

```
client/
   public/           # Static assets
      images/       # Image assets
      index.html    # HTML template
   src/
      api/          # API client configuration
      components/   # Reusable UI components
      contexts/     # React contexts for state management
      pages/        # Route-specific page components
      App.tsx       # Application entry point
```

### State Management

The application uses React's Context API for state management, primarily through:

- **AuthContext**: Manages user authentication state, login/logout functionality, and JWT token handling
- **Component-level state**: Local state using useState and useEffect hooks for component-specific data

### Routing

React Router handles client-side routing with protected routes that require authentication:

- Public routes: Login, Register, ForgotPassword, ResetPassword, VerifyEmail
- Protected routes: Home, MyMovies, MovieDetails, Profile, SearchPage, etc.

### API Communication

Axios is configured to:
- Use a baseURL that adapts to development/production environments
- Include credentials (cookies) with requests
- Automatically attach JWT tokens to request headers
- Handle authentication errors and token expiration

## Backend Architecture

### Core Node.js Technologies

- **Express**: Web framework for building the API
- **TypeScript**: Type-safe code
- **MySQL2**: Database driver with promise support
- **Jsonwebtoken**: JWT token generation and validation
- **Bcrypt**: Password hashing
- **Cookie-parser**: HTTP cookie parsing
- **Cors**: Cross-Origin Resource Sharing configuration
- **Multer**: File upload handling
- **SendGrid/Nodemailer**: Email services for verification

### API Structure

```
server/
   src/
      config/       # Configuration files
      middleware/   # Express middleware
      routes/       # API route handlers
      services/     # Business logic services
      index.ts      # Application entry point
```

### Middleware Stack

1. CORS configuration with credentials support
2. JSON body parser
3. Cookie parser
4. Authentication middleware for protected routes
5. Error handling middleware

### Endpoint Groups

- `/api/auth`: Authentication (login, register, verification)
- `/api/movies`: Movie data operations
- `/api/users`: User profile management
- `/api/admin`: Admin-only operations

## Database Design

### Schema

The application uses a MySQL database with the following core tables:

- **users**: User accounts and profile information
- **movies**: Movie metadata cached from external APIs
- **user_movies**: Junction table for user movie collections
- **movie_ratings**: User movie ratings

### Key Relationships

- Users can have many movies in their collection (many-to-many)
- Users can rate many movies (one-to-many)
- Movies can be in many user collections (many-to-many)

### Database Connection

The backend establishes a connection pool to the MySQL database:
- Connection parameters are loaded from environment variables
- Pool configuration ensures efficient connection reuse
- Error handling provides graceful fallback to mock data when needed
- Automatic retry logic for transient connection failures

## Authentication System

### Dual Authentication Approach

FilmVault implements a hybrid authentication system:

1. **JWT Tokens**: 
   - Stored in both cookies and localStorage
   - 7-day expiration
   - Contains user ID, username, email, and admin status

2. **HttpOnly Cookies**:
   - `auth_token` cookie with HttpOnly flag
   - Secure flag enabled for HTTPS
   - SameSite=None to support cross-domain API/client
   - 7-day expiration matching JWT

### Authentication Flow

1. **Registration**:
   - User provides username, email, password
   - Password is hashed with bcrypt
   - Verification token is generated and sent via email
   - Unverified account created in database

2. **Email Verification**:
   - User clicks link in email with verification token
   - Token validated on server
   - User account marked as verified

3. **Login**:
   - User provides email and password
   - Password compared with hashed version
   - JWT token generated and set in both cookie and localStorage
   - User profile data returned to client

4. **Authentication Checks**:
   - Protected routes check for valid JWT
   - Server middleware validates token on API requests
   - Token from cookie prioritized over Authorization header

5. **Password Reset**:
   - User requests reset via email
   - Reset token sent via email
   - Token validated when new password submitted
   - Previous auth tokens invalidated

## Infrastructure and Deployment

### Oracle Cloud Infrastructure

FilmVault is deployed on OCI with the following resources:

- **Compute**: VM.Standard.E4.Flex (1 OCPU, 16GB RAM)
- **Database**: MySQL Database Service
- **Storage**: Object Storage bucket for profile pictures
- **Networking**: Virtual Cloud Network with public subnet

### Terraform Provisioning

Infrastructure is defined as code using Terraform:

```
terraform/
   main.tf           # Provider configuration
   compute.tf        # VM instance definition
   object_storage.tf # Storage bucket configuration
   server_nsg.tf     # Network security group rules
   iam_policy.tf     # Identity and access policies
```

Key provisioned resources include:
- Compute instance with necessary security rules
- Object storage bucket with appropriate permissions
- MySQL database with backup configuration
- Virtual network with security lists

### Deployment Process

The application is deployed as two separate components:

1. **Backend (Node.js API)**:
   - Packaged as tar.gz archive
   - Deployed to /opt/filmvault-server
   - Run using PM2 process manager
   - Nginx reverse proxy to expose API endpoints

2. **Frontend (React SPA)**:
   - Built using `npm run build`
   - Static files served by Nginx
   - Deployed to /opt/filmvault-client/build

## Object Storage

### Profile Picture Storage

User profile pictures are stored in OCI Object Storage:

1. **Upload Process**:
   - Images uploaded through multipart/form-data
   - Processed with Sharp for resizing and optimization
   - Stored in object storage bucket with unique filenames

2. **Access Method**:
   - Pre-Authenticated Requests (PAR) for simplified access
   - Public read access, authenticated write access
   - URLs with expiration policies for secure access

3. **Fallback Mechanism**:
   - Local filesystem storage when cloud storage unavailable
   - Default profile picture for users without uploads

### Storage Service

The application includes a storage service abstraction that:
- Handles both cloud and local storage options
- Automatically detects environment and uses appropriate storage
- Provides consistent interface regardless of storage backend

## Security Considerations

### Cross-Origin Resource Sharing (CORS)

- Configured to allow specific origins
- Credentials allowed for cookie-based authentication
- Appropriate headers exposed for frontend functionality

### Cookie Security

- HttpOnly flag prevents JavaScript access to authentication cookies
- Secure flag ensures cookies only sent over HTTPS
- SameSite=None allows cross-domain cookies with appropriate security

### Password Security

- Passwords hashed using bcrypt with appropriate salt rounds
- Password reset tokens with limited validity period
- No password storage in plain text anywhere in the system

### API Security

- Input validation on all endpoints
- Middleware protection for authenticated routes
- Role-based access control for admin functions

### Infrastructure Security

- Network security groups limiting inbound traffic
- HTTPS encryption for all production traffic
- Database accessible only from application server
- Regular updates and security patches

---
