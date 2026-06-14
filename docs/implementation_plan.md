# AI-Powered Lost & Found Platform — Implementation Plan

## Overview

A campus Lost & Found web application where users can report lost or found items, and the system uses AI (ResNet for image similarity, BERT for text similarity) to automatically suggest potential matches. Built as a realistic college student project with React frontend, Flask backend, and MongoDB.

---

## Proposed Project Structure

```
d:\lost_found\
├── backend/
│   ├── app.py                    # Flask app entry point
│   ├── config.py                 # App configuration (DB URI, secret key, etc.)
│   ├── requirements.txt          # Python dependencies
│   ├── models/
│   │   ├── user.py               # User model (MongoDB schema)
│   │   ├── item.py               # Lost/Found item model
│   │   └── notification.py       # Notification model
│   ├── routes/
│   │   ├── auth.py               # Login, register, logout endpoints
│   │   ├── items.py              # CRUD for lost/found items
│   │   ├── matching.py           # AI matching endpoints
│   │   ├── admin.py              # Admin dashboard endpoints
│   │   └── notifications.py      # Notification endpoints
│   ├── services/
│   │   ├── image_matcher.py      # ResNet feature extraction + cosine similarity
│   │   ├── text_matcher.py       # BERT sentence embeddings + cosine similarity
│   │   └── match_engine.py       # Combined matching pipeline
│   ├── utils/
│   │   ├── auth_helpers.py       # JWT token helpers, password hashing
│   │   └── file_upload.py        # Image upload/validation helpers
│   └── uploads/                  # Uploaded images directory
│
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js              # React entry point
│       ├── index.css             # Global styles
│       ├── App.js                # Main app with routing
│       ├── components/
│       │   ├── Navbar.js         # Navigation bar
│       │   ├── Navbar.css
│       │   ├── ItemCard.js       # Card to display an item
│       │   ├── ItemCard.css
│       │   ├── SearchBar.js      # Search + filter component
│       │   ├── SearchBar.css
│       │   ├── MatchResult.js    # Display matched items
│       │   ├── MatchResult.css
│       │   ├── Notification.js   # Notification dropdown
│       │   └── Notification.css
│       ├── pages/
│       │   ├── Home.js           # Landing page
│       │   ├── Home.css
│       │   ├── Login.js          # Login page
│       │   ├── Login.css
│       │   ├── Register.js       # Registration page
│       │   ├── Register.css
│       │   ├── ReportItem.js     # Upload lost/found item form
│       │   ├── ReportItem.css
│       │   ├── ItemDetail.js     # Single item detail view
│       │   ├── ItemDetail.css
│       │   ├── Dashboard.js      # User dashboard (my items)
│       │   ├── Dashboard.css
│       │   ├── AdminPanel.js     # Admin dashboard
│       │   ├── AdminPanel.css
│       │   ├── SearchResults.js  # Search results page
│       │   └── SearchResults.css
│       ├── context/
│       │   └── AuthContext.js    # Auth state management (React Context)
│       └── utils/
│           └── api.js            # Axios instance + API helper functions
│
└── docs/                         # Documentation artifacts
```

---

## Proposed Changes

### Backend — Flask Application

#### [NEW] [config.py](file:///d:/lost_found/backend/config.py)
- MongoDB connection URI, JWT secret, upload folder path, allowed extensions
- Simple class-based config (no environment-based inheritance — student style)

#### [NEW] [app.py](file:///d:/lost_found/backend/app.py)
- Create Flask app, register blueprints, configure CORS
- Initialize PyMongo connection
- Serve uploaded files

#### [NEW] [requirements.txt](file:///d:/lost_found/backend/requirements.txt)
Key dependencies:
- `flask`, `flask-cors`, `flask-pymongo`
- `PyJWT` for authentication
- `bcrypt` for password hashing
- `torch`, `torchvision` for ResNet
- `transformers`, `sentence-transformers` for BERT
- `scikit-learn` for cosine similarity
- `Pillow` for image processing

---

#### [NEW] [models/user.py](file:///d:/lost_found/backend/models/user.py)
MongoDB collection: `users`
```
{
  _id, name, email, password (hashed), role ("user"|"admin"),
  created_at
}
```

#### [NEW] [models/item.py](file:///d:/lost_found/backend/models/item.py)
MongoDB collection: `items`
```
{
  _id, user_id, type ("lost"|"found"), title, description,
  category, location, date, image_path,
  image_features (list[float]), text_embedding (list[float]),
  status ("active"|"resolved"|"removed"), created_at
}
```

#### [NEW] [models/notification.py](file:///d:/lost_found/backend/models/notification.py)
MongoDB collection: `notifications`
```
{
  _id, user_id, message, item_id, match_id, read (bool),
  created_at
}
```

---

#### [NEW] [routes/auth.py](file:///d:/lost_found/backend/routes/auth.py)
- `POST /api/auth/register` — register new user
- `POST /api/auth/login` — login, return JWT
- `GET /api/auth/me` — get current user from token

#### [NEW] [routes/items.py](file:///d:/lost_found/backend/routes/items.py)
- `POST /api/items` — create new lost/found item (with image upload)
- `GET /api/items` — list items with filters (type, category, location, search query)
- `GET /api/items/<id>` — get single item
- `PUT /api/items/<id>` — update item
- `DELETE /api/items/<id>` — delete item
- `GET /api/items/my` — get current user's items

#### [NEW] [routes/matching.py](file:///d:/lost_found/backend/routes/matching.py)
- `GET /api/match/<item_id>` — find potential matches for an item
- Combines image + text similarity scores

