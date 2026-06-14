import json
import os
import google.generativeai as genai

class DummyResult:
    def __init__(self, raw):
        self.raw = raw
    def __str__(self):
        return self.raw

class DummyStudentReportCrew:
    def __init__(self, company_name):
        self.company_name = company_name
    def kickoff(self):
        # Return a dummy JSON for the PDF report
        data = {
            "company_name": self.company_name,
            "trust_score": 85,
            "pros": ["Good learning curve", "Flexible hours"],
            "cons": ["Fast paced", "Low stipend"],
            "verdict": "Great for early career."
        }
        return DummyResult(json.dumps(data))

def build_student_report_crew(company_name: str):
    return DummyStudentReportCrew(company_name)

class DummyComparatorCrew:
    def __init__(self, company_list):
        self.company_list = company_list
    def kickoff(self):
        return DummyResult("{}")

def build_comparator_crew(company_list: list):
    return DummyComparatorCrew(company_list)

class DummyChatCrew:
    def __init__(self, user_message):
        self.user_message = user_message
        
    def kickoff(self):
        # We read the key directly or from env
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            ddgs_data = ""
            if "intern" in self.user_message.lower() or "job" in self.user_message.lower() or "startup" in self.user_message.lower():
                try:
                    from duckduckgo_search import DDGS
                    ddg = DDGS()
                    res = list(ddg.text("internships OR startups " + self.user_message, max_results=3))
                    ddgs_data = "Here are some search results: " + json.dumps(res)
                except:
                    pass
                    
            sys_prompt = "You are Student Hub AI Manager. Assist students in finding internships, reviewing startups. When you find job listings or internships, you MUST output them in a special format at the end of your response like this: [COMPANY_CARD: {\"title\": \"Job Title\", \"company\": \"Company Name\", \"url\": \"Link\", \"stipend\": \"Varies\"}] so the frontend can render them as cards. \n" + ddgs_data
            
            try:
                response = model.generate_content(f"{sys_prompt}\nUser request: {self.user_message}")
                return DummyResult(response.text)
            except Exception as e:
                return DummyResult(f"Error generating response: {e}")
        else:
            return DummyResult("I am unable to process your request as the Gemini API key is missing.")

def build_chat_crew(user_message: str):
    return DummyChatCrew(user_message)

class DummyCompanyInsightsCrew:
    def __init__(self, company_name):
        self.company_name = company_name

    def kickoff(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            ddgs_data = ""
            try:
                from duckduckgo_search import DDGS
                ddg = DDGS()
                res = list(ddg.text(f"{self.company_name} company reviews and salary", max_results=3))
                ddgs_data = "Here are some search results: " + json.dumps(res)
            except:
                pass
                
            sys_prompt = f"You are a Company Insights Bot. The user is asking for insights about {self.company_name}. " \
                         "Analyze the provided search results and output a JSON object containing two keys: " \
                         "'reviews' (a list of 3 mock/summarized reviews based on data, each having 'rating', 'title', 'description', 'author_role') " \
                         "and 'salary_guide' (a list of 3 roles with 'role', 'average_salary', 'range'). " \
                         "Do NOT use markdown blocks, just raw JSON. \n" + ddgs_data
            
            try:
                response = model.generate_content(sys_prompt)
                
                text = response.text.strip()
                if text.startswith('```json'): text = text[7:]
                if text.startswith('```'): text = text[3:]
                if text.endswith('```'): text = text[:-3]
                
                return DummyResult(text.strip())
            except Exception as e:
                return DummyResult(json.dumps({"error": str(e)}))
        else:
            return DummyResult(json.dumps({"error": "Gemini API key missing."}))

def build_company_insights_crew(company_name: str):
    return DummyCompanyInsightsCrew(company_name)
