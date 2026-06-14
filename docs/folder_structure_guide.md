# A. Complete Folder Structure Guide

## Project Root

```
d:\lost_found\
├── .gitignore
├── README.md
├── backend/
└── frontend/
```

---

## Backend — `backend/`

### [config.py](file:///d:/lost_found/backend/config.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Centralizes all configuration (DB URI, secrets, thresholds) so they're not scattered across files |
| **What it does** | Defines a `Config` class with attributes for MongoDB URI, JWT secret, upload settings, and AI matching weights |
| **Interactions** | Imported by `app.py` to configure the Flask app. Routes and services read values via `current_app.config` |
| **Key attributes** | `MONGO_URI`, `SECRET_KEY`, `UPLOAD_FOLDER`, `IMAGE_WEIGHT`, `TEXT_WEIGHT`, `MATCH_THRESHOLD` |
| **DB collections** | None directly |

---

### [app.py](file:///d:/lost_found/backend/app.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Entry point — creates and wires together the entire Flask application |
| **What it does** | Creates Flask app using factory pattern, registers all 5 blueprints, initializes MongoDB, enables CORS, serves uploaded images |
| **Interactions** | Imports all route blueprints. Flask-PyMongo makes `mongo` available via `current_app.extensions['pymongo']` |
| **Key functions** | `create_app()` — app factory; `uploaded_file()` — serves images from `/uploads/<filename>` |
| **APIs** | `GET /api/health` — health check; `GET /uploads/<filename>` — serve uploaded images |
| **DB collections** | None directly (handled by routes) |

---

### [requirements.txt](file:///d:/lost_found/backend/requirements.txt)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Lists all Python dependencies for reproducible installs |
| **Key packages** | `flask`, `flask-cors`, `flask-pymongo` (web), `PyJWT`, `bcrypt` (auth), `torch`, `torchvision` (ResNet), `sentence-transformers` (BERT), `scikit-learn` (similarity) |

---

## Models — `backend/models/`

### [user.py](file:///d:/lost_found/backend/models/user.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Defines the structure of user documents stored in MongoDB |
| **What it does** | `create_user()` returns a dict with name, email, hashed password, role, created_at |
| **Interactions** | Used by `routes/auth.py` during registration |
| **DB collection** | `users` — fields: `_id`, `name`, `email`, `password`, `role`, `created_at` |

### [item.py](file:///d:/lost_found/backend/models/item.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Defines lost/found item document structure + the fixed `CATEGORIES` list |
| **What it does** | `create_item()` returns a dict with all item fields including AI feature vectors |
| **Interactions** | Used by `routes/items.py` when creating items. `CATEGORIES` used for validation and by the frontend |
| **DB collection** | `items` — fields: `_id`, `user_id`, `type`, `title`, `description`, `category`, `location`, `date_reported`, `image_path`, `image_features`, `text_embedding`, `status`, `created_at` |

### [notification.py](file:///d:/lost_found/backend/models/notification.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Defines notification document structure |
| **What it does** | `create_notification()` returns a dict with message, item references, read status |
| **Interactions** | Used by `services/match_engine.py` to create notifications when matches are found |
| **DB collection** | `notifications` — fields: `_id`, `user_id`, `message`, `item_id`, `match_id`, `read`, `created_at` |

---

## Utils — `backend/utils/`

### [auth_helpers.py](file:///d:/lost_found/backend/utils/auth_helpers.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Centralizes all authentication logic (hashing, tokens, decorators) |
| **What it does** | Provides password hashing (bcrypt), JWT token create/decode, and two decorators |
| **Interactions** | `login_required` and `admin_required` decorators are used on protected routes throughout all route files |
| **Key functions** | `hash_password()`, `check_password()`, `create_token()`, `decode_token()`, `login_required` decorator, `admin_required` decorator |
| **DB collection** | `users` (read in `login_required` to verify user exists) |

