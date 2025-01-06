from flask import Flask, request, jsonify
import joblib
app = Flask(__name__)

# Load the trained model
model = joblib.load('backend/models/model.pkl')

# Example route for symptom checking
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # Get user input
    symptoms = data.get('symptoms', [])

    # Make a prediction using the model
    prediction = model.predict([symptoms])[0]
    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)