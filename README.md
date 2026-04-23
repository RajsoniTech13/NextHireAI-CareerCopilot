# NextHireAI - Career Copilot

## Overview

NextHireAI is a career assistant platform that connects job seekers with the right positions using AI-powered resume matching and application support. The repository includes a full-stack application with a Python AI module, Node.js backend, and React frontend.

## Repository Structure

- `ai-module/`: Python-based AI models, data processing, and prediction APIs.
- `backend/`: Express server, database models, authentication, and AI integration routes.
- `frontend/`: React application for user interface and workflow.

## Key Features

- Resume upload and profile management
- Job matching using AI and resume data
- Application tracking and dashboard views
- Authenticated user experience
- AI inference via backend Python bridge

## Setup

### Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL=<your_database_url>
   JWT_SECRET=<your_secret>
   ```
4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend app:
   ```bash
   npm start
   ```

### AI Module

1. Navigate to the AI module folder:
   ```bash
   cd ai-module
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Optional: run data preparation and training scripts from `ai-module/scripts/`.

## Recommended First Push

- Add all code files
- Include `.gitignore`
- Keep secrets out of Git using `.env`

## Notes

- Make sure `backend/.env` and `frontend/.env` are never committed.
- If you use a virtual environment for Python, keep it outside the repository or ignore it in `.gitignore`.

## License

This project is ready for first-push setup. Add your license details here if desired.
