# 🌟 CrowdFund — Next-Gen Vibe Crowdfunding Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://crowd-fund-client.vercel.app)
[![Built with React & Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-00D8FF?style=for-the-badge&logo=react)](https://crowd-fund-client.vercel.app)
[![Powered by Node & MongoDB](https://img.shields.io/badge/Backend-Node%20%2B%20Express%20%2B%20MongoDB-339933?style=for-the-badge&logo=mongodb)](https://crowd-fund-backend.vercel.app)

**CrowdFund** is an innovative, role-driven crowdfunding and community support ecosystem designed to connect passionate project creators with dedicated supporters. Built with modern web design principles and interactive micro-animations, the platform operates on a frictionless digital credit economy that enables seamless pledging, automated refunds, and scalable creator payouts.

---

## 🚀 Live Site & Deployment Links

- **🌐 Frontend Live Application (Vercel):** [https://crowd-fund-client.vercel.app](https://crowd-fund-client.vercel.app)
- **⚡ Backend API Server (Vercel Serverless):** [https://crowd-fund-backend.vercel.app](https://crowd-fund-backend.vercel.app)

---

## 🔑 Platform Credentials (Demo Access)

Experience all three distinct layers of the platform using our realistic, pre-seeded accounts:

| Role | Email Address | Password | Initial Perks / Access Level |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin** | **`admin@crowdfund.org`** | **`AdminPassword123!`** | Full platform moderation, user role switching & financial oversight |
| **🎨 Creator** | `creator@crowdfund.org` | `Creator123!` | Campaign launching, pledge approvals & payout requests ($250 starter balance) |
| **🙌 Supporter** | `supporter@crowdfund.org` | `Supporter123!` | Campaign browsing, pledging, credit purchases & scam reporting |

---

## ✨ Key Features & Highlights

Here is a comprehensive overview of the **15+ core features** built into this platform:

1. **🎭 3-Tier Role-Based Ecosystem:** Distinct, custom-tailored user interfaces and navigation bars dynamically rendered for **Supporters**, **Creators**, and **Admins**.
2. **🔒 Secure Authentication & Token Engine:** Powered by Bcrypt password hashing and robust **JWT (JSON Web Tokens)** stored in local browser state, alongside quick Google Sign-In authentication.
3. **🔄 Persistent Private Routing:** Advanced client-side route protection that guarantees users stay logged in and remain on private dashboard views without unwanted redirections upon reloading the browser.
4. **💡 Dynamic Credit Economy & Pledging:** Supporters purchase digital credits in standardized tiers ($10 = 100 credits) and pledge them directly toward active community campaigns.
5. **🎛️ Interactive Creator Dashboard:** Creators can easily launch new campaigns with custom funding goals, minimum contribution limits, reward structures, and cover imagery (with simulated ImgBB upload integration).
6. **⚖️ Creator Contribution Review & Auto-Refunds:** Creators maintain full control over pending contributions; approving a contribution adds to their total earnings, while rejecting immediately and automatically refunds the pledged credits back to the supporter’s wallet.
7. **💸 Business Monetization & Payout Pipeline:** Incorporates realistic platform commission logic where Creators convert raised credits into withdrawable earnings (at 20 Credits = $1 USD, minimum 200 credits) to Stripe, Bkash, Nagad, or Rocket accounts.
8. **🔔 In-App Floating Notification System:** Real-time alert triggers generate interactive popup notifications whenever a contribution is approved, a withdrawal is processed, or a campaign is moderated.
9. **🛡️ Executive Admin Governance:** A powerful Admin control tower featuring live statistical summaries of total users, creators, circulating platform credits, and cumulative processed dollar volume.
10. **👥 Dynamic User Role Modification:** Admins can alter user privileges on the fly (promoting Supporters to Creators or Admins) and safely remove infringing accounts from the database.
11. **🚨 Scam & Fraud Reporting Queue:** Empowering community integrity, Supporters can report suspicious campaigns with detailed rationales, immediately placing them in the Admin review queue for investigation or suspension.
12. **📊 Advanced Pagination & Data Tables:** High-volume user views (such as "My Contributions" and payment histories) implement responsive pagination and structured table presentations for optimal scanning.
13. **🎨 Premium Aesthetics & No Lorem Ipsum:** Crafted with a curated color palette, sleek typography, micro-animations, Swiper sliders, and **100% authentic, realistic English copywriting** across all campaigns and testimonials.
14. **⚡ Vercel Serverless & Edge Proxying:** Engineered for modern cloud architecture using custom routing rewrites to seamlessly link independent client and server repositories with zero CORS friction.
15. **📱 Fully Responsive Omni-Device Layouts:** Perfectly fluid layouts engineered to adapt seamlessly across mobile phones, tablets, and wide widescreen desktop environments.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Vanilla CSS / Tailwind UI Token Architecture, Lucide Icons, Swiper Sliders.
- **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB), JSON Web Token (JWT), Bcryptjs.
- **Cloud & DevOps:** Vercel (Edge Rewrites & Serverless Functions), MongoDB Atlas Cluster.

---

## ⚙️ Local Development & Setup Guide

If you wish to spin up the application locally for evaluation or contribution, follow these instructions:

### 1. Backend Configuration (`/backend`)
Create a `.env` file inside the `backend/` directory with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key
```
Run the development server:
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Configuration (`/frontend`)
Create a `.env` file inside the `frontend/` directory (optional for local fallback):
```env
VITE_API_URL=http://localhost:3000
```
Run the frontend client:
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` in your browser to start exploring!

---

## 📜 Repository Architecture

This project has been separated into dedicated architectures for decoupled cloud deployment:
- **`frontend/`** — Independent SPA containing the client interface, components, and router configuration.
- **`backend/`** — Serverless Express API housing data models, authentication middleware, and business logic.
