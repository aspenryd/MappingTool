import React from 'react';
import logo from '../../assets/logo.png';

interface NavBarProps {
    currentView: string;
    onNavigate: (view: 'systems' | 'projects') => void;
    user: string | null;
    onLogout: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, onNavigate, user, onLogout }) => {
    return (
        <header style={{
            height: '60px',
            backgroundColor: '#1e1e1e',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="Integration Mapper" style={{ height: '32px' }} />
                    <span style={{ fontWeight: 600, fontSize: '1.2em', letterSpacing: '0.5px' }}>
                        INTEGRATION <span style={{ color: '#a0a0ff' }}>MAPPER</span>
                    </span>
                </div>

                <nav style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={() => onNavigate('systems')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: currentView === 'systems' ? '#fff' : '#aaa',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            fontWeight: currentView === 'systems' ? 'bold' : 'normal',
                            borderBottom: currentView === 'systems' ? '2px solid #a0a0ff' : '2px solid transparent'
                        }}
                    >
                        Systems
                    </button>
                    <button
                        onClick={() => onNavigate('projects')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: currentView.startsWith('project') || currentView === 'mapping' ? '#fff' : '#aaa',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            fontWeight: currentView.startsWith('project') || currentView === 'mapping' ? 'bold' : 'normal',
                            borderBottom: currentView.startsWith('project') || currentView === 'mapping' ? '2px solid #a0a0ff' : '2px solid transparent'
                        }}
                    >
                        Projects
                    </button>
                </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: '#ccc', fontSize: '0.9em' }}>{user}</span>
                <button
                    onClick={onLogout}
                    style={{
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85em'
                    }}
                >
                    Logout
                </button>
            </div>
        </header>
    );
};

export default NavBar;
