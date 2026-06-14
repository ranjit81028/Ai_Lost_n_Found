# B. Execution Flow Guide

## Flow 1: User Opens the Website

```
Browser → http://localhost:3000
  ↓
frontend/public/index.html       → loads the React bundle
  ↓
frontend/src/index.js            → renders <App /> into #root
  ↓
frontend/src/App.js              → wraps in AuthProvider, renders Router + Navbar + Routes
  ↓
frontend/src/context/AuthContext.js → checks localStorage for token
  ↓ (if token found)
frontend/src/utils/api.js        → GET /api/auth/me (with token in header)
  ↓
backend/app.py                   → routes to auth blueprint
  ↓
backend/routes/auth.py           → @login_required verifies token
  ↓
backend/utils/auth_helpers.py    → decode_token() validates JWT
  ↓
MongoDB: users collection        → find_one({_id: user_id})
  ↓
Response → {id, name, email, role} → AuthContext sets user state
  ↓
frontend/src/pages/Home.js       → renders (matched route "/")
  ↓
frontend/src/utils/api.js        → GET /api/items?per_page=6
  ↓
backend/routes/items.py          → get_items() queries MongoDB
  ↓
MongoDB: items collection        → find({status: "active"}).sort().limit(6)
  ↓
Response → items array → Home renders ItemCards
```

---

## Flow 2: User Registers

```
User clicks "Register" in Navbar
  ↓
frontend/src/components/Navbar.js → <Link to="/register">
  ↓
React Router → renders Register page
  ↓
frontend/src/pages/Register.js   → displays registration form
  ↓
User fills form, clicks "Register"
  ↓
Register.js → handleSubmit()
  ↓
frontend/src/utils/api.js        → POST /api/auth/register
                                    body: {name, email, password}
  ↓
backend/routes/auth.py           → register()
  ↓
  1. Validate fields (name, email, password)
  2. Check if email exists in MongoDB
  3. backend/utils/auth_helpers.py → hash_password(password) using bcrypt
  4. backend/models/user.py → create_user() builds document
  5. MongoDB: users.insert_one()
  6. backend/utils/auth_helpers.py → create_token() generates JWT
  ↓
Response → {token, user: {id, name, email, role}}
  ↓
Register.js → calls login(token, user) from AuthContext
  ↓
AuthContext.js → stores token in localStorage, sets user state
  ↓
navigate('/dashboard') → redirects to Dashboard page
```

---

## Flow 3: User Logs In

```
User clicks "Login" → navigates to /login
  ↓
frontend/src/pages/Login.js      → displays login form
  ↓
User enters email + password, clicks "Login"
  ↓
Login.js → handleSubmit()
  ↓
frontend/src/utils/api.js        → POST /api/auth/login
                                    body: {email, password}
  ↓
backend/routes/auth.py           → login()
  ↓
  1. Find user by email: MongoDB users.find_one({email})
  2. backend/utils/auth_helpers.py → check_password() compares bcrypt hash
  3. create_token() generates JWT with user_id
  ↓
Response → {token, user}
  ↓
AuthContext → login(token, user) → localStorage + state update
  ↓
Navbar re-renders: shows user name, Report Item link, notification bell
```

---

## Flow 4: User Reports a Lost Item

```
User clicks "Report Item" in Navbar
  ↓
frontend/src/pages/ReportItem.js → renders form
  ↓
  1. useEffect → getCategories() → GET /api/items/categories
  2. backend/routes/items.py → get_categories() returns CATEGORIES list
  3. Dropdown populated with categories
  ↓
User fills form:
  - Selects "I Lost Something" (type = "lost")
  - Enters title, description
  - Selects category, enters location
  - Uploads image via file input
  ↓
handleImageChange() → FileReader shows preview
  ↓
User clicks "Report Item"
  ↓
handleSubmit() → creates FormData object with all fields + image file
  ↓
frontend/src/utils/api.js        → POST /api/items
                                    headers: multipart/form-data + Bearer token
  ↓
backend/routes/items.py          → create_new_item()
  ↓
  1. @login_required → validates JWT, attaches user to request
  2. Reads form fields from request.form
  3. Validates: all required fields present, valid type, valid category
  4. backend/utils/file_upload.py → save_uploaded_file()
     → validates extension, generates UUID filename, saves to uploads/
  5. backend/services/image_matcher.py → extract_features(image_path)
     → ResNet-18: opens image → transforms → extracts 512-dim vector
  6. backend/services/text_matcher.py → get_text_embedding(title, desc)
     → BERT: combines title+desc → encodes → 384-dim vector
  7. backend/models/item.py → create_item() builds full document
  8. MongoDB: items.insert_one()
  ↓
Response → {message, item_id}
  ↓
ReportItem.js → shows success message → navigates to /item/<item_id>
```

