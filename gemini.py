import os
import google.generativeai as genai
import json
from typing import Dict, Any, List

# --- Configuration ---
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("Warning: GOOGLE_API_KEY environment variable not set.")
try:
    genai.configure(api_key=API_KEY)
except Exception as e:
    print(f"Error configuring Gemini API: {e}")

def generate_structured_explanation(
    user_profile: Dict[str, Any], 
    symptoms: str, 
    category: str, 
    keywords: List[str], 
    language: str = "en"
) -> Dict[str, Any]:
    """
    Generates a highly contextual, structured, multi-lingual explanation.
    """
    if not API_KEY:
        return {
            "error": "Gemini API key not configured.",
            "explanation": "Cannot generate explanation.", "home_care_suggestions": None, "when_to_worry": None, "next_steps": None
        }

    generation_config = {
        "temperature": 0.5,
        "top_p": 1,
        "top_k": 1,
        "max_output_tokens": 2048,
        "response_mime_type": "application/json",
    }

    model = genai.GenerativeModel(model_name="gemini-1.5-flash-latest", generation_config=generation_config)
    
    lang_map = {"en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "ml": "Malayalam", "kn": "Kannada"}
    output_language = lang_map.get(language, "English")

    prompt = f"""
    You are an expert medical pre-screening assistant for a tool in India. Your goal is to provide a calm, structured, and context-aware response for a non-medical user based on their complete profile.

    **CRITICAL INSTRUCTION:** Your analysis MUST be influenced by the user's profile. For example, chest pain in an older patient with hypertension is more critical than in a young, healthy patient. Mention the context if relevant (e.g., "Given your age and history of..."). DO NOT diagnose.

    **Patient's Full Profile:**
    - Age: {user_profile.get('age', 'Not provided')}
    - Gender: {user_profile.get('gender', 'Not provided')}
    - Body Mass Index (BMI): {user_profile.get('bmi', 'Not calculated')}
    - Pre-existing Conditions: {', '.join(user_profile.get('history', [])) if user_profile.get('history') else 'None reported'}
    - Symptoms Reported: "{symptoms}"
    - Key Symptoms Identified by NLP: {", ".join(keywords) if keywords else "N/A"}
    - Assigned Triage Category: "{category}"

    **Your Instructions:**
    1.  **Language:** Generate the entire response in **{output_language}**.
    2.  **Format:** Respond with a valid JSON object with the exact following keys:
        - "explanation": (String) A brief explanation for the '{category}' triage level, referencing the user's profile and symptoms.
        - "home_care_suggestions": (String or null) If category is 'Routine', provide 2-3 simple home care tips relevant to the symptoms. Otherwise, null.
        - "when_to_worry": (String) A clear, bulleted or numbered list of specific signs that should prompt the user to seek immediate medical attention.
        - "next_steps": (String) A clear, actionable suggestion for what to do next.

    **JSON Response Template:**
    {{
        "explanation": "...", "home_care_suggestions": "...", "when_to_worry": "...", "next_steps": "..."
    }}
    """

    try:
        response = model.generate_content([prompt])
        return json.loads(response.text)
    except Exception as e:
        print(f"Error during Gemini API call or JSON parsing: {e}")
        return {
            "explanation": "Could not generate a detailed explanation. Please follow standard medical advice for your determined triage category.",
            "home_care_suggestions": None,
            "when_to_worry": "If symptoms worsen, please seek help.",
            "next_steps": "Consult a medical professional."
        }