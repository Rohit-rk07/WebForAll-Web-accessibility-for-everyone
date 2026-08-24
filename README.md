# Accessibility Analyzer

Full-stack accessibility scanner with a React client and FastAPI server.

## Quick Start

1. Start MongoDB Atlas access and copy your connection string into `server/.env`.
2. In one terminal:

```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python setup_playwright.py
uvicorn main:app --reload
```

3. In a second terminal:

```bash
cd client
npm install
npm run dev
```

4. Open `http://localhost:5173`.

## Project Structure

- `client/` - React + Vite frontend
- `server/` - FastAPI backend with Playwright analysis

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- MongoDB Atlas account and database user
- Optional: Gemini API key for AI features

## 1. Server Setup

1. Open a terminal in the project root.
2. Go to the server folder:

```bash
cd server
```

3. Create a virtual environment:

```bash
python -m venv venv
```

4. Activate it on Windows:

```bash
venv\Scripts\activate
```

5. Install Python dependencies:

```bash
pip install -r requirements.txt
```

6. Install Playwright browsers:

```bash
python setup_playwright.py
```

7. Create or edit `server/.env` with your values:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xcfdaes.mongodb.net/accessibility-analyzer?retryWrites=true&w=majority
MONGODB_DB_NAME=accessibility-analyzer
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_long_random_secret
RESET_EMAIL_COOLDOWN_MINUTES=2
```

8. Start the backend:

```bash
uvicorn main:app --reload
```

9. Confirm the backend is running at:

```text
http://127.0.0.1:8000
```

## 2. Client Setup

1. Open a second terminal in the project root.
2. Go to the client folder:

```bash
cd client
```

3. Install frontend dependencies:

```bash
npm install
```

4. Create or edit `client/.env`:

```env
VITE_API_URL=http://localhost:8000
```

5. Start the frontend:

```bash
npm run dev
```

6. Open the app in your browser:

```text
http://localhost:5173
```

## 3. How To Use

1. Open the frontend in your browser.
2. Log in or use the demo login.
3. Enter a URL, upload an HTML file, or paste HTML code.
4. Click scan/analyze.
5. View results and export them if needed.

## 4. MongoDB Atlas URI

If you need to find or update your connection string:

1. Open MongoDB Atlas.
2. Go to your cluster.
3. Click `Connect`.
4. Choose `Drivers`.
5. Copy the `mongodb+srv://...` connection string.
6. Replace the username and password with your Atlas database user.
7. Paste it into `server/.env` as `MONGODB_URI`.

If your password has special characters like `@`, `#`, `/`, or `:`, URL-encode them first.

## 5. Common Issues

- If the backend fails on startup, check that `MONGODB_URI` is set correctly.
- If Playwright setup fails, rerun `python setup_playwright.py`.
- If the client cannot reach the server, make sure `VITE_API_URL` points to the backend.
- If AI features fail, verify `GEMINI_API_KEY`.

## 6. Notes

- `server/.env` and `client/.env` are ignored by git.
- The backend stores analysis history in MongoDB.
- The analysis step can take a while because it launches a browser and runs accessibility checks.
