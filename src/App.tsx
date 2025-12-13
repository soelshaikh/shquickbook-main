import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useConnection } from "@/contexts/ConnectionContext";

// Pages
import Transactions from "./pages/Transactions";
import Invoices from "./pages/Invoices";
import Bills from "./pages/Bills";
import JournalEntries from "./pages/JournalEntries";
import Settings from "./pages/Settings";
import Connect from "./pages/Connect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isConnected } = useConnection();

  if (!isConnected) {
    return <Connect />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/transactions" replace />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/journal-entries" element={<JournalEntries />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/connect" element={<Navigate to="/transactions" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
