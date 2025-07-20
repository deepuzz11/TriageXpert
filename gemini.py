import os
import google.generativeai as genai

# --- Configuration ---
# IMPORTANT: Replace with your actual Google AI API key in your environment variables.
# For local development, you can set it directly:
# os.environ['GOOGLE_API_KEY'] = "YOUR_API_KEY"
# However, for production, it's recommended to use environment variables.
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("Warning: GOOGLE_API_KEY environment variable not set.")
    # You might want to raise an exception here in a real application
    # raise ValueError("API key for Google AI is not set!")

try:
    genai.configure(api_key=API_KEY)
except Exception as e:
    print(f"Error configuring Gemini API: {e}")


def generate_explanation_and_suggestion(symptoms: str, category: str) -> str:
    """
    Generates a patient-friendly explanation and suggestion using the Gemini API.

    Args:
        symptoms (str): The patient-reported symptoms.
        category (str): The triage category determined by the NLP model
                        (Emergency, Urgent, or Routine).

    Returns:
        str: A string containing the explanation and suggestion. Returns a
             default message if the API call fails.
    """
    if not API_KEY:
        return "Gemini API key not configured. Cannot generate explanation."

    # Set up the model
    generation_config = {
        "temperature": 0.7,
        "top_p": 1,
        "top_k": 1,
        "max_output_tokens": 2048,
    }

    model = genai.GenerativeModel(model_name="gemini-1.5-flash-latest",
                              generation_config=generation_config)

    prompt_parts = [
        "You are a helpful medical assistant. Based on the following patient symptoms and the assigned triage category, provide a brief, easy-to-understand explanation for the triage level and a clear suggestion for the next steps. Do not provide a diagnosis. Frame the response for a non-medical person.",
        f"Symptoms: \"{symptoms}\"",
        f"Triage Category: \"{category}\"",
        "Explanation and Suggestion:",
    ]

    try:
        response = model.generate_content(prompt_parts)
        return response.text
    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        # Fallback message in case of API error
        if category == "Emergency":
            return "Based on the symptoms provided, immediate medical attention is recommended. Please go to the nearest emergency room or call your local emergency number."
        elif category == "Urgent":
            return "Your symptoms suggest that you should seek medical advice soon. Please contact your doctor's office or an urgent care center within the next 24 hours."
        else:
            return "These symptoms do not appear to require immediate attention. We recommend monitoring them and scheduling an appointment with your primary care physician."

# --- Sample Usage ---
# if __name__ == '__main__':
#     sample_symptoms = "I have a severe headache, dizziness, and blurred vision for the last hour."
#     sample_category = "Emergency"
#     explanation = generate_explanation_and_suggestion(sample_symptoms, sample_category)
#     print(f"--- Gemini Response for {sample_category} ---")
#     print(explanation)
#
#     sample_symptoms_2 = "I've had a mild cough and a runny nose for two days."
#     sample_category_2 = "Routine"
#     explanation_2 = generate_explanation_and_suggestion(sample_symptoms_2, sample_category_2)
#     print(f"\n--- Gemini Response for {sample_category_2} ---")
#     print(explanation_2)