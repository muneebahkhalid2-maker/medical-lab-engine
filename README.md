# MedExtract SaaS

A complete Medical Laboratory Report Data Extraction and Verification SaaS platform built with the MERN stack and Python AI integration.

## Architecture

- **Frontend**: React, Vite, Tailwind CSS
- **Backend API**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Module A (Extraction)**: Decoupled Python microservice (MockProvider supported).
- **Module B (Analysis)**: Node.js deterministic numerical comparison engine.

## Environment Variables

Create a `.env` file in the root:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medextract
JWT_SECRET=supersecret123
CLIENT_URL=http://localhost:5173

AI_SERVICE_URL=http://127.0.0.1:8000
MOCK_AI=true
MOCK_OCR=true
```

## Running the Application

1. Ensure MongoDB is running locally.
2. Install dependencies:
   ```bash
   npm install --prefix frontend
   npm install --prefix backend
   ```
3. Seed the database:
   ```bash
   npx ts-node backend/src/scripts/seed.ts
   ```
4. Start the stack (concurrently starts frontend and backend):
   ```bash
   npm run dev
   ```

## Test Accounts

All accounts use password: `password123`
- `admin@example.com`
- `doctor@example.com`
- `nurse@example.com`
- `staff@example.com`

## Module A -> Module B Contract

Module A (Extraction) yields strict verified JSON containing fields, values, confidence, and source metadata. Module B (Analysis) strictly consumes this structured output and deterministically determines `LOW`, `NORMAL`, or `HIGH` without involving an LLM in the numerical comparison logic.
