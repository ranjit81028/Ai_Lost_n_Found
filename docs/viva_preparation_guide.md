# C. Technical Viva Preparation Guide

## General Project Questions

### Q: What is this project about?
**A:** It's an AI-powered Lost & Found platform for a campus. When someone loses or finds an item, they report it with a photo and description. The system uses two AI models — ResNet for image similarity and BERT for text similarity — to automatically match lost items with found items and notify users.

### Q: Why did you choose this tech stack (React + Flask + MongoDB)?
**A:** 
- **React** — Most popular frontend library, component-based architecture makes it easy to build reusable UI pieces like ItemCard and SearchBar. Huge ecosystem and community support.
- **Flask** — Lightweight Python framework, perfect for REST APIs. Python is also the best language for ML/AI integration since PyTorch and transformers are Python-native.
- **MongoDB** — NoSQL database, ideal because our data (items, users) doesn't have complex relationships. Item documents can store variable-length feature vectors (embeddings) directly without schema migrations. Document structure maps naturally to JSON API responses.

### Q: Why not use Django instead of Flask?
**A:** Django is a full-featured framework with ORM, admin panel, etc. For this project, Flask gives us more control and simplicity. We don't need Django's ORM since we're using MongoDB (not SQL). Flask's blueprint system is sufficient for our API structure.

### Q: Why MongoDB and not MySQL/PostgreSQL?
**A:** 
1. Our item documents contain AI embeddings (512-float arrays and 384-float arrays). Storing variable-length arrays is natural in MongoDB but requires workarounds in SQL.
2. No complex joins needed — our data model is simple (users, items, notifications).
3. Schema flexibility — we can add new fields without migrations.

### Q: What are the limitations of your project?
**A:**
1. **No real-time matching** — matches are computed on-demand when user clicks "Find Matches", not automatically in background
2. **No email notifications** — only in-app notifications
3. **Single-server AI** — ML models run on the same server, which is slow for production
4. **No image deduplication** — same item can be reported multiple times
5. **Basic text search** — uses MongoDB regex, not full-text search
6. **No password reset** — no forgot password/email verification flow

### Q: How would you scale this?
**A:**
1. Move AI models to a separate microservice (or use GPU instances)
2. Add background job queue (Celery + Redis) for async matching
3. Use Elasticsearch for better text search
4. Deploy with Docker + Kubernetes
5. Add CDN for image serving
6. Use WebSockets for real-time notifications instead of polling

---

## Authentication Questions

### Q: How does authentication work in your project?
**A:** We use JWT (JSON Web Tokens). When a user logs in, the server creates a token containing their user_id and an expiration time, signed with a secret key. The frontend stores this token in localStorage and sends it in the `Authorization: Bearer <token>` header with every API request. The `login_required` decorator on protected routes extracts and validates this token.

### Q: Why JWT and not sessions?
**A:** JWT is stateless — the server doesn't need to store session data. This is better for REST APIs because each request is self-contained. It also works well when frontend and backend are on different origins (CORS).

### Q: How are passwords stored?
**A:** Passwords are hashed using bcrypt before storing in MongoDB. Bcrypt automatically generates a random salt and includes it in the hash. We never store plaintext passwords. During login, `bcrypt.checkpw()` compares the submitted password against the stored hash.

### Q: What happens if the JWT token expires?
**A:** The token has a 24-hour expiry. When expired, `decode_token()` returns None (catches `ExpiredSignatureError`), the `login_required` decorator returns 401, and the frontend should redirect to login. The user needs to log in again.

### Q: What is the `admin_required` decorator?
**A:** It's stacked on top of `login_required`. After verifying the token is valid, it additionally checks if the user's `role` field is `"admin"`. If not, it returns 403 Forbidden.

---

## AI/ML Questions

### Q: How does image matching work?
**A:** 
1. We use **ResNet-18**, a pre-trained CNN (Convolutional Neural Network) from ImageNet
2. We remove the final classification layer — instead of class probabilities, we get a **512-dimensional feature vector** that represents the image's visual content
3. When a user uploads an image, we extract this vector and store it in MongoDB
4. To match, we compute **cosine similarity** between two feature vectors
5. Cosine similarity ranges from -1 to 1 (we clamp to 0-1). Higher = more visually similar

### Q: Why ResNet-18 and not a larger model?
**A:** ResNet-18 is small (~45MB) and fast — important for a student project that runs on a regular laptop. ResNet-50/152 would give marginally better features but are much larger and slower. For our use case (matching similar objects), ResNet-18 is sufficient.

### Q: What is ResNet? Why is it called "ResNet"?
**A:** ResNet stands for **Residual Network**. It introduced "skip connections" (residual connections) that allow gradients to flow directly through the network during training. This solved the vanishing gradient problem and allowed training very deep networks (up to 152 layers). The "18" means 18 layers.

### Q: How does text matching work?
**A:** 
1. We use **all-MiniLM-L6-v2**, a sentence transformer model (BERT-based)
2. We combine the item's title and description into one string
3. The model encodes this into a **384-dimensional embedding vector**
4. To match, we compute cosine similarity between two text embeddings
5. Semantically similar descriptions (e.g., "blue wallet" and "navy leather purse") will have high similarity

### Q: What is BERT?
**A:** BERT (Bidirectional Encoder Representations from Transformers) is a language model pre-trained on a large text corpus. It understands context — "bank" near "river" vs "bank" near "money" generates different embeddings. We use a lightweight variant (MiniLM) that's 6 layers instead of BERT's 12, making it faster with similar quality.

