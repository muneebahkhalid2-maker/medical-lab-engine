import React, { useState } from 'react';

/**
 * Standalone Exact Image OCR & Display Component (React / JavaScript)
 * -------------------------------------------------------------------
 * Requirements fulfilled:
 * 1. Read & Extract: Uploads image and runs optical character recognition (or calls OCR endpoint).
 * 2. Pure Display: Renders the extracted text faithfully on screen.
 * 3. No Modification: Preserves raw exact text without altering, correcting, or summarizing.
 */
export default function ExactImageOCRViewer() {
  const [imagePreview, setImagePreview] = useState(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setRawText('');
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Example 1: Calling local AI service or backend OCR endpoint
      const response = await fetch('/api/ocr/extract-raw', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      // Directly render the exact raw text without modifications
      setRawText(data.raw_text || data.text || '');
    } catch (err) {
      setError(err.message || 'Failed to process image OCR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', fontFamily: 'sans-serif', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <h2 style={{ margin: '0 0 10px 0' }}>Exact Image OCR Viewer</h2>
      <p style={{ color: '#666', fontSize: '14px', margin: '0 0 20px 0' }}>
        Extracts all visible text word-for-word and displays it without any corrections, cleanups, or alterations.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: '20px', display: 'block' }}
      />

      {imagePreview && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Input Image:</h4>
          <img
            src={imagePreview}
            alt="Source"
            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
      )}

      {loading && <p style={{ color: '#0066cc' }}>Extracting exact text via OCR...</p>}
      {error && <p style={{ color: '#cc0000' }}>Error: {error}</p>}

      {rawText !== '' && (
        <div>
          <h4>Extracted Text (100% Unaltered Raw Output):</h4>
          <pre
            style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'Consolas, monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {rawText}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(rawText)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: '4px',
              border: '1px solid #999',
              background: '#fff',
            }}
          >
            Copy Raw Text
          </button>
        </div>
      )}
    </div>
  );
}
