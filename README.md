# CodeSmartNG Academic 🎓
> **Smart School Management, Better Learning.**

CodeSmartNG Academic is a comprehensive, multi-tenant school management SaaS platform built specifically for Nigerian Nursery and Primary Schools. It provides a centralized portal for Super Admins, School Proprietors, Administrators, Teachers, Parents, and Pupils to manage academic and financial activities seamlessly.

## 🚀 Key Features

### 🏢 Multi-Tenancy & Security
*   **Strict Data Isolation:** Every school's data is isolated using a `schoolId` on every database query. No school can access another school's data.
*   **Role-Based Access Control (RBAC):** Secure JWT authentication with 6 distinct user roles.
*   **Brevo Email Integration:** Automated password reset emails using Brevo's HTTP API.
*   **Subscription Management:** 30-day free trial for new schools. Super Admin can track expirations and renew subscriptions manually.

### 👑 Super Admin Dashboard
*   Platform-wide metrics (Total Schools, Users, Pupils, Teachers).
*   Approve, Reject, or Suspend school registrations.
*   Manage school subscriptions (Renew 30 days).

### 🏫 School Admin / Proprietor Dashboard
*   **Staff Management:** Add Teachers, Admins, and Parents.
*   **Academics:** Create Classes, Subjects, and assign Form/Subject Teachers.
*   **Finance:** Create Fee Structures (in Naira/Kobo), Generate Bills, and record manual payments (Cash, Bank Transfer).
*   **Communication:** Publish school-wide Announcements.

### 👩‍🏫 Teacher Dashboard
*   **Attendance:** Form teachers can mark daily attendance (Present, Absent, Late, Excused).
*   **Homework:** Publish assignments with due dates.
*   **Results:** Create assessments, enter scores, and view class broadsheets.
*   **Live Chat:** Message School Admins directly (secured so teachers cannot message each other).

### 👨‍👩‍👧 Parent Portal
*   **Child Linking:** Securely link to children using their Admission Number.
*   **Overview:** See child's attendance percentage, latest results, outstanding fees, and class position at a glance.
*   **Finance:** View fee bills, school bank details for manual transfers, and payment history.
*   **Report Cards:** View and print beautiful, browser-native A4 PDF report cards.
*   **Communication:** Receive school announcements and message the school Admin.

### 👦 Pupil Portal
*   View homework, learning materials, and published results.

## 🛠️ Tech Stack

**Frontend:**
*   React.js (Vite)
*   Tailwind CSS (Custom UI Design System)
*   React Router DOM (Role-based routing)
*   Axios (API requests & Interceptors)

**Backend:**
*   Node.js & Express.js
*   MongoDB & Mongoose (Database & Modeling)
*   JWT (JSON Web Tokens for Auth)
*   Bcrypt.js (Password Hashing)
*   Brevo API (Email Delivery)

**Deployment & Hosting:**
*   Frontend: **Vercel**
*   Backend: **Render**
*   Database: **MongoDB Atlas**

## ⚙️ Environment Variables

To run this project locally or deploy it, you need to configure the following environment variables.

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/codesmartng_academic
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Super Admin Seed Data
SUPER_ADMIN_EMAIL=admin@codesmartng.com
SUPER_ADMIN_PASSWORD=SecurePassword123!

# Brevo Email API (For Password Resets)
BREVO_API_KEY=xkeysib-your-brevo-api-key
EMAIL_FROM=noreply@codesmartng.com
