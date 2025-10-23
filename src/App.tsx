
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LanguageErrorBoundary from "@/components/LanguageErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./components/Settings";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import OAuthWrapper from "./components/OAuthWrapper";
import ErrorBoundary from "./components/ErrorBoundary";
import { AlertTriangle, Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('ProtectedRoute: Rendering protected route');
  const { user, loading, error } = useAuthContext();
  
  console.log('ProtectedRoute: User state:', { user: !!user, loading, error });
  
  if (loading) {
    console.log('ProtectedRoute: Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm sm:text-base text-gray-600">Učitava...</p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (error) {
    console.log('ProtectedRoute: Auth error, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }
  
  console.log('ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  console.log('App: Starting application');
  
  try {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ThemeProvider>
              <AuthProvider>
              <div className="min-h-screen w-full">
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <OAuthWrapper>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <ProtectedAdminRoute>
                          <AdminDashboard />
                        </ProtectedAdminRoute>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </OAuthWrapper>
                </BrowserRouter>
              </div>
            </AuthProvider>
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App: Error in App component:', error);
    throw error;
  }
};

const App: React.FC = () => {
  return (
    <LanguageErrorBoundary>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </LanguageErrorBoundary>
  );
};

export default App;
