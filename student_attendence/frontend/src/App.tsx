import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import HodDashboard from "./pages/HodDashboard";
import ScanQR from "./pages/ScanQR";
import GenerateQR from "./pages/GenerateQR";
import SessionList from "./pages/SessionList";
import AttendanceRecords from "./pages/AttendanceRecords";
import StudentAttendanceHistory from "./pages/StudentAttendanceHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'student' | 'teacher' | 'admin' }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (user?.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (user?.role === 'admin') {
      return <Navigate to="/hod/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/login" 
        element={
          isAuthenticated
            ? (
              user?.role === 'student'
                ? <Navigate to="/student/dashboard" replace />
                : user?.role === 'teacher'
                  ? <Navigate to="/teacher/dashboard" replace />
                  : user?.role === 'admin'
                    ? <Navigate to="/hod/dashboard" replace />
                    : <Navigate to="/" replace />
            )
            : <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated
            ? (
              user?.role === 'student'
                ? <Navigate to="/student/dashboard" replace />
                : user?.role === 'teacher'
                  ? <Navigate to="/teacher/dashboard" replace />
                  : user?.role === 'admin'
                    ? <Navigate to="/hod/dashboard" replace />
                    : <Navigate to="/" replace />
            )
            : <Register />
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/scan" 
        element={
          <ProtectedRoute requiredRole="student">
            <ScanQR />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/attendance" 
        element={
          <ProtectedRoute requiredRole="student">
            <StudentAttendanceHistory />
          </ProtectedRoute>
        } 
      />
      
      {/* Teacher Routes */}
      <Route 
        path="/teacher/dashboard" 
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />

      {/* HOD (Admin) Routes */}
      <Route
        path="/hod/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <HodDashboard />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/teacher/sessions/create" 
        element={
          <ProtectedRoute requiredRole="teacher">
            <GenerateQR />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/sessions" 
        element={
          <ProtectedRoute requiredRole="teacher">
            <SessionList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/attendance" 
        element={
          <ProtectedRoute requiredRole="teacher">
            <AttendanceRecords />
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy routes - redirect to new paths */}
      <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
      <Route path="/teacher/generate-qr" element={<Navigate to="/teacher/sessions/create" replace />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
