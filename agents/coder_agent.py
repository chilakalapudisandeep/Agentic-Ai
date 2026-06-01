from agents.base_agent import BaseAgent

class CoderAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            "You are an expert AI Software Engineer. Your job is to write clean, efficient, and well-documented source code in response to the user's task. Focus primarily on providing accurate code solutions."
        )
