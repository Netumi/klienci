import { create } from 'zustand';

export const ClientStatus = {
  Wysłane: 'Wysłane',
  Odrzucone: 'Odrzucone',
  Przyjęte: 'Przyjęte',
  WTrakcie: 'W trakcie',
  Zrobione: 'Zrobione',
} as const;

export type ClientStatus = typeof ClientStatus[keyof typeof ClientStatus];

export interface Client {
  id: string;
  name: string;
  email: string;
  status: ClientStatus;
  createdAt: string; // From JSON
}

interface ClientState {
  clients: Client[];
  isLoading: boolean;
  searchQuery: string;
  filterStatus: ClientStatus | 'All';
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClientStatus: (id: string, status: ClientStatus) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: ClientStatus | 'All') => void;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  isLoading: false,
  searchQuery: '',
  filterStatus: 'All',

  fetchClients: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      set({ clients: data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  addClient: async (clientData) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to add client');
      }
      const newClient = await response.json();
      set((state) => ({
        clients: [newClient, ...state.clients],
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateClientStatus: async (id, status) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? { ...client, status } : client
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  deleteClient: async (id) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete client');
      
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setFilterStatus: (filterStatus) => set({ filterStatus }),
}));
