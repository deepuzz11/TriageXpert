### ** TriageXpert Processing Pipeline**

```mermaid
sequenceDiagram
    participant Browser as [Browser]
    participant Flask as Flask In-Memory Cache<br/>(thread-safe dict)
    participant BERT as ClinicalBERT Inference
    participant Scheduler as Lightweight Scheduler<br/>(in-memory)
    participant Response as JSON Response

    Browser->>Flask: JSON POST /triage
    Flask->>BERT: Pass symptoms for inference
    BERT-->>Flask: Return category + confidence
    Flask->>Scheduler: Update queue and prioritization
    Scheduler-->>Flask: Scheduling confirmation
    Flask-->>Browser: Return triage category + confidence
