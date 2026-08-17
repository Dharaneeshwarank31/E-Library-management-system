# 📚 LibraVault — E-Library Management System

A full-stack e-library web application with user authentication, book management, and PDF viewing.

---

## 🗂️ Project Structure

```
elibrary/
├── backend/
│   ├── middleware/
│   │   └── auth.js          ← JWT verification middleware
│   ├── routes/
│   │   ├── auth.js          ← Register / Login / Me routes
│   │   └── books.js         ← Books CRUD + PDF upload/serve
│   ├── uploads/             ← PDF files stored here (auto-created)
│   ├── db.js                ← MySQL connection pool
│   ├── server.js            ← Express app entry point
│   ├── database.sql         ← Run this to set up MySQL tables
│   ├── package.json
│   └── .env                 ← Your config (DB password, JWT secret)
│
└── frontend/
    ├── pages/
    │   ├── index.html       ← Login / Register page
    │   └── dashboard.html   ← Main library dashboard
    ├── css/
    │   ├── auth.css
    │   └── dashboard.css
    └── js/
        ├── auth.js
        └── dashboard.js
```

---

## ✅ Prerequisites — Install These First

| Tool | Download |
|------|----------|
| Node.js (v18+) | https://nodejs.org |
| MySQL (v8+) | https://dev.mysql.com/downloads/mysql/ |
| A text editor | VS Code recommended |

---

## 🚀 Step-by-Step Setup Guide

### STEP 1 — Set Up MySQL Database

**Option A: Using MySQL Workbench (GUI)**
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Click File → Open SQL Script
4. Select `backend/database.sql`
5. Click the ⚡ Run button

**Option B: Using Terminal/Command Prompt**
```bash
mysql -u root -p < backend/database.sql
```
Enter your MySQL root password when prompted.

This creates:
- Database: `elibrary`
- Table: `users`
- Table: `books`
- One admin user: `admin@elibrary.com` / password: `Admin@123`
- 5 sample book records (without actual PDF files)

---

### STEP 2 — Configure Environment Variables

Open `backend/.env` and update these values:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE   ← Change this!
DB_NAME=elibrary

JWT_SECRET=change_this_to_a_long_random_string_123!   ← Change this!
JWT_EXPIRES_IN=7d
```

**⚠️ Important:** Change `DB_PASSWORD` to your actual MySQL password.

---

### STEP 3 — Install Backend Dependencies

Open a terminal, navigate to the `backend` folder, and run:

```bash
cd backend
npm install
```

This installs: Express, MySQL2, JWT, bcryptjs, multer, cors, and more.

---

### STEP 4 — Start the Backend Server

```bash
# Still inside the backend/ folder:
npm start

# Or with auto-restart on file changes (development):
npm run dev
```

You should see:
```
✅ MySQL Database connected successfully!
🚀 E-Library Server running at http://localhost:5000
```

If you see a database error, double-check your `.env` file.

---

### STEP 5 — Open the Frontend

You have two options:

**Option A: Use VS Code Live Server (Recommended)**
1. Install the "Live Server" extension in VS Code
2. Right-click on `frontend/pages/index.html`
3. Click "Open with Live Server"
4. It opens at `http://127.0.0.1:5500/frontend/pages/index.html`

**Option B: Open directly in browser**
1. Open `frontend/pages/index.html` in your browser
2. ⚠️ Some browsers may block fetch requests from `file://` — use Live Server instead

---

### STEP 6 — Login and Test!

Use the default admin account:
- **Email:** `admin@elibrary.com`
- **Password:** `Admin@123`

Or register a new account on the login page.

---

## 📤 Uploading PDF Books

1. Log in as admin (`admin@elibrary.com`)
2. Click **"Upload Book"** in the sidebar
3. Fill in: Title, Author, Category, Description
4. Choose a cover color
5. Click the PDF drop zone and select a PDF file
6. Click **"Upload Book"**

The PDF is saved in `backend/uploads/`. Click any book's **"Open PDF"** button to view it in a new tab.

---

## 🔐 How Authentication Works

1. On login/register, the server returns a **JWT token**
2. The token is stored in `localStorage`
3. Every API request includes the token in the `Authorization: Bearer <token>` header
4. The server verifies the token using the `JWT_SECRET` from `.env`
5. Token expires after 7 days (configurable in `.env`)

---

## 👤 User Roles

| Role | Can View Books | Can Upload Books | Can Delete Books |
|------|---------------|-----------------|-----------------|
| `user` | ✅ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ |

To make a user admin, run this in MySQL:
```sql
USE elibrary;
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

---

## 🌐 API Endpoints Reference

### Authentication
| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Books
| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| GET | `/api/books` | Get all books | Yes |
| GET | `/api/books?search=gatsby` | Search books | Yes |
| GET | `/api/books?category=Fiction` | Filter by category | Yes |
| GET | `/api/books/categories` | Get all categories | Yes |
| GET | `/api/books/:id/pdf` | Open/stream PDF | Yes |
| POST | `/api/books` | Upload new book | Admin only |
| DELETE | `/api/books/:id` | Delete a book | Admin only |

---

## 🛠️ Troubleshooting

**"Cannot connect to server"**
→ Make sure the backend is running: `cd backend && npm start`

**"Database connection failed"**
→ Check `.env` — is `DB_PASSWORD` correct? Is MySQL running?

**"Access denied for user 'root'"**
→ Verify your MySQL username and password in `.env`

**PDF shows blank / doesn't open**
→ Ensure the PDF file exists in `backend/uploads/` and the filename matches the database

**"Port 5000 already in use"**
→ Change `PORT=5001` in `.env` and update `API_BASE` in both frontend JS files

---

## 🔒 Security Notes for Production

- Change `JWT_SECRET` to a long random string (32+ chars)
- Use HTTPS (SSL certificate)
- Store PDFs on cloud storage (AWS S3, Cloudinary) instead of local disk
- Add rate limiting (`express-rate-limit`)
- Use environment variables — never commit `.env` to git
- Add `.env` to your `.gitignore`

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MySQL (via mysql2) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer |
| Validation | express-validator |

---

Built with ❤️ for beginners. Happy reading! 📖
