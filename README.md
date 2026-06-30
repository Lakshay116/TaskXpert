# TaskXpert

TaskXpert is a modern, full-stack operations and collaboration platform designed to unify team workflows. It provides a real-time environment for support ticketing, project management, task tracking, and seamless team collaboration.

## Features

* **Advanced Authentication:** Secure JWT-based authentication with automated token refreshing and Google OAuth integration.
* **Real-time Collaboration:** Live ticket chat, instant notifications, and real-time updates powered by Socket.IO.
* **Project & Task Management:** Organize work effortlessly using dynamic Kanban boards with smooth drag-and-drop workflows (Todo, In Progress, In Review, Done).
* **Support Ticketing:** End-to-end ticketing system for internal and external support, including priority levels and file attachments.
* **Cloud Infrastructure:** Integrated with PostgreSQL for robust data management and Cloudinary for seamless media/attachment hosting.
* **Mobile-First Design:** Fully responsive, premium UI built with React and Tailwind CSS, featuring glassmorphism and modern dark-mode aesthetics.
* **Role-Based Access Control (RBAC):** Distinct interfaces and capabilities for Admins versus standard users.

## Technology Stack

**Frontend:**
* React (Vite)
* Tailwind CSS
* Zustand (State Management)
* Recharts (Analytics)
* Framer Motion (Animations)
* Socket.IO Client

**Backend:**
* Node.js / Express.js
* PostgreSQL
* Socket.IO
* JSON Web Tokens (JWT)
* Cloudinary
* Nodemailer

## Prerequisites

Before running the application, ensure you have the following installed:
* Node.js (v18 or higher)
* PostgreSQL
* Cloudinary Account
* Google Cloud Console Account (for OAuth credentials)

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Lakshay116/TaskXpert.git
cd TaskXpert
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory and add the following variables:
```env
PORT=5000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NODE_ENV=development
```

*(Note: The frontend dynamically uses the backend URL via Vite environment variables or defaults to `localhost:5000`)*

### 4. Running Locally

**Start the Backend (Development Mode):**
```bash
cd backend
npm run dev
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

## Production Deployment (Docker)

TaskXpert is configured for a robust multi-stage Docker deployment, which automatically builds the React frontend and serves it via the Express backend in a single container.

To build and run the production container:

```bash
# Build the Docker image
docker build -t taskxpert-app .

# Run the container
docker run -p 5000:5000 --env-file ./backend/.env taskxpert-app
```
