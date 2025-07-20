from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, render_template
import nlp
import gemini
from functools import lru_cache

app = Flask(__name__, static_folder='static', static_url_path='')

# The Main Caching Function - now takes a tuple of history items to be cacheable
@lru_cache(maxsize=256)
def get_triage_and_explanation(symptoms: str, language: str, age: int, gender: str, bmi: float, history: tuple) -> dict:
    """
    A cached function to perform the full pipeline.
    History must be a tuple to be hashable for the cache.
    """
    print(f"--- CACHE MISS: Processing new request for age '{age}', symptoms: '{symptoms[:30]}...' ---")
    
    # 1. NLP Analysis
    triage_result = nlp.triage_symptoms(symptoms)
    
    # 2. Prepare user profile for Gemini
    user_profile = {
        "age": age,
        "gender": gender,
        "bmi": bmi,
        "history": list(history) # Convert tuple back to list for Gemini prompt
    }
    
    # 3. Generate structured explanation from Gemini
    explanation_data = gemini.generate_structured_explanation(
        user_profile=user_profile,
        symptoms=symptoms,
        category=triage_result['category'],
        keywords=triage_result['keywords'],
        language=language
    )

    # 4. Combine all data for the final response
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
    """Serves the main landing page."""
    return render_template('index.html')

@app.route('/triage-tool')
def triage_page():
    """Serves the dedicated triage tool page."""
    return render_template('triage.html')

# --- API Endpoint ---

@app.route('/triage', methods=['POST'])
def handle_triage():
    """Handles the main triage logic with the new detailed user info."""
    data = request.get_json()
    if not data or 'symptoms' not in data:
        return jsonify({"error": "Invalid input."}), 400

    # Extract all new data from the modal form
    symptoms = data.get('symptoms', '').strip()
    language = data.get('language', 'en').lower()
    age = data.get('age')
    gender = data.get('gender')
    height_cm = data.get('height')
    weight_kg = data.get('weight')
    # Convert history list to a sorted tuple to make it a hashable type for the cache
    history = tuple(sorted(data.get('history', []))) 

    if not all([symptoms, age, gender, height_cm, weight_kg]):
        return jsonify({"error": "Missing required fields (symptoms, age, gender, height, weight)."}), 400

    # Calculate BMI
    try:
        height_m = float(height_cm) / 100
        bmi = round(float(weight_kg) / (height_m * height_m), 1)
    except (ValueError, TypeError, ZeroDivisionError):
        bmi = 0.0 # Handle case where data is invalid

    try:
        final_response = get_triage_and_explanation(symptoms, language, int(age), gender, bmi, history)
        return jsonify(final_response), 200
    except Exception as e:
        print(f"An unexpected error occurred in /triage endpoint: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)