### [file_upload.py](file:///d:/lost_found/backend/utils/file_upload.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Handles secure file upload with validation |
| **What it does** | Checks allowed extensions, generates UUID-based filenames, saves to uploads/ |
| **Interactions** | Used by `routes/items.py` when processing image uploads |
| **Key functions** | `allowed_file()`, `save_uploaded_file()` |

---

## Services — `backend/services/`

### [image_matcher.py](file:///d:/lost_found/backend/services/image_matcher.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Implements image feature extraction using ResNet-18 |
| **What it does** | Loads pre-trained ResNet-18 (minus classification head), extracts 512-dim feature vectors, computes cosine similarity |
| **Interactions** | `extract_features()` called by `routes/items.py` during item creation. `compute_image_similarity()` called by `services/match_engine.py` |
| **Key functions** | `extract_features(image_path)` → list[float], `compute_image_similarity(features1, features2)` → float |

### [text_matcher.py](file:///d:/lost_found/backend/services/text_matcher.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Implements text embedding using sentence-transformers (BERT-based) |
| **What it does** | Loads `all-MiniLM-L6-v2` model, encodes title+description into 384-dim vectors, computes cosine similarity |
| **Interactions** | `get_text_embedding()` called by `routes/items.py` during item creation. `compute_text_similarity()` called by `services/match_engine.py` |
| **Key functions** | `get_text_embedding(title, description)` → list[float], `compute_text_similarity(embedding1, embedding2)` → float |

### [match_engine.py](file:///d:/lost_found/backend/services/match_engine.py)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Combines image + text similarity into a unified matching pipeline |
| **What it does** | Queries opposite-type items, computes weighted similarity (40% image + 60% text), filters by threshold, creates notifications |
| **Interactions** | Called by `routes/matching.py`. Uses `image_matcher` and `text_matcher` services. Writes to `notifications` collection |
| **Key functions** | `find_matches(item, db, config)` → list[dict], `_notify_matches(item, matches, db)` |
| **DB collections** | `items` (read candidates), `notifications` (write matches) |

---

## Routes — `backend/routes/`

### [auth.py](file:///d:/lost_found/backend/routes/auth.py)

| API | Method | Auth | Description |
|-----|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user, return JWT |
| `/api/auth/login` | POST | No | Login, return JWT |
| `/api/auth/me` | GET | Yes | Get current user info |

**DB collections**: `users` (read/write)

### [items.py](file:///d:/lost_found/backend/routes/items.py)

| API | Method | Auth | Description |
|-----|--------|------|-------------|
| `/api/items` | POST | Yes | Create lost/found item (multipart form) |
| `/api/items` | GET | No | List items with filters & pagination |
| `/api/items/<id>` | GET | No | Get single item |
| `/api/items/my` | GET | Yes | Get current user's items |
| `/api/items/<id>` | PUT | Yes | Update item (owner only) |
| `/api/items/<id>` | DELETE | Yes | Delete item (owner only) |
| `/api/items/categories` | GET | No | Get available categories |

**DB collections**: `items` (CRUD), `users` (read for user_name)

### [matching.py](file:///d:/lost_found/backend/routes/matching.py)

| API | Method | Auth | Description |
|-----|--------|------|-------------|
| `/api/match/<item_id>` | GET | Yes | Find AI matches for an item (owner only) |

**DB collections**: `items` (read), `notifications` (write via match_engine)

### [admin.py](file:///d:/lost_found/backend/routes/admin.py)

| API | Method | Auth | Description |
|-----|--------|------|-------------|
| `/api/admin/stats` | GET | Admin | Dashboard statistics |
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/items` | GET | Admin | List all items |
| `/api/admin/items/<id>/status` | PUT | Admin | Change item status |
| `/api/admin/users/<id>` | DELETE | Admin | Delete user |

**DB collections**: `users`, `items`

### [notifications.py](file:///d:/lost_found/backend/routes/notifications.py)

| API | Method | Auth | Description |
|-----|--------|------|-------------|
| `/api/notifications` | GET | Yes | Get user's notifications |
| `/api/notifications/<id>/read` | PUT | Yes | Mark as read |
| `/api/notifications/unread-count` | GET | Yes | Get unread count |

**DB collections**: `notifications`

---

## Frontend — `frontend/src/`

### [index.js](file:///d:/lost_found/frontend/src/index.js)

| Detail | Description |
|--------|-------------|
| **Why it exists** | React entry point — renders the App component into the DOM |
| **Interactions** | Renders `<App />` into the `#root` element in `public/index.html` |

