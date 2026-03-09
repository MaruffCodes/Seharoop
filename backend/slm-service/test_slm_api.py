import requests
import json

# Test health endpoint
response = requests.get("http://localhost:5003/health")
print("Health check:", response.json())

# Test summary generation
test_data = {
    "patientData": {
        "name": "John Doe",
        "patientId": "00002",
        "age": "45",
        "gender": "Male",
        "bloodGroup": "O+",
        "email": "john@example.com"
    },
    "extractedData": {
        "diagnoses": ["Hypertension", "Type 2 Diabetes"],
        "medications": ["Metformin 500mg", "Lisinopril 10mg"],
        "labResults": ["HbA1c: 7.2%", "BP: 130/85"],
        "allergies": ["Penicillin"],
        "chronicDiseases": ["Diabetes", "Hypertension"],
        "comorbidConditions": ["High Cholesterol"]
    },
    "summaryType": "general"
}

response = requests.post("http://localhost:5003/generate-summary", json=test_data)
print("\nGenerated Summary:")
print(json.dumps(response.json(), indent=2))