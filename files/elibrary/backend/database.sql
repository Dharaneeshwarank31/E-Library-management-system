-- ============================================
-- E-Library Database Setup
-- Run this in MySQL Workbench or terminal:
-- mysql -u root -p < database.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS elibrary;
USE elibrary;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Books Table
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  pdf_filename VARCHAR(255) NOT NULL,
  cover_color VARCHAR(7) DEFAULT '#4F46E5',
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sample Admin User (password: Admin@123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@elibrary.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpwswXFZXtjmhu', 'admin');

-- Sample Books (add your own PDFs later)
INSERT INTO books (title, author, description, category, pdf_filename, cover_color, uploaded_by) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.', 'Fiction', 'sample1.pdf', '#E11D48', 1),
('To Kill a Mockingbird', 'Harper Lee', 'The story of racial injustice and the loss of innocence in the American South.', 'Classic', 'sample2.pdf', '#0891B2', 1),
('1984', 'George Orwell', 'A dystopian social science fiction novel and cautionary tale.', 'Dystopian', 'sample3.pdf', '#7C3AED', 1),
('The Alchemist', 'Paulo Coelho', 'A philosophical novel about a young Andalusian shepherd journeying to the pyramids of Egypt.', 'Philosophy', 'sample4.pdf', '#D97706', 1),
('Clean Code', 'Robert C. Martin', 'A handbook of agile software craftsmanship.', 'Technology', 'sample5.pdf', '#059669', 1);

SELECT 'Database setup complete!' AS status;
