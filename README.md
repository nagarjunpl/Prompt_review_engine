# 🚀 Prompt Review Engine  

A web app that validates prompts using the **COSTAR framework** (Context, Objective, Style, Tone, Audience, Response). It reviews user input, applies rule-based checks, and returns a verdict — **ALLOW / NEEDS FIX / BLOCK** — along with suggestions for improving clarity and safety.  

---

## ✨ Features  
- 📝 **Prompt Analysis** – Breaks down input into COSTAR elements  
- ✅ **Verdict System** – ALLOW / NEEDS FIX / BLOCK  
- 🔧 **Suggestions** – Auto-recommend missing COSTAR fields  
- 💾 **Database Support** – Stores prompts, verdicts, and corrections (SQL backend)  
- 🔌 **LLM Broker** – Forward only ALLOW prompts to an LLM (ChatGPT, DeepSeek, etc.)  
- 🎨 **Frontend UI** – Responsive design with animations  
- 📊 **Graph Insights** – Track statistics of prompt verdicts  

---

## 🛠️ Tech Stack  
- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Flask (Python)  
- **Database**: SQLite / MySQL  
- **Visualization**: Chart.js (for verdict statistics)  

---

## 📂 Project Structure  
```
prompt-review-engine/
│── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
│── backend/
│   ├── app.py         # Flask server
│   ├── rules.py       # Rule engine for COSTAR
│   ├── models.py      # SQL database models
│   └── database.db    # SQLite database (or MySQL config)
│
│── README.md
│── requirements.txt
```

---

## ⚡ Installation  

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your-username/prompt-review-engine.git
   cd prompt-review-engine
   ```

2. **Create & activate virtual environment**  
   ```bash
   python -m venv venv
   source venv/bin/activate   # Mac/Linux
   venv\Scripts\activate      # Windows
   ```

3. **Install dependencies**  
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Flask backend**  
   ```bash
   python backend/app.py
   ```

5. **Open frontend**  
   Open `frontend/index.html` in your browser.  

---

## 🎮 Usage  
1. Enter your prompt in the text area.  
2. The system checks for **COSTAR elements**.  
3. Verdict appears:  
   - ✅ ALLOW – Forwarded to LLM (ChatGPT, DeepSeek, etc.)  
   - ⚠️ NEEDS FIX – Suggestions are shown  
   - ⛔ BLOCK – Prompt is rejected for safety reasons  
4. Check live statistics in the bottom graph.  

---

## 📊 Example  

**Input Prompt:**  
> "Write a professional email to my boss."  

**Output Verdict:**  
- Context ❌ Missing  
- Objective ✅ Present  
- Style ✅ Present  
- Tone ✅ Present  
- Audience ✅ Present  
- Response ❌ Missing  

**Suggested Fix:**  
> "Context: I need to inform my boss about a project delay.  
> Objective: Write an email.  
> Style: Professional.  
> Tone: Respectful.  
> Audience: My boss.  
> Response: A well-structured draft email."  

---

## 🚧 Roadmap  
- [ ] Add NLP for smarter COSTAR detection  
- [ ] User authentication system  
- [ ] Export prompts + corrections as CSV/JSON  
- [ ] Multi-LLM integration (ChatGPT, DeepSeek, Gemini)  
- [ ] Deploy on Docker + cloud hosting  

---

## 🤝 Contributing  
Pull requests are welcome. For major changes, open an issue first to discuss what you’d like to change.  

---

## 📜 License  
MIT License © 2025  Prompt Review Engine
