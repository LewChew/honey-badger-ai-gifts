# Data Directory

This directory contains the SQLite database file and other data storage.

- `users.db` - SQLite database containing user accounts, sessions, and gift orders
- Database is automatically created when the server starts

## Database Schema

### Users Table
- id (PRIMARY KEY)
- name
- email (UNIQUE)
- password (hashed)
- phone
- created_at
- updated_at
- is_active
- email_verified
- phone_verified

### Sessions Table
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- token
- expires_at
- created_at

### Gift Orders Table
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- tracking_id (UNIQUE)
- recipient_name
- recipient_contact
- gift_type
- gift_value
- challenge
- message
- duration
- status
- created_at
- updated_at
