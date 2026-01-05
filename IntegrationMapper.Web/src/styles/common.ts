export const commonStyles = {
    header: {
        display: 'flex' as 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 25px',
        backgroundColor: 'white',
        borderBottom: '1px solid #eee',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        marginBottom: '20px'
    },
    headerTitle: {
        margin: 0,
        fontSize: '18px',
        color: '#333',
        fontWeight: 600
    },
    backButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        color: '#555',
        display: 'flex' as 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        transition: 'background 0.2s'
    },
    container: {
        padding: '20px',
        margin: '0 auto',
        fontFamily: 'Inter, sans-serif',
        width: '100%',
        boxSizing: 'border-box' as 'border-box'
    },
    card: {
        backgroundColor: 'white',
        border: '1px solid #eee',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginBottom: '15px'
    },
    listItem: {
        backgroundColor: 'white',
        border: '1px solid #eee',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '15px',
        display: 'flex' as 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'transform 0.1s, box-shadow 0.1s'
    },
    primaryButton: {
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 600
    }
};