#### [NEW] [routes/admin.py](file:///d:/lost_found/backend/routes/admin.py)
- `GET /api/admin/stats` — dashboard statistics
- `GET /api/admin/users` — list all users
- `GET /api/admin/items` — list all items (with admin controls)
- `PUT /api/admin/items/<id>/status` — change item status
- `DELETE /api/admin/users/<id>` — remove user

#### [NEW] [routes/notifications.py](file:///d:/lost_found/backend/routes/notifications.py)
- `GET /api/notifications` — get user's notifications
- `PUT /api/notifications/<id>/read` — mark as read
- `GET /api/notifications/unread-count` — get unread count

---

#### [NEW] [services/image_matcher.py](file:///d:/lost_found/backend/services/image_matcher.py)
- Load pre-trained ResNet-18 (remove final classification layer)
- Extract 512-dim feature vector from uploaded image
- Compute cosine similarity between two feature vectors

#### [NEW] [services/text_matcher.py](file:///d:/lost_found/backend/services/text_matcher.py)
- Load `all-MiniLM-L6-v2` sentence transformer model (lightweight BERT variant)
- Encode title + description into embedding
- Compute cosine similarity between two text embeddings

#### [NEW] [services/match_engine.py](file:///d:/lost_found/backend/services/match_engine.py)
- Combine image similarity (weight: 0.4) + text similarity (weight: 0.6)
- Match lost items against found items (and vice versa)
- Filter by category, threshold, return top-N matches
- Create notifications for high-confidence matches

---

#### [NEW] [utils/auth_helpers.py](file:///d:/lost_found/backend/utils/auth_helpers.py)
- `hash_password()`, `check_password()` using bcrypt
- `create_token()`, `decode_token()` using PyJWT
- `login_required` decorator
- `admin_required` decorator

#### [NEW] [utils/file_upload.py](file:///d:/lost_found/backend/utils/file_upload.py)
- Validate file type (jpg, png, jpeg)
- Generate unique filename
- Save to uploads directory

---

### Frontend — React Application

> **Note:** Will be created using `npx create-react-app`. No TypeScript, no Tailwind — plain CSS as a student would do.

#### [NEW] [src/App.js](file:///d:/lost_found/frontend/src/App.js)
- React Router setup with all page routes
- Wrap app in `AuthProvider`
- Protected routes for logged-in users and admin

#### [NEW] [src/context/AuthContext.js](file:///d:/lost_found/frontend/src/context/AuthContext.js)
- React Context for auth state (user, token)
- Login/logout/register functions
- Persist token in localStorage

#### [NEW] [src/utils/api.js](file:///d:/lost_found/frontend/src/utils/api.js)
- Axios instance with base URL (`http://localhost:5000/api`)
- Request interceptor to attach JWT token
- Named exports for each API call (e.g. `loginUser`, `getItems`, `reportItem`)

---

#### Pages (10 files)
- **Home.js** — Hero section, recent items, how-it-works
- **Login.js** — Email + password login form
- **Register.js** — Registration form with name, email, password
- **ReportItem.js** — Form to report lost/found item with image upload
- **ItemDetail.js** — Shows item details + match results
- **Dashboard.js** — User's reported items + notifications
- **AdminPanel.js** — Admin stats, user management, item moderation
- **SearchResults.js** — Filtered item listing

#### Components (5 files)
- **Navbar.js** — Logo, nav links, login/register or user menu, notification bell
- **ItemCard.js** — Card showing item thumbnail, title, category, location, date
- **SearchBar.js** — Text input + category/location dropdowns
- **MatchResult.js** — Card showing match score and matched item info
- **Notification.js** — Dropdown list of notifications with read/unread

---

### Documentation Artifacts

After building the project, I will create these as markdown artifacts in the conversation:

| Document | Content |
|---|---|
| **A. Folder Structure Guide** | Purpose, interactions, key functions for every file |
| **B. Execution Flow** | Step-by-step file-by-file request traces |
| **C. Viva Preparation Guide** | Questions + answers per file |
| **D. Debugging Guide** | Common errors per feature + fixes |
| **E. Architecture Explanation** | Data flow diagrams, schemas, endpoints |
| **F. Presentation Guide** | 5-minute talk script |
| **G. Cheat Sheet** | Quick-reference summary |

---

## User Review Required

> [!IMPORTANT]
> **AI Model Loading**: ResNet-18 and the sentence-transformers model need to be downloaded on first run (~100MB for ResNet, ~90MB for MiniLM). The backend will download them automatically via PyTorch/HuggingFace. Is this acceptable, or would you prefer I add instructions for offline model download?

> [!IMPORTANT]
> **MongoDB Setup**: The project assumes MongoDB is running locally on `localhost:27017`. I'll include setup instructions. Do you have MongoDB installed already?

> [!WARNING]
> **Dependencies Size**: `torch` and `transformers` are large packages (~2GB total). The `sentence-transformers` library is more lightweight but still requires PyTorch. This is typical for ML student projects but worth noting.

## Open Questions

1. **Category list**: Should I use a fixed set of categories (Electronics, Documents, Clothing, Accessories, Keys, Books, Other) or let users enter custom categories?

2. **Email notifications**: Should the notification system be in-app only, or do you also want email notifications via SMTP? (In-app only is simpler and more realistic for a student project.)

3. **Deployment**: Should I include Docker/deployment configs, or keep it as a local-development-only project?

---

## Verification Plan

### Automated Tests
- Backend: Test each API endpoint manually using the provided test script
- Frontend: Visual verification in browser

### Manual Verification
1. Start MongoDB, Flask backend, and React dev server
2. Register a user, log in
3. Upload a lost item with image and description
4. Upload a found item with similar image/description
5. Trigger matching and verify results appear
6. Check admin dashboard with admin account
7. Verify notifications appear for matches
