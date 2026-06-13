import os

def get_llm_config(provider: str):
    if provider == "groq" and os.getenv("GROQ_API_KEY"):
        from langchain_groq import ChatGroq
        return ChatGroq(temperature=0, model="llama3-8b-8192", api_key=os.getenv("GROQ_API_KEY"))
    elif provider == "nvidia" and os.getenv("NVIDIA_API_KEY"):
        from langchain_nvidia_ai_endpoints import ChatNVIDIA
        return ChatNVIDIA(model="meta/llama3-70b-instruct", api_key=os.getenv("NVIDIA_API_KEY"))
    else:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GEMINI_API_KEY"))
