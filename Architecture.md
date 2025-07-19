### **TriageXpert System Architecture**

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Web Interface<br/>HTML/CSS/JavaScript]
        Form[Symptom Input Form]
        Display[Triage Results Display]
    end

    subgraph "Backend Layer"
        Flask[Flask Web Server]
        API[REST API Endpoints]
        Auth[Authentication Service]
    end

    subgraph "AI/NLP Layer"
        NLP[NLP Pipeline<br/>spaCy + ClinicalBERT]
        Preprocess[Text Preprocessing]
        Extract[Symptom Extraction]
        Classify[Triage Classification]
        Confidence[Confidence Scoring]
    end

    subgraph "Database Layer"
        SQLite[(SQLite Database)]
        Patients[Patients Table]
        Symptoms[Symptoms Table]
        Triage[Triage Results Table]
        Appointments[Appointments Table]
    end

    subgraph "External Services"
        HF[Hugging Face<br/>ClinicalBERT Model]
        OPD[OPD Scheduling System]
    end

    UI --> Form
    Form --> API
    Display <-- API

    API --> Flask
    Flask --> Auth
    Flask --> NLP

    NLP --> Preprocess
    Preprocess --> Extract
    Extract --> Classify
    Classify --> Confidence

    Flask --> SQLite
    SQLite --> Patients
    SQLite --> Symptoms
    SQLite --> Triage
    SQLite --> Appointments

    NLP --> HF
    Flask --> OPD

    style UI fill:#ffffff, color:#ffffff
    style Flask fill:#ffffff, color:#ffffff
    style NLP fill:#ffffff, color:#ffffff
    style SQLite fill:#ffffff, color:#ffffff
