from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Example dataset (symptoms and corresponding conditions)
X = [
    ['fever', 'cough'],
    ['headache', 'nausea'],
    ['rash', 'itchiness'],
]
y = ['flu', 'migraine', 'allergy']

# Encode categorical data
label_encoder_X = LabelEncoder()
label_encoder_y = LabelEncoder()

# Flatten X (list of lists) into a single list for encoding
X_flat = [item for sublist in X for item in sublist]

# Fit and transform X
label_encoder_X.fit(X_flat)
X_encoded = [label_encoder_X.transform(x) for x in X]

# Fit and transform y
y_encoded = label_encoder_y.fit_transform(y)

# Train a decision tree model
model = DecisionTreeClassifier()
model.fit(X_encoded, y_encoded)

# Save the model and encoders
joblib.dump(model, 'backend/models/model.pkl')
joblib.dump(label_encoder_X, 'backend/models/label_encoder_X.pkl')
joblib.dump(label_encoder_y, 'backend/models/label_encoder_y.pkl')

print("Model and encoders saved to backend/models/")