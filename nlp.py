import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, Any

# --- ClinicalBERT Model Loading ---
# Note: This will download the model on first run (approx. 400MB)
# Using a public, smaller model suitable for general clinical text classification.
# For a real-world application, a model fine-tuned on specific triage data would be superior.
MODEL_NAME = "medicalai/ClinicalBERT-v1"
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3)
    model.eval()  # Set the model to evaluation mode
    print("ClinicalBERT model loaded successfully.")
    MODEL_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not load ClinicalBERT model. Using rule-based fallback. Error: {e}")
    MODEL_AVAILABLE = False
    tokenizer = None
    model = None

# --- Rule-Based Fallback ---
# Keywords for each triage category. This is a simplified approach.
EMERGENCY_KEYWORDS = [
    "chest pain", "crushing pain", "shortness of breath", "difficulty breathing",
    "unconscious", "not responsive", "seizure", "stroke", "severe bleeding",
    "head injury", "vision loss", "numbness one side", "paralysis"
]
URGENT_KEYWORDS = [
    "fever", "vomiting", "diarrhea", "abdominal pain", "migraine",
    "bad headache", "dehydration", "sprain", "minor cut", "rash",
    "earache", "painful urination"
]

def classify_symptoms_rule_based(symptoms: str) -> Dict[str, Any]:
    """
    Fallback rule-based triage classification.

    Args:
        symptoms (str): The patient-reported symptoms.

    Returns:
        A dictionary containing the triage category and confidence.
    """
    symptoms_lower = symptoms.lower()

    if any(keyword in symptoms_lower for keyword in EMERGENCY_KEYWORDS):
        return {"category": "Emergency", "confidence": 0.95} # High confidence for rule-based emergency

    if any(keyword in symptoms_lower for keyword in URGENT_KEYWORDS):
        return {"category": "Urgent", "confidence": 0.85} # Medium confidence

    return {"category": "Routine", "confidence": 0.75} # Default to routine


def classify_symptoms_bert(symptoms: str) -> Dict[str, Any]:
    """
    Classifies symptoms using the ClinicalBERT model.

    Args:
        symptoms (str): The patient-reported symptoms.

    Returns:
        A dictionary containing the triage category and confidence.
    """
    if not MODEL_AVAILABLE:
         raise EnvironmentError("ClinicalBERT model is not available.")

    inputs = tokenizer(symptoms, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits

    # Convert logits to probabilities
    probabilities = torch.nn.functional.softmax(logits, dim=-1)
    confidence, predicted_class_id = torch.max(probabilities, dim=-1)

    # Map predicted class ID to category name
    # This mapping depends on the fine-tuning of the model.
    # For this example, we'll use a standard mapping: 0=Routine, 1=Urgent, 2=Emergency
    category_map = {0: "Routine", 1: "Urgent", 2: "Emergency"}
    category = category_map.get(predicted_class_id.item(), "Unknown")

    return {"category": category, "confidence": confidence.item()}


def triage_symptoms(symptoms: str) -> Dict[str, Any]:
    """
    Main triage function. Uses ClinicalBERT if available, otherwise falls back
    to a rule-based system.

    Args:
        symptoms (str): The patient-reported symptoms.

    Returns:
        A dictionary with triage 'category' and 'confidence'.
    """
    if MODEL_AVAILABLE:
        try:
            return classify_symptoms_bert(symptoms)
        except Exception as e:
            print(f"Error during BERT classification: {e}. Falling back to rules.")
            return classify_symptoms_rule_based(symptoms)
    else:
        return classify_symptoms_rule_based(symptoms)


# --- Sample Usage ---
# Expected Output Examples:
# Input: "I have severe chest pain and difficulty breathing."
# Expected BERT/Rule-based Output: {'category': 'Emergency', 'confidence': ...}
#
# Input: "I've had a fever and a bad cough for three days."
# Expected BERT/Rule-based Output: {'category': 'Urgent', 'confidence': ...}
#
# Input: "My knee has been slightly sore after a long walk."
# Expected BERT/Rule-based Output: {'category': 'Routine', 'confidence': ...}

# if __name__ == '__main__':
#     test_symptoms_emergency = "Patient is experiencing crushing chest pain and shortness of breath."
#     test_symptoms_urgent = "I have a high fever, vomiting, and a strong headache."
#     test_symptoms_routine = "I have a runny nose and a slight cough for a day."
#
#     print("--- Testing Emergency Symptoms ---")
#     result_emergency = triage_symptoms(test_symptoms_emergency)
#     print(result_emergency)
#
#     print("\n--- Testing Urgent Symptoms ---")
#     result_urgent = triage_symptoms(test_symptoms_urgent)
#     print(result_urgent)
#
#     print("\n--- Testing Routine Symptoms ---")
#     result_routine = triage_symptoms(test_symptoms_routine)
#     print(result_routine)