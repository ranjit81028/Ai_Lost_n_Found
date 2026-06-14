# F. Presentation Guide — 5-Minute Talk

## Slide 1: Title (0:00 - 0:15)

> "Good morning/afternoon. I'm [Name], and today I'll be presenting our project: **AI-Powered Lost & Found Platform** — a smart web application that helps people find their lost items using artificial intelligence."

---

## Slide 2: The Problem (0:15 - 0:45)

> "We all know the pain of losing something on campus — a phone, a wallet, keys. The traditional lost and found system relies on physical notice boards or social media posts. The problem is:
> 
> 1. There's no centralized platform
> 2. Matching is completely manual — you have to scroll through every post
> 3. There's no way to match images automatically
> 4. People often describe the same item very differently
>
> We wanted to solve this by building a smart platform that does the matching for you."

---

## Slide 3: Our Solution (0:45 - 1:30)

> "Our platform lets users report lost or found items with a photo and description. Here's what makes it special:
>
> - When you upload an item, our system extracts **visual features using ResNet** (a deep learning model for images) and **text embeddings using BERT** (an NLP model for understanding language).
> - These feature vectors are stored in the database.
> - When you click 'Find Matches', the system compares your item against all opposite-type items using **cosine similarity** on both modalities.
> - We combine image similarity (40% weight) and text similarity (60% weight) into a final match score.
> - Items scoring above 50% are shown as potential matches, and both parties are notified."

---

## Slide 4: Tech Stack & Architecture (1:30 - 2:30)

> "Let me walk you through the architecture:
>
> **Frontend**: React — gives us a responsive single-page application with component-based UI
>
> **Backend**: Flask (Python) — lightweight REST API framework, and Python is essential for integrating PyTorch and HuggingFace models
>
> **Database**: MongoDB — NoSQL database, perfect for storing variable-length AI embedding vectors directly in item documents
>
> **AI Models**:
> - ResNet-18: extracts a 512-dimensional feature vector from each image
> - all-MiniLM-L6-v2: a lightweight BERT model that creates 384-dimensional text embeddings
>
> The flow is: User uploads → features extracted → stored in DB → on matching request → cosine similarity computed → results returned → notifications created.
>
> Authentication uses JWT tokens with bcrypt password hashing."

---

## Slide 5: Live Demo (2:30 - 4:00)

**Demo script:**

> "Let me show you how it works."

1. **Show the homepage** — "Here's our landing page with recent items and a search bar."

2. **Register a user** — "Let's register. [Fill form] Account created, we're redirected to the dashboard."

3. **Report a lost item** — "I'll report a lost item — say, a blue backpack. [Fill form, upload photo, submit] The system has now extracted AI features from this image and text."

4. **Report a found item** (use different account or pre-seed) — "Now let's say someone found a similar backpack. [Show pre-existing found item]"

5. **Run matching** — "From my lost item, I click 'Find AI Matches'. [Click button] The system found a match — 78% combined score. 72% image similarity, 82% text similarity."

6. **Show notification** — "The notification bell shows we have a new match alert."

7. **Show admin panel** — "As an admin, I can see platform statistics, manage users, and moderate items."

8. **Show search with filters** — "Users can also manually search by keyword, type, and category."

---

## Slide 6: Challenges & Learnings (4:00 - 4:30)

> "Some challenges we faced:
>
> 1. **Model size** — PyTorch and transformers are large (~2GB). We chose lightweight models (ResNet-18 instead of ResNet-152, MiniLM instead of full BERT) to balance accuracy and performance.
>
> 2. **Feature storage** — Storing 512-float arrays in MongoDB was a design decision. We considered using a vector database like Pinecone, but MongoDB's native array support was sufficient for our scale.
>
> 3. **Real-time vs on-demand matching** — We initially wanted automatic matching on every upload, but that's computationally expensive. We chose on-demand matching as a practical compromise.
>
> 4. **JWT security** — Implementing proper authentication with bcrypt and JWT was a significant learning experience."

---

## Slide 7: Future Improvements (4:30 - 5:00)

> "If we were to continue developing this, we would add:
>
> 1. **Background matching** using Celery — automatically match when a new item is uploaded
> 2. **Email notifications** via SMTP
> 3. **Location-based filtering** using GPS coordinates
> 4. **Chat system** so matched users can communicate directly
> 5. **Better search** using Elasticsearch instead of MongoDB regex
> 6. **Mobile app** using React Native
>
> Thank you! I'm happy to take any questions."

---

## Tips for the Presentation

> [!TIP]
> - **Practice the demo** multiple times. Pre-seed some items in the database so you don't spend time filling forms.
> - **Know your numbers**: ResNet-18 = 512-dim vector, MiniLM = 384-dim vector, weights = 40/60, threshold = 50%
> - **Be ready for "what if" questions**: What if no image? → Falls back to text-only. What if same category? → Only matches same category.
> - **Don't read slides** — maintain eye contact, speak naturally
> - **Time yourself** — 5 minutes goes fast, don't spend more than 90s on the demo
