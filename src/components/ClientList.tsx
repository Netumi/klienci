import React, { useMemo } from 'react';
import { useClientStore, ClientStatus } from '../store/clientStore';
import { Trash2 } from 'lucide-react';

const getStatusClass = (status: ClientStatus) => {
  switch (status) {
    case ClientStatus.Wysłane:
      return 'status-wyslane';
    case ClientStatus.Odrzucone:
      return 'status-odrzucone';
    case ClientStatus.Przyjęte:
      return 'status-przyjete';
    case ClientStatus.WTrakcie:
      return 'status-wtrakcie';
    case ClientStatus.Zrobione:
      return 'status-zrobione';
    default:
      return '';
  }
};

export const ClientList: React.FC = () => {
  const { clients, searchQuery, filterStatus, updateClientStatus, deleteClient } = useClientStore();

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = 
        (client.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (client.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterStatus === 'All' || client.status === filterStatus;

      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients, searchQuery, filterStatus]);

  if (clients.length === 0) {
    return (
      <div style={emptyStateStyle} className="card">
        <p style={{ color: 'var(--text-muted)' }}>Brak klientów w bazie. Dodaj pierwszego klienta!</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr style={thRowStyle}>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Telefon</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Nie znaleziono klientów spełniających kryteria.
              </td>
            </tr>
          ) : (
            filteredClients.map((client) => (
              <tr key={client.id} style={trStyle}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{client.email}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{ color: 'var(--text-muted)' }}>{client.phone}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <select 
                      value={client.status}
                      onChange={(e) => updateClientStatus(client.id, e.target.value as ClientStatus)}
                      className={`status-badge ${getStatusClass(client.status)}`}
                      style={badgeSelectStyle}
                    >
                      {Object.values(ClientStatus).map((s) => (
                        <option key={s} value={s} style={{ background: '#181b21', color: 'white' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td style={tdStyle}>
                  <button 
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz usunąć tego klienta?')) {
                        deleteClient(client.id);
                      }
                    }}
                    style={deleteBtnStyle}
                    title="Usuń klienta"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const thRowStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
};

const thStyle: React.CSSProperties = {
  padding: '1rem',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--border-color)',
  transition: 'background-color 0.2s',
};

const tdStyle: React.CSSProperties = {
  padding: '1rem',
  verticalAlign: 'middle',
};

const badgeSelectStyle: React.CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.25rem 0.6rem',
  borderRadius: '9999px',
  outline: 'none',
  textAlign: 'center',
};

const emptyStateStyle: React.CSSProperties = {
  padding: '3rem',
  textAlign: 'center',
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--danger)',
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.7,
  transition: 'opacity 0.2s, background-color 0.2s',
};
