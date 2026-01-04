import React from 'react';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    errors?: string[];
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title, message, errors }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200
        }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px', width: '500px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ color: '#d32f2f', margin: 0 }}>{title}</h3>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <p>{message}</p>
                    {errors && errors.length > 0 && (
                        <div style={{ backgroundColor: '#fff4f4', border: '1px solid #ffcdd2', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                            <strong style={{ display: 'block', marginBottom: '5px', color: '#b71c1c' }}>Details:</strong>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#c62828' }}>
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
