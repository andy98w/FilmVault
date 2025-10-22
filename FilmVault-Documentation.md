# FilmVault Application Technical Documentation

## Overview

FilmVault is a full-stack web application for movie enthusiasts to browse, search, and create personalized movie collections. Built as a portfolio/demo project, it showcases modern web development practices, cloud infrastructure management, and cost-effective deployment strategies.

The application consists of:
- **Frontend**: React single-page application with TypeScript
- **Backend**: Node.js/Express REST API
- **Database**: Self-hosted MySQL 8.0
- **Infrastructure**: Oracle Cloud Infrastructure (OCI) with Terraform IaC
- **Domain**: filmvault.me with free SSL/TLS (Let's Encrypt)

### Technical Highlights

The infrastructure was designed to demonstrate cloud cost optimization and architectural decision-making. By leveraging Oracle Cloud's Always Free tier and making strategic technology choices, the deployment achieves enterprise-grade functionality while minimizing costs—perfect for portfolio demonstrations.

**Key architectural decisions:**
- Self-hosted MySQL 8.0 instead of managed database services
- OCI Always Free tier compute instances (2x VM.Standard.E2.1.Micro)
- Infrastructure as Code with Terraform for reproducible deployments
- Automated provisioning via cloud-init
- Production-grade security with bastion host architecture and encrypted secrets management

## Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Database Design](#database-design)
4. [Authentication System](#authentication-system)
5. [Infrastructure Architecture](#infrastructure-architecture)
6. [Object Storage](#object-storage)
7. [Security Implementation](#security-implementation)

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
   public/           # Static assets
      images/       # Image assets
      index.html    # HTML template
   src/
      api/          # API client configuration
      components/   # Reusable UI components
      contexts/     # React contexts for state management
      pages/        # Route-specific page components
      App.tsx       # Application entry point
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
   src/
      config/       # Configuration files
      middleware/   # Express middleware
      routes/       # API route handlers
      services/     # Business logic services
      index.ts      # Application entry point
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

## Infrastructure Architecture

### Oracle Cloud Infrastructure (Always Free Tier)

FilmVault leverages OCI's Always Free tier for a cost-effective, production-ready deployment:

#### Compute Resources
- **Application Server**: VM.Standard.E2.1.Micro (1/8 OCPU, 1GB RAM, FREE)
  - Runs Node.js API, MySQL 8.0, Nginx, PM2
  - Public IP: Direct HTTP/HTTPS access
  - SSH: Restricted to admin IP (160.34.113.43/32)

- **Bastion Host**: VM.Standard.E2.1.Micro (1/8 OCPU, 1GB RAM, FREE)
  - Secure jump server for SSH access
  - Separate subnet (10.0.2.0/24) for isolation
  - SSH-only access from admin IP

#### Database
- **MySQL 8.0**: Self-hosted on application server
  - Database: myfavmovies
  - User: admin (auto-generated password in vault)
  - Accessible only via localhost (no network exposure)
  - Automatic initialization via cloud-init

#### Storage & Secrets
- **Object Storage**: Profile pictures bucket with Pre-Authenticated Requests
- **OCI Vault**: Encrypted secrets storage (~$1/month)
  - Database password (AES-256 encrypted)
  - JWT secret (AES-256 encrypted)
  - Accessible only by compute instances via IAM policies

#### Network Architecture
- **VCN**: 10.0.0.0/16
  - Application Subnet: 10.0.1.0/24
  - Bastion Subnet: 10.0.2.0/24
- **Internet Gateway**: Public internet access
- **Security Groups**:
  - SSH: Admin IP + Bastion subnet
  - HTTP/HTTPS: Public (0.0.0.0/0)
  - Application ports (3000-3001): Public (behind Nginx)

#### SSL/TLS Configuration
- **Domain**: filmvault.me
- **Certificate**: Let's Encrypt (FREE, auto-renewal)
- **Protocol**: HTTPS with automatic HTTP → HTTPS redirect
- **Setup**: Automated via certbot during cloud-init
- **Renewal**: Systemd timer (certbot-renew.timer)

### Terraform Infrastructure as Code

Complete infrastructure defined and managed with Terraform:

```
terraform/
   main.tf              # Provider config, VCN, networking
   compute.tf           # Application server (E2.Micro)
   bastion.tf           # Bastion host (E2.Micro)
   vault.tf             # OCI Vault and encrypted secrets
   object_storage.tf    # Profile pictures bucket
   server_nsg.tf        # Network security group rules
   iam_policy.tf        # IAM policies for vault/storage access
   monitoring.tf        # Basic OCI metrics (disabled for cost)
   waf.tf               # Nginx-based WAF rules
   terraform.tfvars     # Configuration values
   scripts/
      cloud-init-minimal.tpl  # Server provisioning script
```

#### Key Terraform Features
- **Auto-generated secrets**: Random passwords for DB and JWT
- **Cloud-init automation**: Complete server setup on boot
- **Idempotent deployments**: Safe to re-run terraform apply
- **Output values**: Server IPs, connection strings, SSH instructions

### Automated Provisioning (Cloud-Init)

The application server is fully configured via cloud-init on first boot:

1. **System Setup** (~5 min):
   - System package updates
   - Oracle Linux 10 base configuration

2. **Software Installation** (~3 min):
   - Node.js 18 (from NodeSource)
   - MySQL 8.0 server
   - Nginx web server
   - Certbot (Let's Encrypt client)
   - PM2 process manager

3. **MySQL Configuration** (~1 min):
   - Service initialization
   - Root password set (from vault)
   - Database creation (myfavmovies)
   - Application user creation with grants
   - Security hardening (remove anonymous users, remote root)

4. **Nginx Configuration** (~1 min):
   - Reverse proxy for API (/api/ → localhost:3000)
   - Static file serving for React (/ → localhost:3001)
   - Security headers (X-Frame-Options, CSP, etc.)

5. **SSL Setup** (~2 min, after DNS propagation):
   - Automated Let's Encrypt certificate request
   - Nginx SSL configuration
   - HTTP → HTTPS redirect
   - Auto-renewal setup (certbot-renew.timer)

6. **Firewall Configuration**:
   - HTTP (80), HTTPS (443), SSH (22) allowed
   - All other ports blocked
   - Firewalld active and enabled

7. **Application Setup**:
   - Directory structure creation
   - Environment file (.env) with DB credentials
   - PM2 ecosystem configuration
   - Placeholder HTML page

### Deployment Architecture

The application uses a multi-stage deployment process managed entirely through Terraform and cloud-init automation. Infrastructure provisioning creates all cloud resources, while cloud-init handles complete server configuration including MySQL installation, Nginx setup, SSL certificate automation, and PM2 process management.

The bastion host architecture provides secure SSH access, while the application server hosts the Node.js API, React frontend, and MySQL database all on a single Always Free compute instance.

### PM2 Process Management

Application runs under PM2 with two processes:

- **filmvault-api**: Node.js backend (port 3000)
  - 1 instance (optimized for 1GB RAM)
  - Auto-restart on failure
  - Max memory: 700MB

- **filmvault-client**: React static files via `serve` (port 3001)
  - 1 instance
  - Max memory: 200MB

PM2 configured to start on system boot via systemd.

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

## Security Implementation

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

- **Network Segmentation**: Separate subnets for bastion and application
- **SSH Hardening**:
  - Access restricted to admin IP (160.34.113.43/32)
  - Bastion host for additional layer
  - SSH keys only (no password authentication)
- **HTTPS Everywhere**:
  - Let's Encrypt SSL/TLS certificates
  - Automatic HTTP → HTTPS redirect
  - Security headers (HSTS, CSP, X-Frame-Options)
- **Database Isolation**:
  - MySQL accessible only via localhost
  - No network exposure
  - Auto-generated strong passwords stored in OCI Vault
- **Secrets Management**:
  - OCI Vault with AES-256 encryption
  - IAM policies restrict access to compute instances only
  - No secrets in code or Terraform state
- **Firewall Configuration**:
  - Only ports 22, 80, 443 exposed
  - Firewalld active with minimal rules
- **Nginx WAF**:
  - SQL injection blocking
  - XSS protection
  - Rate limiting (1000/min global, 300/min API, 5/min login)
  - Path traversal blocking

### Monitoring and Logging

- **Basic Metrics**: OCI native compute metrics (free)
- **Application Logs**: PM2 log management
  - `/var/log/filmvault/api-error.log`
  - `/var/log/filmvault/api-out.log`
  - `/var/log/filmvault/client-error.log`
  - `/var/log/filmvault/client-out.log`
- **System Logs**: `/var/log/cloud-init-filmvault.log`
- **Access Logs**: Nginx access/error logs

Application logs are managed by PM2, with OCI native compute metrics providing basic monitoring. Full OCI logging services are not enabled to maintain the Always Free tier optimization.

### Live Application

- **Website**: https://filmvault.me
- **API Health**: https://filmvault.me/api/health

### HTTPS Configuration (Completed)

FilmVault is now secured with HTTPS using a free SSL/TLS certificate from ZeroSSL:

**SSL Certificate Details**:
- Certificate Authority: ZeroSSL (via acme.sh)
- Domain: filmvault.me
- Certificate Location: /etc/nginx/ssl/filmvault.me.{crt,key}
- Automatic Renewal: Configured via acme.sh

**Security Features**:
- HTTP → HTTPS automatic redirect
- HTTP/2 enabled
- TLS 1.2 and TLS 1.3 support
- HSTS (Strict-Transport-Security) with 1-year max-age
- Security headers: X-Frame-Options, X-Content-Type-Options

**Network Configuration**:
- OCI Network Security Group: Port 443 allowed from 0.0.0.0/0
- Server Firewall (firewalld): HTTPS service enabled
- Nginx: Listening on ports 80 (HTTP redirect) and 443 (HTTPS)

---
