from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import re

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from orchestrator.orchestrator_controller import Orchestrator
from ui.nlp_router import detect_intent, select_agents
from agents.formatter_agent import ResponseFormatter
import database as db

app = FastAPI(title="Agentic AI System")
@app.get("/")
def home():
    return {"message":"Backend is running"}

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Orchestrator globally
orchestrator = Orchestrator()
response_formatter = ResponseFormatter()

# --- Pydantic Models ---
class TaskRequest(BaseModel):
    task: str
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str

from typing import Optional

class ChatUpdateRequest(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_favorite: Optional[bool] = None
# --- Endpoints ---

@app.post("/api/signup")
async def signup(req: LoginRequest):
    if req.username and req.password:
        success = db.create_user(req.username, req.password)
        if success:
            return {"status": "success", "message": "Signup successful", "user": {"username": req.username}}
        else:
            raise HTTPException(status_code=400, detail="Username already exists or creation failed")
    raise HTTPException(status_code=400, detail="Missing username or password")

@app.post("/api/login")
async def login(req: LoginRequest):
    if req.username and req.password:
        success = db.verify_user(req.username, req.password)
        if success:
            return {"status": "success", "message": "Login successful", "user": {"username": req.username}}
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    raise HTTPException(status_code=400, detail="Missing username or password")

@app.get("/api/history/{username}")
async def get_history(username: str):
    try:
        # Retrieve recent chats, converting ObjectId to string for JSON serialization
        history = db.get_recent_chats(username, limit=50)
        for h in history:
            h["_id"] = str(h["_id"])
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/{chat_id}")
async def delete_chat(chat_id: str):
    """Deletes a specific chat history record by _id."""
    try:
        success = db.delete_chat(chat_id)
        if success:
            return {"status": "success", "message": "Chat deleted"}
        else:
            raise HTTPException(status_code=404, detail="Chat not found or deletion failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/history/{chat_id}")
async def update_chat(chat_id: str, req: ChatUpdateRequest):
    """Updates chat history metadata like title, is_pinned, is_favorite."""
    try:
        updates = {k: v for k, v in req.dict().items() if v is not None}
        if not updates:
            return {"status": "success", "message": "No fields to update"}
            
        success = db.update_chat(chat_id, updates)
        if success:
            return {"status": "success", "message": "Chat updated"}
        else:
            raise HTTPException(status_code=404, detail="Chat not found or update failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/task")
async def run_task(req: TaskRequest):
    user_task = req.task
    if not user_task or not user_task.strip():
        raise HTTPException(status_code=400, detail="Task cannot be empty")
        
    try:
        intent, confidence = detect_intent(user_task)
        agents = select_agents(intent)
        outputs = {}

        if intent == "GREETING":
            greet = orchestrator.research.run(user_task)
            final_answer = greet or "👋 Hi! How can I help you today?"
            
            chat_id = db.save_chat_history(
                user_id=req.username,
                prompt=user_task,
                agent="research",
                response=final_answer
            )
            return {
                "intent": intent,
                "agents": agents,
                "outputs": {},
                "final_answer": final_answer,
                "is_code": False,
                "chat_id": chat_id
            }

        else:
            if "planner" in agents:
                outputs["planner"] = orchestrator.planner.think(user_task)

            if "research" in agents:
                outputs["research"] = orchestrator.research.run(user_task)

            if "coder" in agents:
                outputs["coder"] = orchestrator.coder.think(user_task)

            if "critic" in agents:
                base = outputs.get("coder") or outputs.get("planner") or outputs.get("research")
                
                # Trim critic function
                critic_text = orchestrator.critic.think(base)
                if not critic_text:
                    outputs["critic"] = "No critic feedback available."
                else:
                    lines = [line.strip() for line in critic_text.splitlines() if line.strip()]
                    outputs["critic"] = "\n".join(lines[:6])

            # Determine Final Answer
            final_answer = ""
            is_code = False  # Always False so ReactMarkdown renders the formatted explanations and code blocks
            
            if intent == "CODE" and "coder" in outputs:
                final_answer = outputs["coder"].strip()
                # Do not strip code blocks, let markdown render them
            else:
                final_answer = outputs.get("planner") or outputs.get("research") or ""

            # Apply the ResponseFormatter layer
            if final_answer:
                final_answer = response_formatter.format_response(final_answer)
            # Save to Database
            agents_str = ", ".join(agents)
            chat_id = db.save_chat_history(
                user_id=req.username,
                prompt=user_task,
                agent=agents_str,
                response=final_answer
            )

            return {
                "intent": intent,
                "agents": agents,
                "outputs": outputs,
                "final_answer": final_answer,
                "is_code": is_code,
                "chat_id": chat_id
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
