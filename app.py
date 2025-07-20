from flask import Flask, request, jsonify, render_template
import nlp
import gemini

# Initialize the Flask application
app = Flask(__name__, static_folder='static', static_url_path='')

@app.route('/')
def index():
    """
    Serves the main HTML page.
    """
    return render_template('index.html')

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    return jsonify({"status": "ok", "message": "TriageXpert API is running."}), 200

@app.route('/triage', methods=['POST'])
def handle_triage():
    """
    Handles the main triage logic.
    Accepts patient symptoms, classifies them, and gets an explanation from Gemini.
    """
    # 1. Get data from the request
    data = request.get_json()
    if not data or 'symptoms' not in data:
        return jsonify({"error": "Invalid input. 'symptoms' field is required."}), 400

    symptoms = data['symptoms']
    if not symptoms.strip():
        return jsonify({"error": "'symptoms' field cannot be empty."}), 400

    # 2. Perform NLP triage classification
    try:
        triage_result = nlp.triage_symptoms(symptoms)
        category = triage_result['category']
        confidence = triage_result['confidence']
    except Exception as e:
        # Log the exception e in a real application
        return jsonify({"error": "An error occurred during triage classification."}), 500

    # 3. Generate explanation and suggestions using Gemini API
    try:
        explanation = gemini.generate_explanation_and_suggestion(symptoms, category)
    except Exception as e:
        # Log the exception e in a real application
        explanation = "Could not generate an explanation at this time. Please follow standard medical advice for your determined triage category."

    # 4. Construct and return the final response
    response_data = {
        "triage_category": category,
        "confidence": round(confidence, 2),
        "explanation_suggestion": explanation
    }

    return jsonify(response_data), 200

if __name__ == '__main__':
    # Running the app
    # For production, use a WSGI server like Gunicorn or Waitress
    # Example: gunicorn --bind 0.0.0.0:5000 app:app
    app.run(debug=True, port=5000)