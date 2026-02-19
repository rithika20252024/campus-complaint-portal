# Campus Complaint & Resolution System

A secure and centralized web-based complaint management system for campus environments.

---



##  Problem Statement

Students often face issues related to:

- Hostel
- Mess
- Wi-Fi
- Academics
- Labs
- Infrastructure

Challenges include:

- Delayed resolutions  
- No centralized complaint tracking  
- Lack of transparency  
- Limited admin oversight  

This project provides a structured and transparent complaint management portal.

---

## Objective

- Build a secure campus complaint portal  
- Enable students to submit complaints (anonymous option available)  
- Allow admins to manage and update complaints  
- Provide real-time status tracking  
- Improve communication and resolution speed  

---

## Target Users

###  Students
- Submit complaints  
- Track complaint status  
- Choose anonymous submission  

### Admin / Faculty / Warden
- View all complaints  
- Update complaint status  
- Add replies  

---

## Core Features

### Authentication
- Login / Logout
- Session-based authentication
- Demo Credentials:
  - Student → `student1 / 1234`
  - Admin → `admin / admin2026`

###  Complaint Submission
- Title
- Category
- Description
- Photo upload
- Anonymous option
- Optional email

###  Student Dashboard
- View own complaints
- Status tracking
- Search & filter
- Stats cards (Total, Open, In Progress, Resolved)

###  Admin Panel
- View all complaints
- Update status
- Add replies

---

##  Technology Stack

### Frontend
- HTML5  
- CSS3  
- Tailwind CSS  
- EJS  
- JavaScript  

### Backend
- Node.js  
- Express.js  

### Database
- MongoDB Atlas  
- Mongoose  

### Tools
- VS Code  
- GitHub  
- Postman  
- Render (Deployment)

---

## 🗃 Database Design

### User Schema
- username
- name
- email
- password
- role (student/admin)

### Complaint Schema
- title
- category
- description
- status (Open | In Progress | Resolved)
- reply
- createdAt
- userId (null if anonymous)

### Relationship
One User → Many Complaints

---

## 📡 API Endpoints

| Method | Route | Description |
|--------|-------|------------|
| GET    | / | Landing Page |
| GET    | /login | Login Page |
| POST   | /login | Authenticate User |
| GET    | /register | Register Page |
| POST   | /register | Create User |
| GET    | /dashboard | Student Dashboard |
| GET    | /admin | Admin Panel |
| POST   | /submit | Submit Complaint |
| POST   | /update/:id | Update Complaint |
| GET    | /logout | Logout |

---

##  Folder Structure

campus-complaint-portal/
│
├── models/
│ ├── User.js
│ └── Complaint.js
│
├── routes/
│ ├── auth.js
│ ├── complaints.js
│ └── admin.js
│
├── views/
│ ├── index.ejs
│ ├── login.ejs
│ ├── register.ejs
│ ├── dashboard.ejs
│ ├── submit.ejs
│ └── admin.ejs
│
├── public/
│ └── uploads/
│
├── app.js
├── .env
├── package.json
└── README.md


---

##  Live Demo

**GitHub Repository:**  
https://github.com/rithika20252024/campus-complaint-portal  

**Live Deployment:**  
https://campus-complaint-portal-2-52oy.onrender.com/

---
## Future Improvements

Email notifications

Complaint analytics charts

Pagination

Advanced search filters

Role-based access control

##  How to Run Locally

```bash
git clone https://github.com/rithika20252024/campus-complaint-portal
cd campus-complaint-portal
npm install
npm start


Create a .env file:

MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key


Open in browser:

http://localhost:3000



