from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class TriageNLP:
    def __init__(self, model_name):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=3)
        self.categories = ["Emergency", "Urgent", "Routine"]

    def predict(self, text):
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        outputs = self.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        confidence, predicted = torch.max(probs, dim=1)
        category = self.categories[predicted]
        return {"category": category, "confidence": confidence.item()}
