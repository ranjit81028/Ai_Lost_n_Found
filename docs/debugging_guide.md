# D. Debugging Guide

## 1. Setup & Environment Issues

### Error: `ModuleNotFoundError: No module named 'flask'`
- **Cause**: Virtual environment not activated or dependencies not installed
- **Identify**: Error appears when running `python app.py`
- **Fix**:
  ```bash
  cd backend
  python -m venv venv
  venv\Scripts\activate   # Windows
  pip install -r requirements.txt
  ```

### Error: `pymongo.errors.ServerSelectionTimeoutError`
- **Cause**: MongoDB is not running
- **Identify**: Backend starts but crashes on first DB operation
- **Fix**: Start MongoDB service
  ```bash
  # Windows
  net start MongoDB
  # Or start mongod manually
  mongod --dbpath "C:\data\db"
  ```

### Error: `CORS error` in browser console
- **Cause**: Backend CORS not configured, or backend not running
- **Identify**: Browser console shows "Access-Control-Allow-Origin" error
- **Fix**:
  1. Make sure backend is running on port 5000
  2. Check `app.py` has `CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})`
  3. Restart Flask server

### Error: `torch` installation fails
- **Cause**: PyTorch is large and may fail on slow connections
- **Identify**: pip install hangs or shows timeout
- **Fix**: Install PyTorch separately first:
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  ```

---

## 2. Authentication Issues

### Error: `401 Unauthorized` on every request
- **Cause**: Token not being sent, or token expired
- **Identify**: Check browser DevTools → Network tab → Request headers
- **Fix**:
  1. Check localStorage has `token` key (DevTools → Application → Local Storage)
  2. Check `api.js` interceptor is adding `Authorization: Bearer <token>`
  3. If token expired (24h), log out and log in again

### Error: `Invalid email or password` even with correct credentials
- **Cause**: Password comparison failing
- **Identify**: User exists in DB but login fails
- **Fix**:
  1. Check MongoDB: `db.users.findOne({email: "user@email.com"})` — verify user exists
  2. Make sure password field is stored as binary (bcrypt hash), not plaintext
  3. If corrupt, delete user and re-register

### Error: Register returns `Email already registered`
- **Cause**: Email exists in DB
- **Identify**: Error message on registration form
- **Fix**: Use different email, or delete existing user from MongoDB:
  ```
  db.users.deleteOne({email: "user@email.com"})
  ```

---

## 3. Item Upload Issues

### Error: `All fields are required` even though form is filled
- **Cause**: FormData not sending fields correctly
- **Identify**: Backend receives empty `request.form`
- **Fix**:
  1. Check that `Content-Type` is `multipart/form-data` (Axios does this automatically with FormData)
  2. Make sure `api.js` `reportItem()` function passes FormData object directly
  3. Check field names match: `request.form.get('title')` expects `data.append('title', ...)`

### Error: Image not saving / `None` image_path
- **Cause**: File not in `request.files` or invalid extension
- **Identify**: Item created but no image path in MongoDB
- **Fix**:
  1. Check file input has `name="image"` and backend checks `request.files['image']`
  2. Check file extension is jpg/jpeg/png
  3. Check `UPLOAD_FOLDER` directory exists and has write permissions
  4. Check file size is under 5MB (`MAX_CONTENT_LENGTH`)

### Error: `Error extracting image features`
- **Cause**: Image file corrupt or unsupported format
- **Identify**: Item saves but `image_features` is null
- **Fix**:
  1. Try with a known-good JPEG image
  2. Check PIL can open the image: `from PIL import Image; Image.open("path").convert("RGB")`
  3. Check torch is installed correctly: `import torch; print(torch.__version__)`

---

## 4. AI Matching Issues

### Error: No matches found even for similar items
- **Cause**: Multiple possible reasons
- **Identify**: "Find Matches" returns empty array
- **Fix**:
  1. **Category mismatch**: Matching only searches same category. Check both items have same category
  2. **Same user**: Matching skips items by the same user. Use different accounts
  3. **Low threshold**: Similarity below 0.5. Lower `MATCH_THRESHOLD` in `config.py`
  4. **Missing embeddings**: Check items have `image_features` and `text_embedding` in MongoDB:
     ```
     db.items.findOne({_id: ObjectId("...")}, {image_features: 1, text_embedding: 1})
     ```
  5. **Type mismatch**: Lost items only match against found items (and vice versa)

### Error: Matching is very slow
- **Cause**: Computing similarity across many items
- **Identify**: API takes >10 seconds to respond
- **Fix**:
  1. Normal for first run (model loading takes time)
  2. Reduce candidate pool: matching already filters by category
  3. For many items, consider pre-computing matches in a background job

### Error: `Loading ResNet-18 model...` hangs on startup
- **Cause**: First-time model download
- **Identify**: Backend appears frozen at startup
- **Fix**: Wait — first download takes 1-2 minutes. Subsequent starts are fast because the model is cached in `~/.cache/torch/`

---

## 5. Search & Filter Issues

### Error: Search returns no results
- **Cause**: Regex search is case-insensitive but exact
- **Identify**: Items exist but search doesn't find them
- **Fix**:
  1. Try shorter search terms (MongoDB regex searches in title AND description)
  2. Check items have `status: "active"` in MongoDB
  3. Check filter combination — using all three filters (type + category + search) is restrictive

### Error: Pagination shows wrong total
- **Cause**: Count query and find query have different filters
- **Identify**: "X items found" doesn't match actual results
- **Fix**: Both `count_documents(query)` and `find(query)` use the same `query` dict in `items.py`

---

## 6. Admin Panel Issues

### Error: Admin page redirects to home
- **Cause**: User doesn't have admin role
- **Identify**: `user.role` is "user" not "admin"
- **Fix**: Set admin role in MongoDB:
  ```
  db.users.updateOne({email: "admin@email.com"}, {$set: {role: "admin"}})
  ```
  Then log out and log back in to refresh the JWT token

### Error: `403 Forbidden` on admin APIs
- **Cause**: Token's user doesn't have admin role in DB
- **Identify**: API returns 403
- **Fix**: Same as above — update role in MongoDB and re-login

---

## 7. Notification Issues

### Error: Notifications not appearing
- **Cause**: No matches above threshold, or polling not running
- **Identify**: Bell icon shows 0 even after matching
- **Fix**:
  1. Check notifications collection in MongoDB: `db.notifications.find({})`
  2. Check matching actually created notifications (lower threshold if needed)
  3. Check Navbar polling interval (30s default) — wait or refresh page

### Error: Notification badge not updating
- **Cause**: Polling interval or component not re-rendering
- **Identify**: Badge stays at old count
- **Fix**: 
  1. Click the bell icon to open/close — this triggers `fetchUnreadCount()`
  2. Hard refresh the page (Ctrl+F5)

---

## 8. General Debugging Tips

### How to inspect MongoDB data
```bash
mongosh
use lost_and_found
db.users.find().pretty()
db.items.find().pretty()
db.notifications.find().pretty()
```

### How to check API responses
Use browser DevTools → Network tab, or use curl:
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### How to reset the database
```bash
mongosh
use lost_and_found
db.dropDatabase()
```

### How to check if models are loaded
Look at Flask server console output:
```
Loading ResNet-18 model...
Loading sentence transformer model...
Starting Lost & Found backend server...
```
If you see all three lines, models are loaded successfully.
