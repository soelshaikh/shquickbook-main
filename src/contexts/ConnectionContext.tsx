import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface ConnectionContextValue {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

const STORAGE_KEY = 'qbo-connected';

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const connect = useCallback(() => {
    setIsConnected(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ConnectionContext.Provider value={{ isConnected, connect, disconnect }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}
