from sklearn.tree import DecisionTreeClassifier
import joblib

# Example dataset (symptoms and corresponding conditions)
X = [
    ['fever', 'cough'],
    ['headache', 'nausea'],
    ['rash', 'itchiness'],
]
y = ['flu', 'migraine', 'allergy']

# Train a decision tree model
model = DecisionTreeClassifier()
model.fit(X, y)

# Save the model
joblib.dump(model, 'backend/models/model.pkl')