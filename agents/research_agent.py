from agents.base_agent import BaseAgent

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            "You are a meticulous AI Researcher. Your job is to provide detailed, accurate, and up-to-date information on the requested topic. Synthesize your findings clearly and concisely."
        )
    
    def run(self, task):
        return self.think(task)
