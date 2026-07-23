# Learn Program

A full-stack MERN-style learning platform for browsing programming languages, units, and code examples. The project includes:

- React + Vite + TypeScript frontend
- Express + Node.js backend
- MongoDB-ready storage with JSON fallback
- JWT-based authentication
- Password hashing with bcryptjs
- Input validation with express-validator
- Code execution for selected languages

## Project Structure

```text
backend/
  config/
  controllers/
  middleware/
  routes/
  services/
  server.js

frontend/
  src/
  package.json
  tsconfig.json
```

## Tech Stack

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Monaco Editor
- XTerm

### Backend
- Node.js
- Express
- MongoDB driver
- JWT
- bcryptjs
- express-validator
- Multer

## Prerequisites

- Node.js 20+
- npm
- MongoDB running locally or a MongoDB connection string

## Setup

### 1. Clone and install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Environment variables

Create a `.env` file in the `backend` folder:

```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin123@yopmail.com
ADMIN_PASSWORD=Admin@123
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=study_program
MONGODB_COLLECTION=languages
MONGODB_USERS_COLLECTION=users
MONGODB_PROGRAMS_COLLECTION=programs
MONGODB_UNITS_COLLECTION=units
```

## Run the Project

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

## Production Build

```bash
cd frontend
npm run build
```

## Notes

- If `MONGODB_URI` is not configured, the backend falls back to JSON file storage.
- The admin credentials are seeded automatically.
- Frontend uses the Vite environment variable `VITE_API_BASE_URL` if you want to point to a remote backend.

## Optional Improvements

To make the project more competitive for remote MERN work, you can next add:

- Jest/Vitest test coverage
- Docker setup
- CI/CD pipeline
- Deployment to Vercel/Railway/Render/Netlify
- Error logging and request monitoring
