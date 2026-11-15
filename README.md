# 🎓 CodeSmartNG Academic Portal

A comprehensive, multi-tenant School Management System built for Nigerian Nursery, Primary, and Secondary Schools. 

CodeSmartNG Academic provides school administrators, teachers, parents, and pupils with a seamless digital environment to manage academics, finances, and communication.

## ✨ Key Features (SAS Integration)

This portal features full support for **SAS (Secondary School)** alongside Primary education:
*   **Dual-Track Management:** Seamlessly toggle between Primary and Secondary operations.
*   **Dynamic Class Levels:** Auto-generates JSS 1-3 and SSS 1-3 classes.
*   **Stream Filtering:** Assign SSS pupils to Science, Arts, or Commercial streams.
*   **WAEC & Primary Grading:** Automated grading using WAEC (A1-F9) for Secondary and A-F for Primary.
*   **Stream-Aware Fees:** Automatically apply specific fees (e.g., Science Lab Fees) only to relevant pupils.
*   **PDF Generation:** Beautiful, track-aware Report Cards and Fee Receipts.

### Other Core Modules
*   **Admissions & Pupil Management:** Detailed profiles with medical, guardian, and promotion history.
*   **Results & Broadsheets:** Create assessments (CA1, CA2, Exams), enter scores, compute positions, and publish to parents.
*   **Fees & Billing:** Create fee structures, generate bills, record payments (Cash, Transfer, POS), and track outstanding balances.
*   **Parent & Pupil Portals:** Parents can link their children, view results, check bills, and receive announcements.
*   **Communication:** Built-in chat between admins/teachers, announcements, and automated email notifications (Brevo).
*   **Support:** Integrated floating WhatsApp support button for school admins.

## 🛠️ Tech Stack

**Frontend:**
*   React.js (Vite)
*   Tailwind CSS (Styling)
*   React Router v6
*   Axios (API requests)
*   Cloudinary (Image Uploads)

**Backend:**
*   Node.js & Express.js
*   MongoDB & Mongoose
*   JSON Web Tokens (JWT) for Auth
*   PDFKit (Report Cards & Receipts)
*   Brevo API (Transactional Emails)

**Deployment & Infrastructure:**
*   Frontend: Vercel
*   Backend: Render
*   Database: MongoDB Atlas

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas URI)
*   Brevo API Key (for emails)
*   Cloudinary Account (for image uploads)

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/CodeSmartNG-Academic.git
cd CodeSmartNG-Academic