### Q: Why combine image and text similarity?
**A:** Neither modality alone is perfect:
- **Image only** — fails if photos are taken from different angles or lighting
- **Text only** — fails if users describe the same item with different words
- **Combined** — more robust. We use 40% image weight and 60% text weight because text descriptions tend to be more reliable for identification.

### Q: What is cosine similarity?
**A:** It measures the angle between two vectors, ignoring their magnitude. Formula: `cos(θ) = (A·B) / (||A|| × ||B||)`. A score of 1 means identical direction (most similar), 0 means perpendicular (unrelated), -1 means opposite. We use it because it works well for high-dimensional embeddings.

### Q: How do you handle items without images?
**A:** If no image is uploaded, `image_features` is stored as None. During matching, if either item lacks image features, we fall back to text-only matching (100% text weight instead of the 60/40 split).

---

## Database Questions

### Q: What collections does your database have?
**A:**
1. **users** — user accounts (name, email, hashed password, role)
2. **items** — lost/found reports (title, description, category, location, image path, AI embeddings, status)
3. **notifications** — match alerts (message, item references, read status)

### Q: Why don't you use Mongoose?
**A:** Mongoose is a Node.js library. Our backend is Python, so we use Flask-PyMongo which wraps pymongo. We define document structure using factory functions in our `models/` directory instead of schema validators.

### Q: How are AI embeddings stored?
**A:** As arrays of floats directly in the item document. MongoDB handles arrays natively. For example, `image_features` is a 512-element float array, and `text_embedding` is a 384-element float array.

---

## Frontend Questions

### Q: How does state management work?
**A:** We use React Context API for global auth state (user info, login/logout functions). For page-level state (items list, form data), we use local `useState` hooks. We don't use Redux — it would be overkill for this project.

### Q: How does the frontend communicate with the backend?
**A:** Through Axios HTTP client. We have a centralized `api.js` file that creates an axios instance with the base URL `http://localhost:5000/api` and an interceptor that automatically attaches the JWT token to every request.

### Q: How does routing work?
**A:** We use React Router v6. `App.js` defines `<Routes>` with `<Route>` elements mapping URL paths to page components. Navigation happens via `<Link>` components or `useNavigate()` hook for programmatic redirects.

### Q: Why separate CSS files instead of styled-components or Tailwind?
**A:** Plain CSS files are simpler and don't require additional dependencies. Each component has its own CSS file (e.g., `Navbar.css`), keeping styles organized. This is the most straightforward approach for a student project.

---

## API & Architecture Questions

### Q: What is a Blueprint in Flask?
**A:** Blueprints are Flask's way of organizing routes into modules. Instead of defining all routes in `app.py`, we have separate files (`auth.py`, `items.py`, etc.) that define their own routes. They're registered with URL prefixes like `/api/auth`.

### Q: What is CORS and why do you need it?
**A:** CORS (Cross-Origin Resource Sharing) — the React frontend runs on port 3000 and the Flask backend on port 5000. Browsers block cross-origin requests by default. Flask-CORS adds the necessary headers to allow the frontend to call the backend.

### Q: Why is item creation a multipart form instead of JSON?
**A:** Because we need to upload an image file along with text data. File uploads require `multipart/form-data` encoding. Regular JSON (`application/json`) can't include binary files.

### Q: How does the matching endpoint work end-to-end?
**A:**
1. User clicks "Find Matches" on their item detail page
2. Frontend sends `GET /api/match/<item_id>` with JWT
3. Backend loads the item (with its stored embeddings) from MongoDB
4. Queries all opposite-type items in the same category
5. For each candidate: computes image similarity + text similarity → weighted combination
6. Filters matches above 0.5 threshold, returns top 10
7. Creates notification documents for both parties
8. Frontend displays match cards with scores

### Q: What HTTP status codes do you use?
**A:**
- `200` — Success (GET, PUT)
- `201` — Created (POST register, POST item)
- `400` — Bad request (validation errors)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (not owner, not admin)
- `404` — Not found
- `500` — Server error

---

## Security Questions

### Q: What security measures have you implemented?
**A:**
1. Password hashing with bcrypt (salted)
2. JWT tokens for stateless authentication
3. Authorization checks (owner-only operations, admin-only routes)
4. File upload validation (allowed extensions, size limit)
5. Secure filename generation (UUID-based, sanitized with werkzeug)
6. CORS restricted to frontend origin

### Q: What security vulnerabilities exist?
**A:**
1. JWT secret is hardcoded in config (should use environment variable)
2. No rate limiting (vulnerable to brute force)
3. No input sanitization for XSS
4. No HTTPS (development only)
5. Token stored in localStorage (vulnerable to XSS attacks; httpOnly cookies would be more secure)

---

## Deployment Questions

### Q: How would you deploy this project?
**A:**
1. **Backend**: Deploy Flask app using Gunicorn (production WSGI server) on a Linux VM or cloud instance (AWS EC2, Heroku)
2. **Frontend**: Build with `npm run build`, serve static files via Nginx or deploy to Vercel/Netlify
3. **Database**: Use MongoDB Atlas (cloud) instead of local MongoDB
4. **Environment variables**: Use `.env` file for secrets

### Q: What would you do differently in production?
**A:**
1. Use environment variables for all secrets
2. Add HTTPS with SSL certificates
3. Use a reverse proxy (Nginx) in front of Flask
4. Add rate limiting
5. Move ML models to separate GPU service
6. Add logging and monitoring
7. Add unit and integration tests
