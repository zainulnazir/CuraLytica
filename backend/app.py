from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

# Load the trained model and encoders
model = joblib.load('backend/models/model.pkl')
label_encoder_X = joblib.load('backend/models/label_encoder_X.pkl')
label_encoder_y = joblib.load('backend/models/label_encoder_y.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # Get user input
    symptoms = data.get('symptoms', [])

    # Encode the input symptoms
    symptoms_encoded = label_encoder_X.transform(symptoms)

    # Make a prediction using the model
    prediction_encoded = model.predict([symptoms_encoded])[0]
    prediction = label_encoder_y.inverse_transform([prediction_encoded])[0]

    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)