import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import { KeyboardProvider } from './contexts/KeyboardContext';
import { UndoProvider } from './contexts/UndoContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import App from './App';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ConnectionProvider>
      <KeyboardProvider>
        <UndoProvider>
          <App />
        </UndoProvider>
      </KeyboardProvider>
    </ConnectionProvider>
  </ThemeProvider>
);
