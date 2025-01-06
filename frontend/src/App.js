import React, { useState } from 'react';
import './App.css';

function App() {
  const [symptoms, setSymptoms] = useState('');
  const [prediction, setPrediction] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: symptoms.split(',') }),
    });
    const data = await response.json();
    setPrediction(data.prediction);
  };

  return (
    <div className="App">
      <h1>AI-Powered Disease Diagnosis Tool</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter symptoms (comma-separated):
          <input
            type="text"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </label>
        <button type="submit">Predict</button>
      </form>
      {prediction && <h2>Prediction: {prediction}</h2>}
    </div>
  );
}

export default App;