### [index.css](file:///d:/lost_found/frontend/src/index.css)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Global CSS reset and dark theme base styles |
| **What it does** | Sets dark background, default font, custom scrollbar, box-sizing reset |

### [App.js](file:///d:/lost_found/frontend/src/App.js)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Root component — sets up routing and auth provider |
| **What it does** | Wraps app in `AuthProvider`, renders `Navbar` and `Routes` with 8 page routes |
| **Interactions** | Imports all page components and the AuthContext provider |

### [context/AuthContext.js](file:///d:/lost_found/frontend/src/context/AuthContext.js)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Global auth state management using React Context |
| **What it does** | Provides `user`, `login()`, `logout()`, `loading` to all components. Checks localStorage token on mount |
| **Interactions** | Consumed by Navbar, pages via `useAuth()` hook. Calls `GET /api/auth/me` on load |

### [utils/api.js](file:///d:/lost_found/frontend/src/utils/api.js)

| Detail | Description |
|--------|-------------|
| **Why it exists** | Centralized API layer — all backend calls go through here |
| **What it does** | Creates axios instance with base URL, JWT interceptor, and named export functions for every API endpoint |
| **Interactions** | Every page and component imports specific functions from here |

---

### Components — `frontend/src/components/`

| Component | Purpose | Used By |
|-----------|---------|---------|
| [Navbar.js](file:///d:/lost_found/frontend/src/components/Navbar.js) | Navigation bar with auth-aware links, notification bell, mobile menu | App.js (always visible) |
| [ItemCard.js](file:///d:/lost_found/frontend/src/components/ItemCard.js) | Card displaying item thumbnail, type badge, meta info | Home.js, SearchResults.js |
| [SearchBar.js](file:///d:/lost_found/frontend/src/components/SearchBar.js) | Search input + type/category dropdowns | Home.js, SearchResults.js |
| [MatchResult.js](file:///d:/lost_found/frontend/src/components/MatchResult.js) | Match card with similarity scores (image/text/combined) | ItemDetail.js |
| [Notification.js](file:///d:/lost_found/frontend/src/components/Notification.js) | Dropdown list of notifications with read/unread state | Navbar.js |

---

### Pages — `frontend/src/pages/`

| Page | Route | Auth Required | APIs Called |
|------|-------|---------------|------------|
| [Home.js](file:///d:/lost_found/frontend/src/pages/Home.js) | `/` | No | `getItems` |
| [Login.js](file:///d:/lost_found/frontend/src/pages/Login.js) | `/login` | No | `loginUser` |
| [Register.js](file:///d:/lost_found/frontend/src/pages/Register.js) | `/register` | No | `registerUser` |
| [ReportItem.js](file:///d:/lost_found/frontend/src/pages/ReportItem.js) | `/report` | Yes | `reportItem`, `getCategories` |
| [ItemDetail.js](file:///d:/lost_found/frontend/src/pages/ItemDetail.js) | `/item/:id` | No (matches: Yes) | `getItem`, `findMatches` |
| [Dashboard.js](file:///d:/lost_found/frontend/src/pages/Dashboard.js) | `/dashboard` | Yes | `getMyItems`, `deleteItem` |
| [AdminPanel.js](file:///d:/lost_found/frontend/src/pages/AdminPanel.js) | `/admin` | Admin | `getAdminStats`, `getAdminUsers`, `getAdminItems`, `updateItemStatus`, `deleteUser` |
| [SearchResults.js](file:///d:/lost_found/frontend/src/pages/SearchResults.js) | `/search` | No | `getItems` |
