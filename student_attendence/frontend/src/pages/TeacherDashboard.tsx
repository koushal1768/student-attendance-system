import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, UserX, Clock, TrendingUp, Download, Plus } from "lucide-react";
import { sessionAPI, attendanceAPI } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalRecords: 0,
    presentToday: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [studentFilter, setStudentFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [filterLoading, setFilterLoading] = useState(false);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [filterSummary, setFilterSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    pending: 0,
    suspicious: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch sessions
      const sessionsResponse = await sessionAPI.getSessions();
      const sessions = sessionsResponse.success ? sessionsResponse.data.sessions || [] : [];
      
      // Fetch attendance records
      const attendanceResponse = await attendanceAPI.getRecords();
      const records = attendanceResponse.success ? attendanceResponse.data.records || [] : [];
      
      // Calculate statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayRecords = records.filter((r: any) => {
        const recordDate = new Date(r.timestamp);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      const presentToday = todayRecords.filter((r: any) => r.status === 'Present').length;
      const activeSessions = sessions.filter((s: any) => s.isActive && new Date(s.endTime) > new Date()).length;

      setStats({
        totalSessions: sessions.length,
        activeSessions,
        totalRecords: records.length,
        presentToday,
      });

      setRecentSessions(sessions.slice(0, 5));
      setRecentAttendance(records.slice(0, 10));
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubjectSearch = async () => {
    if (!studentFilter.trim() || !subjectFilter.trim()) {
      toast.error("Please enter both Student ID and Subject");
      return;
    }

    try {
      setFilterLoading(true);
      setHasSearched(true);

      const response = await attendanceAPI.getRecords({
        studentId: studentFilter.trim(),
        subject: subjectFilter.trim(),
        limit: 0,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch filtered records");
      }

      const records = response.data.records || [];
      setFilteredRecords(records);

      const summary = {
        total: records.length,
        present: records.filter((r: any) => r.status === "Present").length,
        absent: records.filter((r: any) => r.status === "Absent").length,
        pending: records.filter((r: any) => r.status === "Pending").length,
        suspicious: records.filter((r: any) => r.status === "Suspicious").length,
      };

      setFilterSummary(summary);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to filter attendance");
      setFilteredRecords([]);
      setFilterSummary({
        total: 0,
        present: 0,
        absent: 0,
        pending: 0,
        suspicious: 0,
      });
    } finally {
      setFilterLoading(false);
    }
  };

  const displayStats = [
    { title: "Total Sessions", value: stats.totalSessions.toString(), icon: Users, variant: "default" as const },
    { 
      title: "Active Sessions", 
      value: stats.activeSessions.toString(), 
      icon: UserCheck, 
      variant: "success" as const
    },
    { title: "Total Records", value: stats.totalRecords.toString(), icon: TrendingUp, variant: "default" as const },
    { title: "Present Today", value: stats.presentToday.toString(), icon: UserCheck, variant: "success" as const },
  ];

  if (loading) {
    return (
      <Layout userRole="teacher">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="teacher">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage student attendance</p>
          </div>
          <Link to="/teacher/sessions/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Sessions */}
          <Card className="p-6 shadow-elevated">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Sessions</h2>
              <Link to="/teacher/sessions">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sessions yet</p>
              ) : (
                recentSessions.map((session) => (
                  <div key={session._id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold">{session.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.date), "MMM dd")} • {format(new Date(session.startTime), "h:mm a")}
                      </p>
                    </div>
                    <Badge variant={session.isActive ? "default" : "outline"}>
                      {session.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Attendance */}
          <Card className="p-6 shadow-elevated">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Attendance</h2>
              <Link to="/teacher/attendance">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentAttendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No attendance records yet</p>
              ) : (
                recentAttendance.map((record) => (
                  <div key={record._id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold">{record.student?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.attendanceSession?.subject} • {format(new Date(record.timestamp), "MMM dd, h:mm a")}
                      </p>
                    </div>
                    <Badge className={
                      record.status === 'Present' ? "bg-accent" :
                      record.status === 'Pending' ? "bg-warning" :
                      record.status === 'Suspicious' ? "bg-orange-500" :
                      "bg-destructive"
                    }>
                      {record.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 shadow-elevated">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/teacher/sessions/create">
              <Button className="w-full gap-2" size="lg">
                <Plus className="h-5 w-5" />
                Create Session
              </Button>
            </Link>
            <Link to="/teacher/sessions">
              <Button variant="outline" className="w-full gap-2" size="lg">
                <Users className="h-5 w-5" />
                Manage Sessions
              </Button>
            </Link>
            <Link to="/teacher/attendance">
              <Button variant="outline" className="w-full gap-2" size="lg">
                <Download className="h-5 w-5" />
                View Attendance
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
