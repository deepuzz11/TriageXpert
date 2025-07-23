import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
import spacy

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

# Load spacy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("spaCy model not found. Using basic NLP processing.")
    nlp = None

# Medical keyword mappings for triage categories
EMERGENCY_KEYWORDS = [
    'chest pain', 'heart attack', 'stroke', 'seizure', 'unconscious',
    'severe bleeding', 'difficulty breathing', 'choking', 'overdose',
    'severe burn', 'cardiac arrest', 'anaphylaxis', 'severe trauma',
    'suicide', 'poisoning', 'severe allergic reaction'
]

URGENT_KEYWORDS = [
    'high fever', 'severe pain', 'persistent vomiting', 'dehydration',
    'fracture', 'severe headache', 'abdominal pain', 'infection',
    'wound', 'dizziness', 'fainting', 'confusion', 'severe cough',
    'blood in urine', 'blood in stool', 'severe diarrhea'
]

ROUTINE_KEYWORDS = [
    'mild headache', 'common cold', 'runny nose', 'sore throat',
    'minor cut', 'bruise', 'muscle ache', 'fatigue', 'insomnia',
    'constipation', 'mild rash', 'seasonal allergies'
]

class TriageClassifier:
    def __init__(self):
        self.stemmer = PorterStemmer()
        try:
            self.stop_words = set(stopwords.words('english'))
        except:
            self.stop_words = set()

    def preprocess_text(self, text):
        """Clean and preprocess the input text."""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and stem
        processed_tokens = []
        for token in tokens:
            if token not in self.stop_words:
                stemmed_token = self.stemmer.stem(token)
                processed_tokens.append(stemmed_token)
        
        return ' '.join(processed_tokens)

    def extract_keywords(self, text):
        """Extract medical keywords from text."""
        text_lower = text.lower()
        found_keywords = []
        
        # Check for emergency keywords
        for keyword in EMERGENCY_KEYWORDS:
            if keyword in text_lower:
                found_keywords.append(keyword)
        
        # Check for urgent keywords
        for keyword in URGENT_KEYWORDS:
            if keyword in text_lower:
                found_keywords.append(keyword)
        
        # Check for routine keywords
        for keyword in ROUTINE_KEYWORDS:
            if keyword in text_lower:
                found_keywords.append(keyword)
        
        return list(set(found_keywords))  # Remove duplicates

    def classify_urgency(self, text, keywords):
        """Classify the urgency level based on keywords."""
        emergency_count = sum(1 for kw in keywords if kw in EMERGENCY_KEYWORDS)
        urgent_count = sum(1 for kw in keywords if kw in URGENT_KEYWORDS)
        routine_count = sum(1 for kw in keywords if kw in ROUTINE_KEYWORDS)
        
        if emergency_count > 0:
            confidence = min(0.95, 0.7 + (emergency_count * 0.1))
            return 'Emergency', confidence
        elif urgent_count > 0:
            confidence = min(0.85, 0.6 + (urgent_count * 0.1))
            return 'Urgent', confidence
        elif routine_count > 0:
            confidence = min(0.75, 0.5 + (routine_count * 0.1))
            return 'Routine', confidence
        else:
            # Default classification based on text analysis
            if any(word in text.lower() for word in ['severe', 'intense', 'extreme']):
                return 'Urgent', 0.6
            else:
                return 'Routine', 0.5

def triage_symptoms(symptoms_text):
    """Main function to triage symptoms and return classification."""
    classifier = TriageClassifier()
    
    # Extract keywords
    keywords = classifier.extract_keywords(symptoms_text)
    
    # Classify urgency
    category, confidence = classifier.classify_urgency(symptoms_text, keywords)
    
    return {
        'category': category,
        'confidence': confidence,
        'keywords': keywords,
        'processed_text': classifier.preprocess_text(symptoms_text)
    }

# Test function
if __name__ == "__main__":
    test_symptoms = "I have severe chest pain and difficulty breathing"
    result = triage_symptoms(test_symptoms)
    print(f"Triage Result: {result}")
