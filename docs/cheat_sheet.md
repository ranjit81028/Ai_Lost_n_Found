# G. Cheat Sheet — Quick Reference

## Folder Structure (Key Files)

```
backend/
  app.py              → Flask entry point, blueprint registration
  config.py           → All config: DB URI, JWT secret, thresholds
  models/user.py      → User document factory (users collection)
  models/item.py      → Item document factory + CATEGORIES (items collection)
  models/notification.py → Notification factory (notifications collection)
  routes/auth.py      → /api/auth/* — register, login, me
  routes/items.py     → /api/items/* — CRUD, search, categories
  routes/matching.py  → /api/match/<id> — AI matching
  routes/admin.py     → /api/admin/* — stats, user/item management
  routes/notifications.py → /api/notifications/* — list, read, count
  services/image_matcher.py → ResNet-18 feature extraction
  services/text_matcher.py  → BERT text embedding
  services/match_engine.py  → Combined matching pipeline
  utils/auth_helpers.py → JWT + bcrypt + decorators
  utils/file_upload.py  → Image upload validation

frontend/src/
  App.js              → Router + AuthProvider wrapper
  context/AuthContext.js → Global auth state (user, login, logout)
  utils/api.js        → Axios instance + all API functions
  components/         → Navbar, ItemCard, SearchBar, MatchResult, Notification
  pages/              → Home, Login, Register, ReportItem, ItemDetail,
                        Dashboard, AdminPanel, SearchResults
```

---

## API Endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/register` | POST | No | Register user |
| `/api/auth/login` | POST | No | Login, get JWT |
| `/api/auth/me` | GET | JWT | Current user info |
| `/api/items` | POST | JWT | Create item (FormData) |
| `/api/items` | GET | No | List items + filters |
| `/api/items/<id>` | GET | No | Single item |
| `/api/items/my` | GET | JWT | My items |
| `/api/items/<id>` | PUT | JWT | Update item |
| `/api/items/<id>` | DELETE | JWT | Delete item |
| `/api/items/categories` | GET | No | Category list |
| `/api/match/<id>` | GET | JWT | Find matches |
| `/api/admin/stats` | GET | Admin | Dashboard stats |
| `/api/admin/users` | GET | Admin | All users |
| `/api/admin/items` | GET | Admin | All items |
| `/api/admin/items/<id>/status` | PUT | Admin | Change status |
| `/api/admin/users/<id>` | DELETE | Admin | Delete user |
| `/api/notifications` | GET | JWT | My notifications |
| `/api/notifications/<id>/read` | PUT | JWT | Mark as read |
| `/api/notifications/unread-count` | GET | JWT | Unread count |

---

## Database Collections

| Collection | Key Fields |
|------------|-----------|
| **users** | `_id, name, email, password(bcrypt), role, created_at` |
| **items** | `_id, user_id, type, title, description, category, location, image_path, image_features[512], text_embedding[384], status, created_at` |
| **notifications** | `_id, user_id, message, item_id, match_id, read, created_at` |

**Item statuses**: `active`, `resolved`, `removed`
**User roles**: `user`, `admin`
**Item types**: `lost`, `found`
**Categories**: Electronics, Documents, Clothing, Accessories, Keys, Books, Bags, Other

---

## Authentication Flow

```
Register/Login → Server returns JWT token
    ↓
Token stored in localStorage
    ↓
Axios interceptor adds: Authorization: Bearer <token>
    ↓
Backend @login_required reads token → decode → find user in DB
    ↓
@admin_required additionally checks role == "admin"
```

**Password**: plaintext → bcrypt.hashpw (with salt) → stored in MongoDB
**Token**: user_id + expiry (24h) → jwt.encode with SECRET_KEY → sent to client

---

## AI Matching Algorithm

```
Input: Item (with image_features + text_embedding)
Search: Opposite type, same category, different user, active status

For each candidate:
  img_score = cosine_similarity(item.image_features, candidate.image_features)
  txt_score = cosine_similarity(item.text_embedding, candidate.text_embedding)
  combined = 0.4 × img_score + 0.6 × txt_score

Filter: combined >= 0.5
Sort: by combined score descending
Return: top 10 matches
Notify: item owner + top 3 match owners
```

| Model | Type | Output | Size |
|-------|------|--------|------|
| ResNet-18 | CNN (image) | 512-dim float vector | ~45MB |
| all-MiniLM-L6-v2 | Transformer (text) | 384-dim float vector | ~90MB |

---

## Key Commands

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py                    # Starts on localhost:5000

# Frontend
cd frontend
npm install
npm start                        # Starts on localhost:3000

# MongoDB
mongosh
use lost_and_found
db.users.find().pretty()
db.items.find().pretty()
db.users.updateOne({email: "..."}, {$set: {role: "admin"}})
db.dropDatabase()                # Reset everything

# Git
git add .
git commit -m "message"
git push origin main
```

---

## Status Codes Used

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST (register, create item) |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not owner / not admin |
| 404 | Not Found | Item/user doesn't exist |
| 500 | Server Error | Unexpected errors |

---

## Quick Architecture Summary

```
React (3000) ←→ Flask (5000) ←→ MongoDB (27017)
                    ↕
              AI Models (PyTorch)
              ResNet-18 + MiniLM
```

**Frontend → Backend**: Axios HTTP calls with JWT
**Backend → DB**: Flask-PyMongo (pymongo wrapper)
**Backend → AI**: Direct Python imports (torch, sentence_transformers)
**Images**: Saved to `backend/uploads/`, served at `/uploads/<filename>`
