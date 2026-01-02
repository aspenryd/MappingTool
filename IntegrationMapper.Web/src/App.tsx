import { useState } from 'react';
import MappingCanvas from './components/MappingCanvas/MappingCanvas';
import SystemList from './components/Systems/SystemList';
import AddSystemModal from './components/Systems/AddSystemModal';
import SystemDetail from './components/Systems/SystemDetail';
import ProjectList from './components/Projects/ProjectList';
import CreateProjectModal from './components/Projects/CreateProjectModal';
import { type IntegrationSystem } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState<'systems' | 'projects' | 'mapping'>('systems');
  const [selectedSystem, setSelectedSystem] = useState<IntegrationSystem | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isAddSystemOpen, setIsAddSystemOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSystemSelect = (system: IntegrationSystem) => {
    setSelectedSystem(system);
  };

  const handleBackToSystems = () => {
    setSelectedSystem(null);
  };

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentView('mapping');
  };

  return (
    <div className="App">
      <header style={{ padding: '10px 20px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Integration Mapper</h1>
        <nav>
          <button
            onClick={() => { setCurrentView('systems'); setSelectedSystem(null); }}
            style={{ marginRight: '10px', fontWeight: currentView === 'systems' ? 'bold' : 'normal' }}
          >
            Systems
          </button>
          <button
            onClick={() => { setCurrentView('projects'); setSelectedProjectId(null); }}
            style={{ fontWeight: currentView === 'projects' || currentView === 'mapping' ? 'bold' : 'normal' }}
          >
            Projects
          </button>
        </nav>
      </header>
      <main>
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

        {currentView === 'mapping' && selectedProjectId && (
          <MappingCanvas projectId={selectedProjectId} />
        )}
      </main>
    </div>
  );
}

export default App;
