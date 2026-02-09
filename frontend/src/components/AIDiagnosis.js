import React, { useEffect, useState } from 'react';
import './AIDiagnosis.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const AIDiagnosis = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const isImageFile = (selectedFile) => Boolean(selectedFile && selectedFile.type && selectedFile.type.startsWith('image/'));

    const formatFileSize = (size) => {
        if (!size) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        const order = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
        const value = size / Math.pow(1024, order);
        return `${value.toFixed(value >= 10 || order === 0 ? 0 : 1)} ${units[order]}`;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
            setFile(selectedFile);
            setPreview(isImageFile(selectedFile) ? URL.createObjectURL(selectedFile) : null);
            setResult(null);
            setError(null);
        }
    };

    const clearFile = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setFile(null);
        setPreview(null);
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to analyze the image.');
            }

            const data = await response.json().catch(() => ({}));
            setResult(data.analysis || 'No analysis returned.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-diagnosis-container">
            <header className="tool-header">
                <h1>Image analysis</h1>
                <p>Upload a medical image to send it to the analysis service. Results are informational only.</p>
            </header>

            <div className="upload-area">
                <input
                    type="file"
                    id="file-upload"
                    className="file-input"
                    accept="image/*,.dcm"
                    onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="file-label">
                    {preview && file ? (
                        <div className="preview-wrapper">
                            <img src={preview} alt="Preview" className="image-preview" />
                            <div className="file-details">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                        </div>
                    ) : file ? (
                        <div className="file-details">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                    ) : (
                        <div className="placeholder">
                            <span className="placeholder-title">Select a medical image</span>
                            <span className="placeholder-subtitle">Accepted: PNG, JPG, DICOM (.dcm)</span>
                        </div>
                    )}
                </label>
            </div>

            {file && (
                <div className="action-row">
                    <button
                        className="analyze-btn"
                        onClick={handleAnalyze}
                        disabled={loading}
                    >
                        {loading ? 'Analyzing...' : 'Analyze image'}
                    </button>
                    <button className="secondary-btn" type="button" onClick={clearFile} disabled={loading}>
                        Remove file
                    </button>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {result && (
                <div className="result-container">
                    <h3>Analysis result</h3>
                    <pre>{result}</pre>
                </div>
            )}
        </div>
    );
};

export default AIDiagnosis;
