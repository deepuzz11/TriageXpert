async function submitSymptoms() {
    const symptoms = document.getElementById("symptoms").value;
    const response = await fetch("/triage", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({symptoms: symptoms, patient_id: "user123"})
    });
    const data = await response.json();
    document.getElementById("result").innerHTML = 
        `Category: ${data.category}<br/>Confidence: ${(data.confidence*100).toFixed(2)}%`;
}
