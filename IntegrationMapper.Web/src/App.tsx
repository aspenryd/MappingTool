import { useState } from 'react';
import MappingCanvas from './components/MappingCanvas/MappingCanvas';
import SystemList from './components/Systems/SystemList';
import AddSystemModal from './components/Systems/AddSystemModal';
import SystemDetail from './components/Systems/SystemDetail';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import CreateProjectModal from './components/Projects/CreateProjectModal';
import NavBar from './components/Layout/NavBar';
import { type IntegrationSystem } from './services/api';
import { useAppAuth } from './auth/AuthProvider';

function App() {
  const [currentView, setCurrentView] = useState<'systems' | 'projects' | 'projectDetail' | 'mapping'>('systems');
  const [selectedSystem, setSelectedSystem] = useState<IntegrationSystem | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const [isAddSystemOpen, setIsAddSystemOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { isAuthenticated, login, logout, user } = useAppAuth();

  const handleSystemSelect = (system: IntegrationSystem) => {
    setSelectedSystem(system);
  };

  const handleBackToSystems = () => {
    setSelectedSystem(null);
  };

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentView('projectDetail');
  };

  const handleProfileSelect = (profileId: number) => {
    setSelectedProfileId(profileId);
    setCurrentView('mapping');
  };

  const handleNavigate = (view: 'systems' | 'projects') => {
    setSelectedSystem(null);
    setSelectedProjectId(null);
    setSelectedProfileId(null);
    setCurrentView(view);
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
        {currentView === 'systems' && (
          selectedSystem ? (
            <SystemDetail system={selectedSystem} onBack={handleBackToSystems} />
          ) : (
            <>
              <SystemList
                key={refreshTrigger}
                onAddClick={() => setIsAddSystemOpen(true)}
                onSelectSystem={handleSystemSelect}
              />
              <AddSystemModal
                isOpen={isAddSystemOpen}
                onClose={() => setIsAddSystemOpen(false)}
                onSystemAdded={() => setRefreshTrigger(prev => prev + 1)}
              />
            </>
          )
        )}

        {currentView === 'projects' && (
          <>
            <ProjectList
              onSelectProject={handleProjectSelect}
              onAddClick={() => setIsCreateProjectOpen(true)}
            />
            <CreateProjectModal
              isOpen={isCreateProjectOpen}
              onClose={() => setIsCreateProjectOpen(false)}
              onProjectCreated={(id) => handleProjectSelect(id)}
            />
          </>
        )}

        {currentView === 'projectDetail' && selectedProjectId && (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={() => setCurrentView('projects')}
            onSelectProfile={handleProfileSelect}
          />
        )}

        {currentView === 'mapping' && selectedProfileId && (
          <MappingCanvas profileId={selectedProfileId} />
        )}
      </main>
    </div>
  );
}

export default App;
