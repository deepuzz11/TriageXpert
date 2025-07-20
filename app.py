from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, render_template
import nlp
import gemini
from functools import lru_cache

# Flask constructor looks for 'templates' and 'static' folders by default.
# This configuration correctly serves static files like CSS and images.
app = Flask(__name__, static_folder='static', static_url_path='')

# --- Caching Function ---
# LRU Cache stores recent results to prevent redundant API calls, making the app faster.
# The user's entire profile (including a sorted tuple of history items) is used as the key
# to ensure the cache is accurate.
@lru_cache(maxsize=256)
def get_triage_and_explanation(symptoms: str, age: int, gender: str, bmi: float, history: tuple) -> dict:
    """
    A cached function to perform the full NLP and AI analysis pipeline.
    History must be a tuple to be hashable for the cache.
    """
    print(f"--- CACHE MISS: Processing new request for age '{age}', history: '{history}', symptoms: '{symptoms[:30]}...' ---")
    
    # 1. NLP Analysis to get category and keywords
    triage_result = nlp.triage_symptoms(symptoms)
    
    # 2. Prepare user profile for the Gemini AI model
    user_profile = {
        "age": age,
        "gender": gender,
        "bmi": bmi,
        "history": list(history) # Convert tuple back to list for the prompt
    }
    
    # 3. Generate a structured, contextual explanation from Gemini AI
    explanation_data = gemini.generate_structured_explanation(
        user_profile=user_profile,
        symptoms=symptoms,
        category=triage_result['category'],
        keywords=triage_result['keywords']
    )

    # 4. Combine all data into a final response object
    response_data = {
        "triage_category": triage_result['category'],
        "confidence": round(triage_result.get('confidence', 0.0), 2),
        "keywords": triage_result['keywords'],
        "explanation_details": explanation_data
    }
    return response_data

# --- Page Routes ---

@app.route('/')
def home():
    """Serves the main landing page (index.html)."""
    return render_template('index.html')

@app.route('/triage-tool')
def triage_page():
    """Serves the dedicated triage tool page (triage.html)."""
    return render_template('triage.html')

@app.route('/health', methods=['GET'])
def health_check():
    """A simple health check endpoint to confirm the API is running."""
    return jsonify({"status": "ok", "message": "TriageXpert API is running."}), 200
    
# --- Main API Endpoint ---

@app.route('/triage', methods=['POST'])
def handle_triage():
    """Handles the main triage logic, receiving user data from the frontend."""
    data = request.get_json()
    if not data or 'symptoms' not in data:
        return jsonify({"error": "Invalid input. Symptom data is missing."}), 400

    # Extract all data from the modal form
    symptoms = data.get('symptoms', '').strip()
    age = data.get('age')
    gender = data.get('gender')
    height_cm = data.get('height')
    weight_kg = data.get('weight')
    # Convert history list to a sorted tuple to make it a hashable (cacheable)
    history = tuple(sorted(data.get('history', []))) 

    if not all([symptoms, age, gender, height_cm, weight_kg]):
        return jsonify({"error": "Missing required fields (symptoms, age, gender, height, weight)."}), 400

    # Calculate BMI, with error handling for invalid data
    try:
        height_m = float(height_cm) / 100
        bmi = round(float(weight_kg) / (height_m * height_m), 1)
    except (ValueError, TypeError, ZeroDivisionError):
        bmi = 0.0 # Default to 0 if data is invalid

    try:
        # Call the main cached function to get the analysis
        final_response = get_triage_and_explanation(symptoms, int(age), gender, bmi, history)
        return jsonify(final_response), 200
    except Exception as e:
        print(f"An unexpected error occurred in /triage endpoint: {e}")
        return jsonify({"error": "An internal server error occurred while analyzing symptoms."}), 500

if __name__ == '__main__':
    # Runs the Flask app in debug mode for development
    app.run(debug=True, port=5000)