import { createContext, useContext, useCallback, ReactNode } from 'react';

interface KeyboardContextValue {
  // Register a handler for a specific action on a page
  registerHandler: (action: string, handler: () => void) => void;
  unregisterHandler: (action: string) => void;
  triggerAction: (action: string) => boolean;
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

const handlers = new Map<string, () => void>();

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const registerHandler = useCallback((action: string, handler: () => void) => {
    handlers.set(action, handler);
  }, []);

  const unregisterHandler = useCallback((action: string) => {
    handlers.delete(action);
  }, []);

  const triggerAction = useCallback((action: string): boolean => {
    const handler = handlers.get(action);
    if (handler) {
      handler();
      return true;
    }
    return false;
  }, []);

  return (
    <KeyboardContext.Provider value={{ registerHandler, unregisterHandler, triggerAction }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}
