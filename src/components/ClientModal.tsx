import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useClientStore, ClientStatus } from '../store/clientStore';

interface ClientModalProps {
  onClose: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ onClose }) => {
  const addClient = useClientStore((state) => state.addClient);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.Wysłane);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Imię i nazwisko są wymagane');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Podaj prawidłowy adres email');
      return;
    }

    setIsLoading(true);
    try {
      await addClient({
        name: name.trim(),
        email: email.trim(),
        status,
      });
      onClose();
    } catch (err) {
      setError('Wystąpił błąd podczas dodawania klienta. Spróbuj ponownie.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div className="card animate-modal" style={modalStyle}>
        <div style={headerStyle}>
          <h2>Dodaj klienta</h2>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={20} />
          </button>
        </div>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label>Imię i nazwisko *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Jan Kowalski"
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Email *</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="jan@example.com"
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label>Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as ClientStatus)}
              style={{ backgroundColor: '#181b21', color: 'white' }}
            >
              {Object.values(ClientStatus).map((s) => (
                <option key={s} value={s} style={{ background: '#181b21', color: 'white' }}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          
          <div style={footerStyle}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Dodawanie...' : 'Dodaj klienta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline styles for simplicity to keep everything encapsulated without too many CSS classes
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
  zIndex: 1000,
  overflowY: 'auto',
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '450px',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-lg)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  marginTop: '0.5rem',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  padding: '0.75rem',
  borderRadius: 'var(--radius-md)',
  marginBottom: '1rem',
  fontSize: '0.875rem',
};
