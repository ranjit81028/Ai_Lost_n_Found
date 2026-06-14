# Lost & Found Backend

## Setup

1. Install Python 3.9+
2. Install MongoDB and make sure it's running on localhost:27017
3. Create a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate   # Windows
   ```
4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Run the server:
   ```
   python app.py
   ```

The server will start on http://localhost:5000

## Creating an Admin User

After registering a normal user, you can make them admin via MongoDB shell:
```
use lost_and_found
db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}})
```
