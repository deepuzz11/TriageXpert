import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, Any, List
import spacy
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk
import re

# --- Model and Analyzer Loading ---

# 1. ClinicalBERT Model for Triage Classification
MODEL_NAME = "medicalai/ClinicalBERT-v1"
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3)
    model.eval()
    print("ClinicalBERT model loaded successfully.")
    MODEL_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not load ClinicalBERT model. Using rule-based fallback. Error: {e}")
    MODEL_AVAILABLE = False
    tokenizer = None
    model = None

# 2. spaCy Model for NLP tasks like Named Entity Recognition (Keywords)
try:
    nlp_spacy = spacy.load("en_core_web_sm")
    print("spaCy model loaded successfully.")
except OSError:
    print("Warning: spaCy 'en_core_web_sm' model not found. Keyword extraction will be limited.")
    nlp_spacy = None

# 3. NLTK VADER for Sentiment/Intensity Analysis
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
    sid = SentimentIntensityAnalyzer()
    print("NLTK VADER loaded successfully.")
except LookupError:
    print("NLTK 'vader_lexicon' not found, downloading now...")
    nltk.download('vader_lexicon')
    sid = SentimentIntensityAnalyzer()
    print("NLTK VADER loaded successfully after download.")


# --- Rule-Based Fallback ---
EMERGENCY_KEYWORDS = [
    "chest pain", "crushing", "shortness of breath", "difficulty breathing",
    "unconscious", "not responsive", "seizure", "stroke", "severe bleeding",
    "head injury", "vision loss", "numbness one side", "paralysis"
]
URGENT_KEYWORDS = [
    "fever", "vomiting", "diarrhea", "abdominal pain", "migraine",
    "bad headache", "dehydration", "sprain", "minor cut", "rash",
    "earache", "painful urination"
]


def analyze_symptom_details(symptoms: str) -> Dict[str, Any]:
    """
    Extracts key symptoms and detects intensity from the text.
    Uses spaCy for keyword extraction and NLTK for intensity.
    """
    keywords = set()
    intensity_score = 0.0

    if nlp_spacy:
        doc = nlp_spacy(symptoms.lower())
        # Use noun chunks to get more meaningful keywords (e.g., "stomach ache" instead of "stomach", "ache")
        for chunk in doc.noun_chunks:
            clean_chunk = re.sub(r'\b(a|an|the|my|his|her)\b', '', chunk.text).strip()
            if len(clean_chunk) > 2:
                keywords.add(clean_chunk)

    if sid:
        intensity_score = sid.polarity_scores(symptoms)['compound']

    return {"keywords": list(keywords), "intensity_score": intensity_score}


def classify_symptoms_bert(symptoms: str) -> Dict[str, Any]:
    """ Classifies symptoms using the ClinicalBERT model. """
    if not MODEL_AVAILABLE:
         raise EnvironmentError("ClinicalBERT model is not available.")
    inputs = tokenizer(symptoms, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
    probabilities = torch.nn.functional.softmax(logits, dim=-1)
    confidence, predicted_class_id = torch.max(probabilities, dim=-1)
    
    # Mapping model output (0, 1, 2) to our defined categories
    category_map = {0: "Routine", 1: "Urgent", 2: "Emergency"}
    category = category_map.get(predicted_class_id.item(), "Routine") # Default to Routine
    return {"category": category, "confidence": confidence.item()}


def classify_symptoms_rule_based(symptoms: str) -> Dict[str, Any]:
    """ Fallback rule-based triage classification if the BERT model fails to load. """
    symptoms_lower = symptoms.lower()
    if any(keyword in symptoms_lower for keyword in EMERGENCY_KEYWORDS):
        return {"category": "Emergency", "confidence": 0.95}
    if any(keyword in symptoms_lower for keyword in URGENT_KEYWORDS):
        return {"category": "Urgent", "confidence": 0.85}
    return {"category": "Routine", "confidence": 0.75}


def triage_symptoms(symptoms: str) -> Dict[str, Any]:
    """
    Main triage function combining classification with detailed analysis.
    It tries to use the advanced AI model first, and if not available, uses the simpler rule-based system.
    """
    if MODEL_AVAILABLE:
        try:
            classification_result = classify_symptoms_bert(symptoms)
        except Exception as e:
            print(f"Error during BERT classification: {e}. Falling back to rules.")
            classification_result = classify_symptoms_rule_based(symptoms)
    else:
        classification_result = classify_symptoms_rule_based(symptoms)

    symptom_details = analyze_symptom_details(symptoms)
    
    # Combine results from classification and keyword extraction
    return {**classification_result, **symptom_details}