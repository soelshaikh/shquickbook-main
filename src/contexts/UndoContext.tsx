import { createContext, useContext, useCallback, useReducer, ReactNode } from 'react';

export interface UndoAction {
  id: string;
  type: string;
  description: string;
  undo: () => void;
  redo: () => void;
  timestamp: number;
}

interface UndoState {
  past: UndoAction[];
  future: UndoAction[];
}

type UndoReducerAction =
  | { type: 'PUSH'; action: UndoAction }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

const MAX_HISTORY = 20;

function undoReducer(state: UndoState, action: UndoReducerAction): UndoState {
  switch (action.type) {
    case 'PUSH':
      return {
        past: [...state.past.slice(-MAX_HISTORY + 1), action.action],
        future: [], // Clear future on new action
      };
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const lastAction = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const nextAction = state.future[0];
      return {
        past: [...state.past, nextAction],
        future: state.future.slice(1),
      };
    }
    case 'CLEAR':
      return { past: [], future: [] };
    default:
      return state;
  }
}

interface UndoContextValue {
  canUndo: boolean;
  canRedo: boolean;
  lastAction: UndoAction | null;
  pushAction: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(undoReducer, { past: [], future: [] });

  const pushAction = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    dispatch({
      type: 'PUSH',
      action: {
        ...action,
        id: `action-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      },
    });
  }, []);

  const undo = useCallback(() => {
    if (state.past.length > 0) {
      const lastAction = state.past[state.past.length - 1];
      lastAction.undo();
      dispatch({ type: 'UNDO' });
    }
  }, [state.past]);

  const redo = useCallback(() => {
    if (state.future.length > 0) {
      const nextAction = state.future[0];
      nextAction.redo();
      dispatch({ type: 'REDO' });
    }
  }, [state.future]);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <UndoContext.Provider
      value={{
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        lastAction: state.past[state.past.length - 1] || null,
        pushAction,
        undo,
        redo,
        clear,
      }}
    >
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within an UndoProvider');
  }
  return context;
}
