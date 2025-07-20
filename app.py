from flask import Flask, request, jsonify, render_template_string
from config import MODEL_NAME, CACHE_TTL_SECONDS
from nlp import TriageNLP
from cache import InMemoryCache
from scheduler import Scheduler

app = Flask(__name__)
nlp = TriageNLP(MODEL_NAME)
cache = InMemoryCache()
scheduler = Scheduler()

@app.route("/")
def index():
    return render_template_string(open("static/index.html").read())

@app.route("/triage", methods=["POST"])
def triage():
    data = request.json
    symptoms = data.get("symptoms", "")
    result = nlp.predict(symptoms)
    patient_id = data.get("patient_id", "anon")
    cache.set(patient_id, result, CACHE_TTL_SECONDS)
    scheduler.schedule(patient_id, result["category"])
    return jsonify(result)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "cache_stats": cache.stats()})

if __name__ == "__main__":
    app.run(debug=True)
