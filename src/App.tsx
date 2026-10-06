import React, { useState, useEffect } from 'react';
import { useClientStore, ClientStatus } from './store/clientStore';
import { ClientList } from './components/ClientList';
import { ClientModal } from './components/ClientModal';
import { Plus, Search, Filter, RotateCcw } from 'lucide-react';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('100.00');
  const [payName, setPayName] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const { clients, searchQuery, setSearchQuery, filterStatus, setFilterStatus, fetchClients } = useClientStore();

  const stats = React.useMemo(() => {
    const counts = Object.values(ClientStatus).reduce((acc, status) => {
      acc[status] = clients.filter(c => c.status === status).length;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      ...counts,
      Total: clients.length
    } as Record<string, number>;
  }, [clients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Check payment status on return from Tpay or localStorage persistence
  useEffect(() => {
    const checkPaymentReturn = async () => {
      const storedPaid = localStorage.getItem('tpay_paid') === 'true';
      if (storedPaid) {
        setIsPaid(true);
      }

      const params = new URLSearchParams(window.location.search);
      const tpayId = params.get('tpayId') || params.get('id');

      if (tpayId) {
        try {
          const res = await fetch(`/api/check-status?id=${encodeURIComponent(tpayId)}`);
          const data = await res.json();
          if (data && data.paid) {
            setIsPaid(true);
            localStorage.setItem('tpay_paid', 'true');
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        } finally {
          // Clean up query parameters from URL without reloading page
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    checkPaymentReturn();
  }, []);

  const handleReset = () => {
    localStorage.removeItem('tpay_paid');
    localStorage.removeItem('tpay_transaction_id');
    setIsPaid(false);
    setPayAmount('100.00');
    setPayName('');
    setPayEmail('');
    setPayPhone('');
    setPayError('');
    setIsPayLoading(false);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    const parsedAmount = parseFloat(payAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPayError('Podaj prawidłową kwotę większą od zera');
      return;
    }

    if (!payName.trim()) {
      setPayError('Podaj imię i nazwisko płatnika');
      return;
    }

    if (!payEmail.trim() || !payEmail.includes('@')) {
      setPayError('Podaj prawidłowy adres e-mail płatnika');
      return;
    }

    setIsPayLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parsedAmount,
          name: payName.trim(),
          email: payEmail.trim(),
          phone: payPhone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Błąd inicjalizacji płatności';
        const errorDetails = data.details ? ` | Debug: ${typeof data.details === 'object' ? JSON.stringify(data.details) : data.details}` : '';
        throw new Error(`${errorMsg}${errorDetails}`);
      }

      if (data.transactionId) {
        localStorage.setItem('tpay_transaction_id', data.transactionId);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Brak adresu URL płatności w odpowiedzi serwera');
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : String(err));
      setIsPayLoading(false);
    }
  };

  return (
    <>
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

      {/* Floating RESET button (left of PAY button) */}
      <button
        onClick={handleReset}
        style={floatingResetButtonStyle}
        title="Resetuj stan płatności i formularz"
      >
        <RotateCcw size={16} />
        RESET
      </button>

      {/* Floating PAY button - fixed bottom right, turns green when paid */}
      <button
        onClick={() => setIsPayModalOpen(true)}
        style={{
          ...floatingPayButtonStyle,
          backgroundColor: isPaid ? '#10b981' : 'var(--primary, #6366f1)',
        }}
        title={isPaid ? 'Płatność zakończona sukcesem (Opłacone)' : 'Zapłać przez Tpay'}
      >
        {isPaid ? 'PAY ✓' : 'PAY'}
      </button>

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div style={overlayStyle}>
          <div className="card animate-modal" style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2>Płatność Tpay</h2>
              <button onClick={() => setIsPayModalOpen(false)} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            {payError && <div style={errorStyle}>{payError}</div>}

            <form onSubmit={handlePaySubmit} style={formStyle}>
              <div style={inputGroupStyle}>
                <label>Kwota (PLN)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="100.00"
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label>Imię i nazwisko</label>
                <input
                  type="text"
                  value={payName}
                  onChange={(e) => setPayName(e.target.value)}
                  placeholder="Jan Kowalski"
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label>Adres e-mail</label>
                <input
                  type="email"
                  value={payEmail}
                  onChange={(e) => setPayEmail(e.target.value)}
                  placeholder="jan@example.com"
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label>Telefon (opcjonalnie)</label>
                <input
                  type="tel"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="+48 123 456 789"
                />
              </div>

              <div style={footerStyle}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsPayModalOpen(false)}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPayLoading}
                >
                  {isPayLoading ? 'Przetwarzanie...' : 'Zapłać'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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

const floatingPayButtonStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 9999,
  color: 'white',
  border: 'none',
  borderRadius: '50px',
  padding: '0.85rem 1.75rem',
  fontSize: '1rem',
  fontWeight: 'bold',
  fontFamily: 'inherit',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
  transition: 'transform 0.2s, background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '0.05em',
};

const floatingResetButtonStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '125px',
  zIndex: 9999,
  backgroundColor: '#4b5563',
  color: 'white',
  border: 'none',
  borderRadius: '50px',
  padding: '0.85rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 'bold',
  fontFamily: 'inherit',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
  transition: 'transform 0.2s, background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  letterSpacing: '0.03em',
};

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
  zIndex: 10000,
  overflowY: 'auto',
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '450px',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-lg)',
  background: '#181b21',
  borderRadius: '12px',
  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
  color: 'white',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted, #9ca3af)',
  fontSize: '1.25rem',
  cursor: 'pointer',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#f87171',
  padding: '0.75rem',
  borderRadius: '6px',
  fontSize: '0.8125rem',
  marginBottom: '1rem',
  wordBreak: 'break-all',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1rem',
};

export default App;
