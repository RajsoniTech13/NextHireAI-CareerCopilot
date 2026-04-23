import React, { useState } from 'react';

const CoverLetter = ({ token }) => {
    const [form, setForm] = useState({ company: '', position: '' });
    const [letter, setLetter] = useState('');
    const [loading, setLoading] = useState(false);

    const generate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch('/api/ai/cover-letter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(form)
        });
        const data = await res.json();
        setLetter(data.letter);
        setLoading(false);
    };

    const copyText = () => {
        navigator.clipboard.writeText(letter);
        alert('Copied!');
    };

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>Cover Letter Generator</h1>
            
            <div className="grid-2">
                <div className="card">
                    <h3>Job Details</h3>
                    <form onSubmit={generate}>
                        <input
                            type="text"
                            placeholder="Company Name"
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Job Position"
                            value={form.position}
                            onChange={(e) => setForm({ ...form, position: e.target.value })}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Letter'}
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h3>Your Cover Letter</h3>
                    {letter ? (
                        <>
                            <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', whiteSpace: 'pre-wrap', marginBottom: '15px' }}>
                                {letter}
                            </pre>
                            <button onClick={copyText}>Copy to Clipboard</button>
                        </>
                    ) : (
                        <p style={{ color: '#999', textAlign: 'center', padding: '50px' }}>
                            Fill the form and click generate
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoverLetter;