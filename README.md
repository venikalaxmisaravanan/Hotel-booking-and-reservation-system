# Hotel PMS – Hotel Reservation and Booking System

## Overview

Hotel PMS (Property Management System) is an academic software engineering prototype that demonstrates the transformation of an Object-Oriented Analysis and Design (OOAD) model into a working web application.

The project focuses on implementing the core workflow of a hotel reservation system, including time-based room booking, partial-duration booking, dynamic room state management, stay extension, conflict detection, and automatic room reallocation.

This project was developed as a software engineering prototype and is intended for academic and learning purposes rather than commercial deployment.

---

# Features

- User Registration and Login
- Secure Password Hashing
- JWT Authentication
- Time-Based Room Booking
- Partial Duration Booking
- Room Availability Checking
- Conflict Detection
- Dummy Payment Simulation
- Check-In Management
- Stay Extension
- Automatic Room Reallocation
- Early Checkout
- Dynamic Room State Management
- Admin Dashboard
- Booking History
- Room Search and Filtering

---

# Technology Stack

## Frontend

- React 18
- Vite
- Tailwind CSS
- React Router

## Backend

- Python Flask
- Flask JWT Extended
- Flask Bcrypt
- SQLAlchemy

## Database

- SQLite

---

# Project Architecture

```
hotel-pms/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config.py
│   │   └── extensions.py
│   │
│   ├── requirements.txt
│   ├── run.py
│   └── seed.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# Room State Lifecycle

The application manages the complete lifecycle of a hotel room using predefined state transitions.

```
Available
     ↓
Reserved
     ↓
Occupied
     ↓
Extended
     ↓
Released
     ↓
Cleaning
     ↓
Available
```

All room state transitions are validated through the backend service layer to ensure consistency.

---

# Functional Workflow

The system supports the following booking workflow:

1. User Registration / Login
2. Search Available Rooms
3. Check Room Availability
4. Book Room
5. Dummy Payment
6. Booking Confirmation
7. Customer Check-In
8. Stay Extension
9. Conflict Detection
10. Automatic Room Reallocation (if extension is not possible)
11. Early Checkout
12. Room Cleaning
13. Room Available for Next Booking

---

# Database Design

The prototype uses SQLite with normalized tables.

### Users

- User ID
- Full Name
- Email
- Username
- Password Hash

### Rooms

- Room ID
- Room Number
- Room Type
- Room State

### Bookings

- Booking ID
- User ID
- Room ID
- Booking Date
- Start Time
- End Time
- Booking Status

---

# Running the Project

## Backend

```bash
cd backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Seed the database

```bash
python seed.py
```

Run the backend

```bash
python run.py
```

Backend runs at

```
http://localhost:5000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# Demo Account

Username

```
demo
```

Password

```
Password123
```

You may also register a new account.

---

# Design Highlights

This prototype demonstrates several software engineering concepts:

- Object-Oriented Analysis and Design (OOAD)
- MVC Architecture
- Object-Oriented Programming
- Modular Service Layer
- REST API Design
- JWT Authentication
- Time-Based Scheduling
- Conflict Detection Algorithms
- Dynamic State Management
- Automatic Room Reallocation Logic

---

# Current Scope

This prototype intentionally excludes:

- Online Payment Gateway
- Hotel Pricing Module
- Email Notifications
- Housekeeping Ticket Management
- Multi-Hotel Support
- Role-Based Access Control

These can be added in future versions.

---

# Future Improvements

- Payment Gateway Integration
- Email Notifications
- Role-Based User Permissions
- Booking Analytics Dashboard
- Housekeeping Management
- Real-Time Room Updates
- Multiple Hotel Support
- Report Generation

---

# Screenshots

Add screenshots here after completing the project.

Example:

- Login Page
- Dashboard
- Book Room
- Booking Details
- Admin Dashboard
- Room Reallocation

---

# Learning Outcomes

This project demonstrates practical implementation of software engineering concepts, including requirements analysis, UML-based system design, backend development, frontend integration, database management, RESTful API development, authentication, and complete workflow implementation from OOAD documentation to a functional web application.

---

# License

This project is developed for academic and educational purposes.

# Author
**S.Venikalaxmi**
M.Tech Integrated Software Engineering -Vit Vellore
Github[@venikalaxmisaravanan](https://github.com/venikalaxmisaravanan)
