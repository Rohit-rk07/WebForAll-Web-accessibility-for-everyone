# Accessibility Analyzer

A web application that analyzes HTML content for accessibility issues and provides recommendations for improvement.

## Running the Application

### Backend Setup

```
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```
cd client
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173`