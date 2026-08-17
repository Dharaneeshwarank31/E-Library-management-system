# E-Library Management System
### Java Eclipse + MySQL Workbench | Complete Setup Guide

---

## 📁 Project Structure

```
ELibrarySystem/
├── src/
│   ├── main/
│   │   └── Main.java                  ← Entry point
│   ├── db/
│   │   └── DBConnection.java          ← MySQL connection singleton
│   ├── model/
│   │   ├── User.java                  ← User POJO
│   │   └── Book.java                  ← Book POJO
│   ├── dao/
│   │   ├── UserDAO.java               ← User DB operations
│   │   └── BookDAO.java               ← Book DB operations
│   ├── util/
│   │   ├── PasswordUtil.java          ← SHA-256 hashing
│   │   └── SessionManager.java        ← Login session
│   └── ui/
│       ├── LoginFrame.java            ← Login screen
│       ├── RegisterFrame.java         ← Student registration
│       ├── AdminDashboard.java        ← Admin panel
│       ├── BookFormDialog.java        ← Add/Edit book dialog
│       ├── StudentDashboard.java      ← Student portal
│       └── PDFViewerFrame.java        ← PDF opener
└── elibrary_database.sql              ← Complete MySQL schema
```

---

## ⚙️ STEP 1 — MySQL Database Setup

1. Open **MySQL Workbench**
2. Connect to your local server (root)
3. Open the `elibrary_database.sql` file
4. Click **Execute All (⚡)**

This creates:
- Database: `elibrary_db`
- Tables: `users`, `books`, `borrow_records`, `read_logs`
- View: `available_books`
- Stored procedure: `search_books`
- Default admin account: **admin / Admin@123**
- Sample student accounts: **john_doe / Student@123**

> ⚠ The SHA-256 hash for **Student@123** needs to be regenerated.
> After running the SQL, update student passwords:
>
> ```sql
> -- Run this Java snippet ONCE to get the hash:
> -- System.out.println(util.PasswordUtil.hash("Student@123"));
> -- Then run:
> UPDATE users SET password = '<hash>' WHERE role = 'STUDENT';
> ```
>
> OR simply register new students using the in-app **Register** button.

---

## ☕ STEP 2 — Eclipse Project Setup

### Create Project
1. Open Eclipse → **File → New → Java Project**
2. Name it: `ELibrarySystem`
3. Set JDK to **Java 17+**

### Create Package Structure
Right-click `src` → **New → Package** for each:
- `main`
- `db`
- `model`
- `dao`
- `util`
- `ui`

### Copy Source Files
Place each `.java` file into its corresponding package folder.

---

## 📦 STEP 3 — Add MySQL Connector JAR

1. Download **MySQL Connector/J** from:
   https://dev.mysql.com/downloads/connector/j/

2. Choose: **Platform Independent** → download the ZIP

3. Extract and locate: `mysql-connector-j-8.x.x.jar`

4. In Eclipse:
   - Right-click project → **Properties**
   - **Java Build Path** → **Libraries** tab
   - **Add External JARs…**
   - Select the `.jar` file → **Apply and Close**

---

## 🔧 STEP 4 — Configure Database Connection

Open `src/db/DBConnection.java` and update:

```java
private static final String HOST     = "localhost";   // your MySQL host
private static final String PORT     = "3306";        // MySQL port
private static final String DATABASE = "elibrary_db";
private static final String USERNAME = "root";        // your MySQL username
private static final String PASSWORD = "root";        // ← YOUR PASSWORD HERE
```

---

## 📂 STEP 5 — Create PDF Storage Folder

