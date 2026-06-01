from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("MODEL", "llama-3.3-70b-versatile")


if not GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY not found in env variables")

client = Groq(api_key=GROQ_API_KEY)

class BaseAgent:
    def __init__(self, role_prompt):
        self.role_prompt = role_prompt

    def think(self, task):
        messages = [
            {"role": "system", "content": self.role_prompt},
            {"role": "user", "content": task}
        ]

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=1500,
            top_p=0.9
        )

        return response.choices[0].message.content.strip()
