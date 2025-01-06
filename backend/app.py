from flask import Flask, request, jsonify

app = Flask(__name__)

# Example route for symptom checking
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # Get user input
    symptoms = data.get('symptoms', [])

    # Dummy prediction logic (replace with ML model later)
    if 'fever' in symptoms and 'cough' in symptoms:
        prediction = "Possible flu or COVID-19"
    else:
        prediction = "No specific diagnosis"

    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)