---

## Flow 5: User Finds AI Matches

```
User is on ItemDetail page (/item/:id) — they own this item
  ↓
frontend/src/pages/ItemDetail.js → shows "Find AI Matches" button
  ↓
User clicks "🤖 Find AI Matches"
  ↓
handleFindMatches()
  ↓
frontend/src/utils/api.js        → GET /api/match/<item_id>
                                    header: Bearer token
  ↓
backend/routes/matching.py       → get_matches(item_id)
  ↓
  1. @login_required → validates token
  2. MongoDB: items.find_one({_id: item_id}) → loads item with embeddings
  3. Verify requester is item owner
  4. backend/services/match_engine.py → find_matches(item, db, config)
  ↓
  MATCHING ALGORITHM:
  a. Determine search_type (opposite: lost→found, found→lost)
  b. Query: items.find({type: search_type, status: "active", category: same})
  c. For each candidate:
     - Skip if same user
     - image_matcher.compute_image_similarity(item.features, candidate.features)
     - text_matcher.compute_text_similarity(item.embedding, candidate.embedding)
     - combined = 0.4 * img_score + 0.6 * txt_score
     - If combined >= 0.5 threshold → add to matches
  d. Sort by score descending, take top 10
  e. _notify_matches() → creates notification documents in MongoDB
  ↓
Response → {item_id, matches: [{item_id, title, scores...}], total_matches}
  ↓
ItemDetail.js → renders MatchResult components for each match
  ↓
frontend/src/components/MatchResult.js → displays match card with:
  - Item info (title, description, category, location)
  - Combined score percentage (color-coded)
  - Individual image/text scores
  - "View Item" link
```

---

## Flow 6: User Receives Notification

```
backend/services/match_engine.py → _notify_matches()
  ↓
MongoDB: notifications.insert_one({
  user_id, message, item_id, match_id, read: false, created_at
})
  ↓
[30 seconds later — Navbar polling]
  ↓
frontend/src/components/Navbar.js → fetchUnreadCount() (runs every 30s)
  ↓
frontend/src/utils/api.js         → GET /api/notifications/unread-count
  ↓
backend/routes/notifications.py   → get_unread_count()
  ↓
MongoDB: notifications.count_documents({user_id, read: false})
  ↓
Response → {unread_count: 1}
  ↓
Navbar → shows red badge with "1" on bell icon
  ↓
User clicks bell icon → Navbar toggles Notification dropdown
  ↓
frontend/src/components/Notification.js → fetchNotifications()
  ↓
GET /api/notifications → lists all notifications sorted by date
  ↓
User clicks a notification → markNotificationRead(id)
  ↓
PUT /api/notifications/<id>/read → sets read: true
  ↓
User clicks "View →" → navigates to item detail page
```

---

## Flow 7: Admin Moderates Items

```
Admin user navigates to /admin
  ↓
frontend/src/pages/AdminPanel.js → checks user.role === 'admin'
  ↓
fetchData() → Promise.all([
  GET /api/admin/stats,       → backend/routes/admin.py → get_stats()
  GET /api/admin/users,       → get_all_users()
  GET /api/admin/items        → get_all_items()
])
  ↓
Each route has @admin_required → checks role in JWT user
  ↓
MongoDB aggregations:
  - users.count_documents({})
  - items.count_documents({type: "lost"}) etc.
  ↓
AdminPanel renders: stats cards + items table + users table
  ↓
Admin changes item status dropdown (e.g., "active" → "removed")
  ↓
handleStatusChange(itemId, "removed")
  ↓
PUT /api/admin/items/<id>/status → body: {status: "removed"}
  ↓
MongoDB: items.update_one({_id}, {$set: {status: "removed"}})
  ↓
UI updates item row with new status tag
```

---

## Flow 8: Search with Filters

```
User types in search bar on Home or Search page
  ↓
frontend/src/components/SearchBar.js → handleSubmit()
  ↓
If on Home: navigates to /search?search=phone&type=lost&category=Electronics
If on Search: calls onSearch(filters) prop
  ↓
frontend/src/pages/SearchResults.js → useEffect triggers fetchItems()
  ↓
frontend/src/utils/api.js → GET /api/items?search=phone&type=lost&category=Electronics&page=1&per_page=12
  ↓
backend/routes/items.py → get_items()
  ↓
Builds MongoDB query:
  {
    status: "active",
    type: "lost",
    category: "Electronics",
    $or: [
      {title: {$regex: "phone", $options: "i"}},
      {description: {$regex: "phone", $options: "i"}}
    ]
  }
  ↓
MongoDB: items.find(query).sort('created_at', -1).skip(0).limit(12)
  ↓
Response → {items: [...], total: 5, page: 1, pages: 1}
  ↓
SearchResults.js → renders ItemCards grid + pagination
```
