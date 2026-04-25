# 🧠 HealthGuard AI

### AI-Based Early Disease Detection for Everyone

HealthGuard AI is a full-stack healthcare web application that leverages intelligent symptom analysis to predict possible diseases, assess risk levels, and provide actionable health insights. The system is designed to simulate real-world clinical reasoning and assist users in early health awareness.

---

## 🚀 Live Demo

🔗 (https://innovative-healthgaurd-ai.vercel.app/) *(update with your actual URL)*

---

## 📌 Features

### 🩺 Symptom-Based Disease Prediction

* Input symptoms using a structured form
* Get **top 3 possible conditions (ranked)**
* Probability-based results (not random guesses)

---

### 🧠 Smart AI Chatbot (MediBot)

* Interactive chatbot for symptom analysis
* Asks follow-up questions like a doctor
* Provides structured diagnosis with explanation

---

### 📊 Health Analytics Dashboard

* View past diagnosis history
* Health score visualization
* Track symptom trends over time

---

### 👤 Personalized Health Profile

* Store user details (age, gender, history)
* Improves prediction accuracy

---

### ⚠️ Smart Risk Detection

* Detects high-risk symptoms (e.g., chest pain)
* Suggests immediate medical attention

---

### 📈 Explainable AI

* Shows reasoning behind predictions
* Example: *“Based on fever, cough, and fatigue”*

---

### 🌐 Multi-Language Support

* Supports English + Hindi (expandable)

---

## 🧱 Tech Stack

### Frontend

* Next.js (App Router)
* Tailwind CSS

### Backend

* Next.js API Routes (Node.js)

### Database

* SQLite (via Prisma ORM)

### AI Logic

* Rule-based clinical reasoning engine
* LLM-ready architecture (OpenAI integration planned)

---

## 🗂️ Project Structure

```
/app
  /symptoms
  /results
  /dashboard
  /profile
  /api

/components
/lib
/prisma
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/HealthGaurd-AI.git
cd HealthGaurd-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run the project

```bash
npm run dev
```

---

## 🌍 Deployment

The project is deployed using **Vercel** for seamless serverless hosting.

---

## 🧠 How It Works

1. User inputs symptoms
2. System asks follow-up questions
3. Diagnosis engine processes:

   * Symptom combinations
   * Severity & duration
4. Returns:

   * Top 3 possible diseases
   * Risk level
   * Recommendations

---

## ⚠️ Disclaimer

This application is intended for **educational purposes only**.
It does not provide medical advice. Always consult a qualified healthcare professional.

---

## 🔮 Future Enhancements

* Integration with real ML models (Random Forest, NLP)
* OpenAI-powered intelligent chatbot
* Cloud database (MongoDB / PostgreSQL)
* Real-time doctor consultation system
* Mobile app version

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the repo and submit a pull request.

---

## 👨‍💻 Author

**Manish Chaudhury**

* Full-Stack Developer (PHP Laravel + MERN + Python)
* Passionate about AI & Techologies

---

## ⭐ Support

If you like this project, please ⭐ the repository!

---
