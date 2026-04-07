# 🏥 MediCare NGO — Healthcare Support Web App

> A fully functional AI-powered healthcare support portal built for NGOs serving underprivileged communities across India.

🔗 **Live Demo:** https://healthcare-support-web-app-wmp3.vercel.app/

📁 **Admin Dashboard:** https://healthcare-support-web-app-wmp3.vercel.app/admin.html

---

## 📌 What This Is

A mini healthcare support web app built as part of an internship assignment. The goal was to create a simple patient/volunteer registration system with an AI or automation feature layered on top.

Instead of just building a basic form, I built a full support portal with:

- A multi-tab registration system (patients, volunteers, contacts)
- A live AI chatbot powered by Groq (Llama 3.3 70B)
- An automatic AI triage system that scores patient urgency in the background
- An admin dashboard where NGO staff can monitor all submissions with priority flags
- Standalone informational pages for About, Programs, Volunteer, and Contact

---

## ✨ Features

### 1. Registration Portal (3-in-1 Form)

- **Patient Support** — name, age, phone, city, medical need, description
- **Volunteer Signup** — skills, availability, motivation
- **Contact Form** — general inquiries, partnerships, media

### 2. 🤖 AI FAQ Chatbot

- Powered by **Groq API** (llama-3.3-70b-versatile) — fast, free, real responses
- Multi-turn conversation — remembers context across the chat session
- Quick-prompt buttons for common questions
- Scoped to NGO context — won't hallucinate outside its domain
- Fallback to helpline/108 for emergencies

### 3. 🚨 AI Auto-Triage System

The most impactful AI feature for an NGO:

When a patient submits a request with a description, the app **automatically calls the AI in the background** to analyze urgency and assigns:

- 🔴 **HIGH** — immediate attention needed (chest pain, elderly alone, mental health crisis)
- 🟡 **MEDIUM** — needs help within 48 hours
- 🟢 **LOW** — can be scheduled for the next available slot

Each triage result includes:

- Priority level
- One-line reason
- Recommended first action for the volunteer

This runs silently after form submission — the patient sees a success message, the NGO team sees a prioritized queue.

### 4. 📊 Admin Dashboard (`admin.html`)

- Real-time view of all submissions (auto-refreshes every 10s)
- Color-coded priority badges on each card
- Filter by priority (High/Medium/Low/Pending) and type (Patient/Volunteer/Contact)
- Full triage reasoning visible per card
- **"Generate AI Summary Report"** — one click sends all submissions to Groq and gets an operational summary with recommended actions for the team

### 5. 📄 Supporting Pages

- **About** — explains the mission, approach, and impact of the project
- **Programs** — outlines the support categories and workflow
- **Volunteer** — describes how volunteers can contribute
- **Contact** — explains how to reach the team or submit a contact request

---

## 🛠 Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JavaScript           |
| Backend  | Node.js HTTP server (`server.js`)         |
| AI / LLM | Groq API — llama-3.3-70b-versatile        |
| Storage  | localStorage (submissions) + `.env` (key) |
| Fonts    | Google Fonts (DM Serif Display + DM Sans) |
| Hosting  | Vercel / local Node server for development |

**No npm dependencies. No build step. Lightweight local backend proxy for AI calls.**

---

## 🏥 NGO Use Case — Why This Matters

Small healthcare NGOs in India face a real operational problem:

- Staff can't be online 24/7 to answer the same questions repeatedly
- Patient requests come in unstructured — no way to know who needs help first
- Volunteer coordinators manually sort through emails/calls

This app solves all three:

1. **AI Chatbot** handles FAQ load at any hour — no staff needed
2. **Auto-Triage** turns unstructured patient descriptions into a prioritized queue automatically
3. **Admin Dashboard** gives coordinators a single view — no spreadsheet juggling

**Estimated impact:** For an NGO receiving 50+ patient requests/week, auto-triage alone could save 3-4 hours of manual review per week and ensure high-risk patients are never missed in the queue.

---

## 🚀 Setup & Run Locally

### Prerequisites

- A free [Groq API key](https://console.groq.com) (takes 2 minutes)

### Steps

1. Clone the repo

```bash
git clone https://github.com/ius-sharma/healthcare-support-web-app.git
cd healthcare-support-web-app
```

2. Add your Groq API key in `.env`:

```env
GROQ_API_KEY=your_key_here
```

Notes:

- Preferred key name is `GROQ_API_KEY`
- `YOUR_GROQ_API_KEY` is also supported for backward compatibility

3. Start the local server:

```bash
node server.js
```

4. Open http://localhost:3000 in your browser

5. To view the admin dashboard, open http://localhost:3000/admin.html in the same browser (localStorage is shared)

Optional (Live Server compatibility):

- You can open pages on `127.0.0.1:5500`, but keep `node server.js` running on port `3000` for AI features.

---

## 🌐 Deploy on Vercel

This repo is set up for a Vercel deployment as a static site plus one serverless API route.

### What Vercel uses

- `index.html` and `admin.html` as static pages
- `api/groq/chat.js` as the Groq proxy function
- `GROQ_API_KEY` as a project environment variable

### Steps

1. Push the latest code to GitHub.
2. Import this repository into Vercel.
3. Add an environment variable named `GROQ_API_KEY` in the Vercel project settings.
4. Deploy with the default settings.
5. Use the Vercel URL as the live hosted link for the assignment.

### Notes

- The browser never sees the Groq secret key.
- AI requests go to `/api/groq/chat`, which Vercel serves through the serverless function.
- `server.js` is only for local development and is not required for the hosted deployment.

For the best assignment submission, use the Vercel URL as the live hosted link and keep the GitHub repo link in the submission notes.

---

## 📁 Project Structure

```
healthcare-support-web-app/
├── index.html      # Main portal — registration forms + AI chatbot
├── admin.html      # Admin dashboard — submissions + triage + AI summary
├── app.js          # All JavaScript logic — forms, triage, chatbot
├── server.js       # Local backend proxy for Groq API + static serving
├── api/groq/chat.js # Vercel serverless function for Groq API calls
├── about.html      # About page
├── programs.html   # Programs page
├── volunteer.html  # Volunteer page
├── contact.html    # Contact page
├── .env            # Local environment variables (not for public commits)
└── README.md       # This file
```

---

## 🔐 API Key Note

The Groq API key is read server-side from `.env` and never exposed to browser JavaScript.
This prevents leaking your key in the frontend code or browser devtools.

---

## 👤 Built By

**Ayush** — Computer Engineering Student  
Built for internship assignment · April 2026

---

_"We evaluate clarity and effort, not perfection," — and this was built with both._
