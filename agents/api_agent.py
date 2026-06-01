from tools.api_client import call_api

class APIAgent:
    def fetch(self, url):
        return call_api(url)
