import os
import google.generativeai as genai
from typing import Dict, List

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class GeminiHealthAnalyzer:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_structured_explanation(self, user_profile: Dict, symptoms: str, category: str, keywords: List[str]) -> Dict:
        """Generate a comprehensive health explanation using Gemini AI."""
        
        prompt = f"""
        You are a medical AI assistant. Analyze the following patient information and provide a structured health assessment:

        Patient Profile:
        - Age: {user_profile.get('age', 'Unknown')}
        - Gender: {user_profile.get('gender', 'Unknown')}
        - BMI: {user_profile.get('bmi', 'Unknown')}
        - Medical History: {', '.join(user_profile.get('history', [])) if user_profile.get('history') else 'None reported'}

        Reported Symptoms: {symptoms}
        
        Preliminary Triage Category: {category}
        Identified Keywords: {', '.join(keywords)}

        Please provide a JSON response with the following structure:
        {{
            "summary": "Brief 2-3 sentence summary of the condition",
            "urgency_level": "{category}",
            "potential_conditions": ["condition1", "condition2", "condition3"],
            "immediate_actions": ["action1", "action2", "action3"],
            "red_flags": ["flag1", "flag2"],
            "follow_up_recommendations": ["recommendation1", "recommendation2"],
            "lifestyle_advice": ["advice1", "advice2", "advice3"],
            "when_to_seek_help": "Description of when immediate medical attention is needed",
            "disclaimer": "Medical disclaimer text"
        }}

        Important: 
        - This is for informational purposes only, not medical diagnosis
        - Always recommend consulting healthcare professionals
        - Be specific to Indian healthcare context where relevant
        - Consider age and BMI in recommendations
        """

        try:
            response = self.model.generate_content(prompt)
            # Parse the JSON response
            import json
            
            # Clean the response text
            response_text = response.text.strip()
            if response_text.startswith('```'):
                response_text = response_text[7:-3]
            elif response_text.startswith('```'):
                response_text = response_text[3:-3]
            
            parsed_response = json.loads(response_text)
            return parsed_response
            
        except Exception as e:
            print(f"Error with Gemini API: {e}")
            # Fallback response
            return self._get_fallback_response(category, symptoms)
    
    def _get_fallback_response(self, category: str, symptoms: str) -> Dict:
        """Provide a fallback response if Gemini API fails."""
        fallback_responses = {
            'Emergency': {
                "summary": "Your symptoms suggest a potentially serious condition that requires immediate medical attention.",
                "urgency_level": "Emergency",
                "potential_conditions": ["Acute condition requiring immediate care"],
                "immediate_actions": ["Call emergency services immediately", "Go to nearest emergency room", "Do not delay seeking help"],
                "red_flags": ["Severe symptoms", "Rapid onset"],
                "follow_up_recommendations": ["Emergency medical evaluation"],
                "lifestyle_advice": ["Follow emergency protocols"],
                "when_to_seek_help": "Seek immediate emergency medical care",
                "disclaimer": "This is not a medical diagnosis. Seek immediate professional medical help."
            },
            'Urgent': {
                "summary": "Your symptoms indicate a condition that should be evaluated by a healthcare provider soon.",
                "urgency_level": "Urgent",
                "potential_conditions": ["Condition requiring medical evaluation"],
                "immediate_actions": ["Contact your doctor", "Consider urgent care visit", "Monitor symptoms"],
                "red_flags": ["Worsening symptoms", "New concerning symptoms"],
                "follow_up_recommendations": ["Medical evaluation within 24-48 hours"],
                "lifestyle_advice": ["Rest", "Stay hydrated", "Avoid strenuous activities"],
                "when_to_seek_help": "Contact healthcare provider if symptoms worsen",
                "disclaimer": "This is not a medical diagnosis. Consult a healthcare professional for proper evaluation."
            },
            'Routine': {
                "summary": "Your symptoms appear to be non-urgent but should still be monitored.",
                "urgency_level": "Routine",
                "potential_conditions": ["Common condition", "Self-limiting illness"],
                "immediate_actions": ["Rest and self-care", "Monitor symptoms", "Stay hydrated"],
                "red_flags": ["Symptoms getting worse", "Fever developing"],
                "follow_up_recommendations": ["Schedule routine appointment if symptoms persist"],
                "lifestyle_advice": ["Adequate rest", "Proper nutrition", "Stay hydrated"],
                "when_to_seek_help": "Contact healthcare provider if symptoms persist beyond a week",
                "disclaimer": "This is not a medical diagnosis. Consult a healthcare professional if you have concerns."
            }
        }
        
        return fallback_responses.get(category, fallback_responses['Routine'])

# Initialize the analyzer
health_analyzer = GeminiHealthAnalyzer()

def generate_structured_explanation(user_profile: Dict, symptoms: str, category: str, keywords: List[str]) -> Dict:
    """Main function to generate health explanation."""
    return health_analyzer.generate_structured_explanation(user_profile, symptoms, category, keywords)
