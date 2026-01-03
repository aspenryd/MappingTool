import React from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-csharp';

interface CodeViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    title: string;
}

const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose, code, title }) => {
    React.useEffect(() => {
        if (isOpen) {
            Prism.highlightAll();
        }
    }, [isOpen, code]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', width: '80%', height: '80%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#fff' }}>{title}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleCopy} style={{ backgroundColor: '#217346', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                            Copy
                        </button>
                        <button onClick={onClose} style={{ backgroundColor: 'transparent', color: '#aaa', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                            Close
                        </button>
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '0', backgroundColor: '#1e1e1e' }}>
                    <pre style={{ margin: 0, padding: '20px', backgroundColor: 'transparent' }}>
                        <code className="language-csharp">
                            {code}
                        </code>
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default CodeViewerModal;
