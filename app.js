// ============================================
// MediCare NGO — Main Application Logic
// Using Groq API (llama-3.3-70b-versatile)
// ============================================

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ============================================
// SECTION 1: FORM DATA STORAGE
// Saves submitted forms to localStorage so
// admin dashboard can read them later
// ============================================

function saveSubmission(type, data) {
  const existing = JSON.parse(localStorage.getItem("medicare_submissions") || "[]");
  const entry = {
    id: Date.now(),
    type,
    data,
    timestamp: new Date().toISOString(),
    status: "pending",
    priority: null,
    triage: null,
  };
  existing.unshift(entry);
  localStorage.setItem("medicare_submissions", JSON.stringify(existing));
  return entry;
}

function getAllSubmissions() {
  return JSON.parse(localStorage.getItem("medicare_submissions") || "[]");
}

// ============================================
// SECTION 2: TAB SWITCHING
// ============================================

function switchTab(tab, el) {
  document.getElementById("patientForm").style.display = "none";
  document.getElementById("volunteerForm").style.display = "none";
  document.getElementById("contactForm").style.display = "none";
  document.getElementById(tab + "Form").style.display = "block";
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
}

// ============================================
// SECTION 3: FORM SUBMISSION + AI TRIAGE
// ============================================

async function submitForm(type) {
  let formData = {};

  if (type === "patient") {
    const name = document.getElementById("p-name").value.trim();
    const age = document.getElementById("p-age").value.trim();
    const phone = document.getElementById("p-phone").value.trim();
    const city = document.getElementById("p-city").value.trim();
    const need = document.getElementById("p-need").value;
    const desc = document.getElementById("p-desc").value.trim();

    if (!name || !phone || !city) {
      alert("Please fill in Name, Phone, and City.");
      return;
    }

    formData = { name, age, phone, city, need, desc };

  } else if (type === "volunteer") {
    const name = document.getElementById("v-name").value.trim();
    const phone = document.getElementById("v-phone").value.trim();
    const email = document.getElementById("v-email").value.trim();
    const skill = document.getElementById("v-skill").value;
    const avail = document.getElementById("v-avail").value;
    const why = document.getElementById("v-why").value.trim();

    if (!name || !phone || !email) {
      alert("Please fill in Name, Phone, and Email.");
      return;
    }

    formData = { name, phone, email, skill, avail, why };

  } else if (type === "contact") {
    const name = document.getElementById("c-name").value.trim();
    const email = document.getElementById("c-email").value.trim();
    const subj = document.getElementById("c-subj").value.trim();
    const msg = document.getElementById("c-msg").value.trim();

    if (!name || !email || !msg) {
      alert("Please fill in Name, Email, and Message.");
      return;
    }

    formData = { name, email, subj, msg };
  }

  const entry = saveSubmission(type, formData);

  const successEl = document.getElementById(type + "-success");
  successEl.style.display = "block";

  if (type === "patient" && formData.desc) {
    runAITriage(entry.id, formData);
  }

  setTimeout(() => (successEl.style.display = "none"), 5000);
}

// ============================================
// AI TRIAGE — Groq analyzes patient urgency
// ============================================

async function runAITriage(entryId, patientData) {
  const userPrompt = `Patient Details:
- Name: ${patientData.name}
- Age: ${patientData.age || "Not specified"}
- Medical Need Category: ${patientData.need || "Not specified"}
- Description: ${patientData.desc}

Assess urgency. Respond ONLY with a valid JSON object, no extra text:
{
  "priority": "HIGH" or "MEDIUM" or "LOW",
  "reason": "one sentence explanation",
  "recommended_action": "what the NGO volunteer should do first"
}`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${window.GROQ_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: `You are a medical triage assistant for an NGO in India.
HIGH = immediate attention needed (emergency symptoms, elderly alone, mental health crisis, chest pain, difficulty breathing).
MEDIUM = needs help within 48 hours.
LOW = can be scheduled for next available slot.
Always respond with ONLY a valid JSON object. No explanation outside the JSON.`,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    const data = await res.json();
    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, "").trim();
    const triage = JSON.parse(clean);

    // Update saved entry with triage result
    const all = getAllSubmissions();
    const idx = all.findIndex((e) => e.id === entryId);
    if (idx !== -1) {
      all[idx].priority = triage.priority;
      all[idx].triage = triage;
      localStorage.setItem("medicare_submissions", JSON.stringify(all));
    }

    console.log("Triage complete:", triage);
  } catch (err) {
    console.error("Triage failed:", err);
  }
}

// ============================================
// SECTION 4: AI CHATBOT (Multi-turn)
// ============================================

const chatHistory = [];

const CHAT_SYSTEM_PROMPT = `You are the AI support assistant for MediCare NGO, a healthcare nonprofit serving underprivileged communities across India.

Services offered (all FREE):
- Patient support: free consultations, medicine access, specialist referrals
- Volunteer program: open to doctors, students, social workers, logistics
- Mental health helpline: Mon-Sat, 9AM-6PM
- Emergency coordination: 24/7, works with 108 ambulance service

Registration: Fill form on website, team contacts within 24 hours.
Coverage: 12 districts across Gujarat, India.

Rules:
- Be warm, clear, and concise (under 80 words per reply)
- For medical emergencies always say: call 108 immediately
- Never give specific medical diagnoses or prescriptions
- If unsure, say our team will help better — please register via the form`;

function addMsg(text, role) {
  const chatWindow = document.getElementById("chatWindow");
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

function askQuick(q) {
  document.getElementById("chatInput").value = q;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const q = input.value.trim();
  if (!q) return;

  input.value = "";
  addMsg(q, "user");
  sendBtn.disabled = true;

  chatHistory.push({ role: "user", content: q });

  const typing = addMsg("Typing...", "typing");

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${window.GROQ_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          ...chatHistory,
        ],
      }),
    });

    const data = await res.json();
    typing.remove();

    const reply = data.choices[0].message.content;
    addMsg(reply, "bot");

    chatHistory.push({ role: "assistant", content: reply });

    // Keep last 10 turns only
    if (chatHistory.length > 20) chatHistory.splice(0, 2);

  } catch (err) {
    typing.remove();
    addMsg("Connection issue. For urgent help please call 108 or register via the form above.", "bot");
  }

  sendBtn.disabled = false;
  input.focus();
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat();
    });
  }
});