Create the folder: `C:\ELibrary\books\`  (Windows)
or `/home/user/ELibrary/books/` (Linux/macOS)

Place your PDF books inside this folder.

When adding books via Admin, use the **Browse** button to select PDFs.

---

## ▶️ STEP 6 — Run the Application

1. Right-click `src/main/Main.java`
2. **Run As → Java Application**

---

## 🔐 Default Login Credentials

| Role    | Username | Password  |
|---------|----------|-----------|
| Admin   | admin    | Admin@123 |
| Student | (register via app) | your choice |

---

## 🖥️ Features by Role

### Admin Can:
- ✅ Login with admin credentials
- ✅ Upload books (title, author, category, ISBN, copies, PDF path)
- ✅ Edit existing book details
- ✅ Soft-delete books (marks inactive)
- ✅ View all students
- ✅ Open/Preview any PDF
- ✅ Search books
- ✅ View real-time library stats

### Student Can:
- ✅ Login or register a new account
- ✅ Browse all available books
- ✅ Search by title / author / category
- ✅ Filter by category (sidebar)
- ✅ View book details (description, ISBN, copies)
- ✅ Open PDF books (system PDF viewer)
- ✅ Double-click a row to open PDF instantly

---

## 🗄️ Database Tables

### users
| Column     | Type         | Notes                    |
|------------|--------------|--------------------------|
| id         | INT PK AI    |                          |
| username   | VARCHAR(50)  | UNIQUE                   |
| password   | VARCHAR(255) | SHA-256 hash             |
| full_name  | VARCHAR(100) |                          |
| email      | VARCHAR(100) | UNIQUE                   |
| role       | ENUM         | 'ADMIN' or 'STUDENT'     |
| created_at | TIMESTAMP    |                          |
| is_active  | TINYINT(1)   | 1=active, 0=deactivated  |

### books
| Column           | Type         | Notes                |
|------------------|--------------|----------------------|
| id               | INT PK AI    |                      |
| title            | VARCHAR(200) |                      |
| author           | VARCHAR(150) |                      |
| category         | VARCHAR(100) |                      |
| isbn             | VARCHAR(20)  | optional             |
| description      | TEXT         | optional             |
| pdf_path         | VARCHAR(500) | absolute file path   |
| total_copies     | INT          |                      |
| available_copies | INT          |                      |
| uploaded_by      | INT FK       | → users.id           |
| uploaded_at      | TIMESTAMP    |                      |
| is_active        | TINYINT(1)   | soft delete flag     |

### borrow_records
| Column      | Type      | Notes               |
|-------------|-----------|---------------------|
| id          | INT PK AI |                     |
| student_id  | INT FK    | → users.id          |
| book_id     | INT FK    | → books.id          |
| borrow_date | TIMESTAMP |                     |
| return_date | TIMESTAMP | NULL if not returned|
| status      | ENUM      | BORROWED/RETURNED   |

### read_logs
| Column     | Type      | Notes      |
|------------|-----------|------------|
| id         | INT PK AI |            |
| student_id | INT FK    | → users.id |
| book_id    | INT FK    | → books.id |
| opened_at  | TIMESTAMP |            |

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| "JDBC Driver not found" | Add `mysql-connector-j.jar` to build path |
| "Access denied for user 'root'" | Update password in `DBConnection.java` |
| "Unknown database 'elibrary_db'" | Run `elibrary_database.sql` in MySQL Workbench |
| PDF doesn't open | Verify file path is correct & PDF viewer is installed |
| "Communications link failure" | Ensure MySQL service is running |
| Login fails | Check that password SHA-256 hash matches DB value |

---

## 📋 Password Hashing Note

The default admin password `Admin@123` needs its SHA-256 hash in the DB.
Run this snippet once to get the correct hash:

```java
public static void main(String[] args) {
    System.out.println(util.PasswordUtil.hash("Admin@123"));
    System.out.println(util.PasswordUtil.hash("Student@123"));
}
```

Then update the SQL:
```sql
UPDATE users SET password = '<admin_hash>'   WHERE username = 'admin';
UPDATE users SET password = '<student_hash>' WHERE role = 'STUDENT';
```

**Recommended**: Use the in-app **Register** button to create student accounts —  
the app handles hashing automatically.

---

*Built with Java Swing + MySQL | E-Library Management System*
