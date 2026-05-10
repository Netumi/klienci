import React, { useState } from 'react';
import { useClientStore, ClientStatus } from './store/clientStore';
import { ClientList } from './components/ClientList';
import { ClientModal } from './components/ClientModal';
import { Plus, Search, Filter } from 'lucide-react';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { clients, searchQuery, setSearchQuery, filterStatus, setFilterStatus, fetchClients } = useClientStore();

  const stats = React.useMemo(() => {
    const counts = Object.values(ClientStatus).reduce((acc, status) => {
      acc[status] = clients.filter(c => c.status === status).length;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      ...counts,
      Total: clients.length
    };
  }, [clients]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div style={containerStyle} className="animate-fade-in">
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Zarządzanie Klientami</h1>
          <p style={{ color: 'var(--text-muted)' }}>Panel administracyjny CRM</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Dodaj klienta
        </button>
      </header>

      <div style={statsGridStyle}>
        <div style={{ ...statCardStyle, borderLeft: '4px solid var(--primary)' }}>
          <div style={statLabelStyle}>Wszyscy klienci</div>
          <div style={statValueStyle}>{stats.Total}</div>
        </div>
        {Object.values(ClientStatus).map((status) => (
          <div key={status} style={statCardStyle}>
            <div style={statLabelStyle}>{status}</div>
            <div style={statValueStyle}>{stats[status] || 0}</div>
          </div>
        ))}
      </div>

      <div style={controlsStyle}>
        <div style={searchWrapperStyle}>
          <Search size={20} style={searchIconStyle} />
          <input 
            type="text" 
            placeholder="Szukaj po emailu lub telefonie..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        
        <div style={filterWrapperStyle}>
          <Filter size={20} style={{ color: 'var(--text-muted)' }} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ClientStatus | 'All')}
            style={filterSelectStyle}
          >
            <option value="All" style={{ background: '#181b21', color: 'white' }}>Wszystkie statusy</option>
            {Object.values(ClientStatus).map((s) => (
              <option key={s} value={s} style={{ background: '#181b21', color: 'white' }}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <main>
        <ClientList />
      </main>

      {isModalOpen && <ClientModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem',
  width: '100%',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  flexWrap: 'wrap',
};

const searchWrapperStyle: React.CSSProperties = {
  position: 'relative',
  flex: '1 1 300px',
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  paddingLeft: '2.5rem',
};

const filterWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(0,0,0,0.2)',
  padding: '0 0.75rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
};

const filterSelectStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  boxShadow: 'none',
  padding: '0.5rem',
  width: '100%',
  minWidth: '180px',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem',
};

const statCardStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  padding: '1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
};

const statValueStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 'bold',
  marginTop: '0.25rem',
  color: 'var(--text-main)',
};

export default App;
