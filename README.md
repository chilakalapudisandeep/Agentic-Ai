# Agentic AI System

A multi-agent AI system that processes user prompts using specialized AI agents.
The system includes a modern React frontend and a Python FastAPI backend orchestrating multiple intelligent agents.

## 🚀 Project Overview

This project demonstrates an **Agentic AI architecture** where different AI agents collaborate to solve user queries.

Each agent has a specific responsibility such as planning, researching, coding, and reviewing results.

The system uses:

* React frontend (Vite)
* FastAPI backend
* Multi-agent architecture
* NLP routing
* Modular agent system

---

## 🧠 Architecture

User Prompt → NLP Router → Planner Agent → Research Agent → Coder Agent → Critic Agent → Final Response

Agents communicate through a central **Orchestrator Controller**.

---

## 🤖 Agents in the System

### Planner Agent

Breaks the user prompt into actionable steps.

### Research Agent

Fetches relevant information using APIs and knowledge sources.

### Coder Agent

Generates code or solutions based on the research.

### Critic Agent

Reviews and improves the generated response.

---

## 📁 Project Structure

```
Agentic-AI-System
│
├── agents
│   ├── planner_agent.py
│   ├── research_agent.py
│   ├── coder_agent.py
│   ├── critic_agent.py
│   └── base_agent.py
│
├── orchestrator
│   └── orchestrator_controller.py
│
├── ui
│   └── nlp_router.py
│
├── frontend
│   ├── src
│   ├── components
│   └── vite.config.js
│
├── api.py
├── database.py
├── requirements.txt
└── README.md
```

---

## ⚙️ Backend Setup

### Install dependencies

```
pip install -r requirements.txt
```

### Run FastAPI server

```
uvicorn api:app --reload
```

Backend will start at:

```
http://localhost:8000
```

---

## 💻 Frontend Setup

Go to frontend folder:

```
cd frontend
```

Install dependencies:

```
npm install
```

Run React app:

```
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## 🔌 Tech Stack

Frontend:

* React
* Vite
* CSS

Backend:

* Python
* FastAPI
* LangChain
* OpenAI API

Database (optional):

* MongoDB Atlas

---

## ✨ Features

* Multi-agent AI system
* Modular architecture
* NLP prompt routing
* Modern React interface
* Extensible agent framework
* Backend API integration

---

## 📌 Future Improvements

* Add memory with MongoDB
* Add authentication
* Deploy frontend and backend
* Add agent visualization
* Add streaming responses

---

## 👨‍💻 Author

Developed as an AI systems project demonstrating **Agentic AI architecture and multi-agent orchestration**.
