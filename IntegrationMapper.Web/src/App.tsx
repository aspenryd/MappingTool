import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import MappingCanvas from './components/MappingCanvas/MappingCanvas';
import SystemList from './components/Systems/SystemList';
import AddSystemModal from './components/Systems/AddSystemModal';
import SystemDetail from './components/Systems/SystemDetail';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import CreateProjectModal from './components/Projects/CreateProjectModal';
import NavBar from './components/Layout/NavBar';
import { useAppAuth } from './auth/AuthProvider';
import { useState } from 'react'; // needed for modals

function App() {
  const { isAuthenticated, login, logout, user } = useAppAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Modal States (still local UI state)
  const [isAddSystemOpen, setIsAddSystemOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Helper to determine current view for NavBar highlighting
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.startsWith('/systems')) return 'systems';
    if (path.startsWith('/projects') || path.startsWith('/mapping')) return 'projects';
    return 'systems';
  };

  const currentView = getCurrentView();

  const handleNavigate = (view: 'systems' | 'projects') => {
    navigate(`/${view}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="App" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <h1 style={{ color: '#333' }}>Integration Mapper</h1>
        <p>Please log in to continue.</p>
        <button onClick={login} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NavBar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onLogout={logout}
      />

      <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#fff' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />

          {/* Systems Routes */}
          <Route path="/systems" element={
            <>
              <SystemList
                key={refreshTrigger}
                onAddClick={() => setIsAddSystemOpen(true)}
              />
              <AddSystemModal
                isOpen={isAddSystemOpen}
                onClose={() => setIsAddSystemOpen(false)}
                onSystemAdded={() => setRefreshTrigger(prev => prev + 1)}
              />
            </>
          } />
          {/* System Detail - using ID (int) for now as requested/existing */}
          <Route path="/systems/:id" element={<SystemDetailWrapper />} />

          {/* Projects Routes */}
          <Route path="/projects" element={
            <>
              <ProjectList
                onAddClick={() => setIsCreateProjectOpen(true)}
              />
              <CreateProjectModal
                isOpen={isCreateProjectOpen}
                onClose={() => setIsCreateProjectOpen(false)}
                onProjectCreated={(publicId) => navigate(`/projects/${publicId}`)}
              />
            </>
          } />

          {/* Project Detail - using PublicId (GUID) */}
          <Route path="/projects/:publicId" element={<ProjectDetailWrapper />} />

          {/* Mapping Canvas - using PublicId (GUID) */}
          <Route path="/mapping/:publicId" element={<MappingCanvasWrapper />} />
        </Routes>
      </main>
    </div>
  );
}

// Wrapper components to extract params and handle navigation props
import { useParams } from 'react-router-dom';

const SystemDetailWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Fetch system? Or let component fetch? Component expects object currently.
  // I need to refactor SystemDetail to fetch by ID.
  // For now, let's assume I will refactor SystemDetail.

  // Actually, SystemDetail expects `system` object prop. 
  // I should change it to accept `systemId` prop or just use params inside it.
  // Let's refactor the components themselves to use params, cleaner than wrappers passing props.
  // But since I can't edit them all in this one atomic step, I'll pass props.

  // Wait, SystemDetail needs the object. 
  // I'll update the components to fetch their own data using the ID.
  // So SystemDetailWrapper just renders SystemDetail.
  return <SystemDetail systemId={id || ''} onBack={() => navigate('/systems')} />;
};

const ProjectDetailWrapper = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  return <ProjectDetail publicId={publicId!} onBack={() => navigate('/projects')} />;
};

const MappingCanvasWrapper = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  // onBack should go back to Project Detail. 
  // But I need to know which project to go back to?
  // ProjectDetail is /projects/:publicId
  // MappingCanvas can fetch context which contains ProjectPublicId.
  // So MappingCanvas can handle its own back navigation logic or I pass a "default" back which is History Back?
  // navigate(-1) is a good default for "Back".
  return <MappingCanvas profilePublicId={publicId!} onBack={() => navigate(-1)} />;
};

export default App;
