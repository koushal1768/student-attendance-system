import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, LayoutDashboard, LogOut, Users, FileText, ScanLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  userRole?: 'student' | 'teacher' | 'admin';
}

const Layout = ({ children, userRole }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentUserRole = userRole || user?.role;

  const studentNav = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/scan', label: 'Scan QR', icon: ScanLine },
    { path: '/student/attendance', label: 'My Attendance', icon: FileText },
  ];

  const teacherNav = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/teacher/sessions/create', label: 'Create Session', icon: QrCode },
    { path: '/teacher/sessions', label: 'Sessions', icon: FileText },
    { path: '/teacher/attendance', label: 'Attendance', icon: Users },
  ];

  const hodNav = [
    { path: '/hod/dashboard', label: 'HOD Dashboard', icon: LayoutDashboard },
  ];

  const navigation =
    currentUserRole === 'teacher'
      ? teacherNav
      : currentUserRole === 'admin'
        ? hodNav
        : studentNav;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">AttendEase</span>
            </Link>

            {currentUserRole && (
              <div className="flex items-center gap-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 ml-4"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
