import json
import re
import sys
import os

# Add project root to path so we can import agents
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.base_agent import BaseAgent

router_prompt = """
You are a semantic intent classifier. Analyze the full meaning and context of the user request.
Classify the request into exactly one of these intents:
- GREETING: Simple hellos, pleasantries, asking how the bot is doing.
- CODE: Writing code, programming, debugging scripts, implementing features, fixing exceptions.
- RESEARCH: Fact finding, comparing technologies, searching for news, gathering information.
- REVIEW: Reviewing architecture, giving feedback on designs or systems.
- GENERAL: General advice, planning, unrelated topics (e.g., wedding colors, travel, general planning).

Respond ONLY with a valid JSON object in this format, without any markdown formatting:
{"intent": "<INTENT_NAME>", "confidence": <float>}
"""

router_agent = BaseAgent(role_prompt=router_prompt)

def detect_intent(text: str):
    """
    Returns a tuple of (intent, confidence)
    intent is one of: GREETING, CODE, RESEARCH, REVIEW, GENERAL
    """
    response_text = router_agent.think(text).strip()
    
    # Clean up markdown if the LLM adds it
    response_text = re.sub(r'```json\s*', '', response_text)
    response_text = re.sub(r'```\s*', '', response_text)
    
    try:
        data = json.loads(response_text)
        intent = data.get("intent", "GENERAL").upper()
        confidence = float(data.get("confidence", 0.0))
    except (json.JSONDecodeError, ValueError):
        intent = "GENERAL"
        confidence = 0.0
        
    valid_intents = ["GREETING", "CODE", "RESEARCH", "REVIEW", "GENERAL"]
    if intent not in valid_intents:
        intent = "GENERAL"
        
    # If confidence is below threshold, route to GENERAL
    if confidence < 0.6:
        intent = "GENERAL"
        
    return intent, confidence

def select_agents(intent: str):
    """
    Decide which agents to run based on semantic intent
    """
    if intent == "GREETING":
        return ["research"]

    if intent == "CODE":
        return ["planner", "research", "coder", "critic"]

    if intent == "RESEARCH":
        return ["planner", "research", "critic"]

    if intent == "REVIEW":
        return ["planner", "critic"]

    # GENERAL
    return ["research"]
