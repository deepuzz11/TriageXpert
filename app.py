from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, render_template
import nlp
import gemini
from functools import lru_cache
import os

# Flask constructor looks for 'templates' and 'static' folders by default
app = Flask(__name__, static_folder='static', static_url_path='')

# --- Caching Function ---
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

@app.route('/health-hub')
def health_hub():
    """Serves the preventive health hub page."""
    return render_template('health-hub.html')

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
    # Convert history list to a sorted tuple to make it hashable (cacheable)
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

# --- Health Hub API Endpoint ---

@app.route('/api/health-tips/<category>')
def get_health_tips(category):
    """API endpoint for dynamic health tips loading."""
    health_data = {
        'monsoon': {
            'sections': [
                {
                    'name': 'Dengue Prevention',
                    'icon': '🦟',
                    'tips': [
                        'Remove stagnant water from containers and plant pots',
                        'Use mosquito nets during dawn and dusk hours',
                        'Wear long-sleeved clothing when outdoors',
                        'Apply mosquito repellent on exposed skin',
                        'Seek medical help for high fever with body aches'
                    ]
                },
                {
                    'name': 'Malaria Prevention',
                    'icon': '🛏️',
                    'tips': [
                        'Sleep under insecticide-treated bed nets',
                        'Ensure proper drainage around living areas',
                        'Use approved mosquito repellents regularly',
                        'Take antimalarial medication for high-risk areas',
                        'Get tested immediately for persistent fever'
                    ]
                },
                {
                    'name': 'Water-borne Disease Prevention',
                    'icon': '💧',
                    'tips': [
                        'Drink only boiled or properly purified water',
                        'Avoid street food during monsoon season',
                        'Wash hands with soap for 20 seconds frequently',
                        'Store water in clean, covered containers',
                        'Use ORS solution for diarrhea treatment'
                    ]
                }
            ]
        },
        'heart': {
            'sections': [
                {
                    'name': 'Blood Pressure Control',
                    'icon': '❤️',
                    'tips': [
                        'Limit salt intake to maximum 5 grams daily',
                        'Include potassium-rich foods like bananas',
                        'Practice yoga and meditation for 30 minutes',
                        'Monitor blood pressure regularly at home',
                        'Maintain healthy BMI between 18.5-24.9'
                    ]
                },
                {
                    'name': 'Cholesterol Management',
                    'icon': '🥗',
                    'tips': [
                        'Cook with healthy oils like olive or mustard oil',
                        'Eat fiber-rich foods including oats and lentils',
                        'Include fish in diet twice weekly',
                        'Avoid trans fats and processed foods',
                        'Get annual lipid profile testing after age 30'
                    ]
                },
                {
                    'name': 'Exercise & Stress Relief',
                    'icon': '🧘',
                    'tips': [
                        'Walk briskly for minimum 30 minutes daily',
                        'Practice pranayama breathing exercises',
                        'Engage in swimming or cycling regularly',
                        'Maintain proper work-life balance',
                        'Get 7-8 hours of quality sleep nightly'
                    ]
                }
            ]
        },
        'diabetes': {
            'sections': [
                {
                    'name': 'Low-Glycemic Nutrition',
                    'icon': '🌾',
                    'tips': [
                        'Choose whole grains: brown rice, ragi, quinoa',
                        'Fill half your plate with non-starchy vegetables',
                        'Select low-GI fruits like apples and oranges',
                        'Eliminate sugary drinks and processed snacks',
                        'Practice portion control with smaller meals'
                    ]
                },
                {
                    'name': 'Weight Management',
                    'icon': '⚖️',
                    'tips': [
                        'Target BMI between 18.5-22.9 for Indians',
                        'Monitor waist size: men <90cm, women <80cm',
                        'Practice mindful eating and slow chewing',
                        'Drink 8-10 glasses of water daily',
                        'Prioritize 7-8 hours of restful sleep'
                    ]
                },
                {
                    'name': 'Physical Activity',
                    'icon': '🏃',
                    'tips': [
                        'Exercise minimum 150 minutes weekly',
                        'Combine aerobic and strength training',
                        'Take stairs instead of elevators',
                        'Practice traditional surya namaskara',
                        'Monitor blood glucose if at high risk'
                    ]
                }
            ]
        }
    }
    return jsonify(health_data.get(category, {}))

if __name__ == '__main__':
    # Runs the Flask app in debug mode for development
    app.run(debug=True, port=5000)
