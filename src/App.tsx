import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useConnection } from "@/contexts/ConnectionContext";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { LoadingFallback, MinimalLoadingFallback } from "@/components/shared/LoadingFallback";

// Lazy-loaded page components for code splitting
// Each page is loaded on-demand when the route is accessed
const Transactions = lazy(() => import("./pages/Transactions"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Bills = lazy(() => import("./pages/Bills"));
const JournalEntries = lazy(() => import("./pages/JournalEntries"));
const Settings = lazy(() => import("./pages/Settings"));
const Connect = lazy(() => import("./pages/Connect"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AppContent() {
  const { isConnected } = useConnection();

  if (!isConnected) {
    return (
      <Suspense fallback={<MinimalLoadingFallback />}>
        <Connect />
      </Suspense>
    );
  }

  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
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
        </Suspense>
      </ErrorBoundary>
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
