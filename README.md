# AI-Powered Lost & Found Platform

A campus Lost & Found web application where users can report lost or found items,
and the system uses AI (ResNet for images, BERT for text) to automatically suggest
potential matches.

## Tech Stack

- **Frontend**: React
- **Backend**: Flask (Python)
- **Database**: MongoDB
- **AI/ML**: ResNet-18 (image matching), Sentence-BERT (text matching)

## Project Structure

```
lost_found/
├── backend/          # Flask API server
│   ├── app.py        # Entry point
│   ├── config.py     # Configuration
│   ├── models/       # MongoDB document schemas
│   ├── routes/       # API endpoints
│   ├── services/     # AI matching logic
│   └── utils/        # Helpers (auth, file upload)
│
└── frontend/         # React app
    └── src/
        ├── components/  # Reusable UI components
        ├── pages/       # Page components
        ├── context/     # React Context (auth state)
        └── utils/       # API helper functions
```

## Setup & Run

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB running on localhost:27017

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Create Admin User
Register a normal user, then run in MongoDB shell:
```
use lost_and_found
db.users.updateOne({email: "your@email.com"}, {$set: {role: "admin"}})
```

## Features
- User registration & login (JWT auth)
- Report lost/found items with image upload
- AI-powered matching (ResNet + BERT)
- Search with filters (type, category, location)
- Notification system
- Admin dashboard (stats, user management, item moderation)
