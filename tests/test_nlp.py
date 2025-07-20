from nlp import TriageNLP
from config import MODEL_NAME

def test_nlp_prediction():
    nlp = TriageNLP(MODEL_NAME)
    result = nlp.predict("Chest pain and difficulty breathing")
    assert result["category"] in ["Emergency", "Urgent", "Routine"]
    assert 0 <= result["confidence"] <= 1
