import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, Calendar, Percent } from "lucide-react";
import { attendanceAPI } from "@/lib/api";
import { toast } from "sonner";
import { format, isSameDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    name: string;
    studentId: string;
  };
  attendanceSession: {
    _id: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  qrScanned: boolean;
  faceVerified: boolean;
  status: 'Present' | 'Absent' | 'Pending' | 'Suspicious';
  timestamp: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    pending: 0,
    suspicious: 0,
    attendancePercentage: 0,
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'today'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getStudentRecords(user?.id || '');
      
      if (response.success) {
        const records: AttendanceRecord[] = response.data.records || [];
        
        // Calculate statistics
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
        const absent = records.filter(r => r.status === 'Absent').length;
        const pending = records.filter(r => r.status === 'Pending').length;
        const suspicious = records.filter(r => r.status === 'Suspicious').length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

        setStats({
          totalClasses: total,
          present,
          absent,
          pending,
          suspicious,
          attendancePercentage: parseFloat(percentage),
        });

        setAttendanceRecords(records);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    { title: "Total Classes", value: stats.totalClasses.toString(), icon: Calendar, variant: "default" as const },
    { 
      title: "Present", 
      value: stats.present.toString(), 
      icon: CheckCircle, 
      variant: "success" as const, 
      trend: { value: `${stats.attendancePercentage}%`, isPositive: true } 
    },
    { title: "Absent", value: stats.absent.toString(), icon: XCircle, variant: "danger" as const },
    { title: "Pending", value: stats.pending.toString(), icon: Clock, variant: "warning" as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-accent text-accent-foreground";
      case "Absent":
        return "bg-destructive text-destructive-foreground";
      case "Pending":
        return "bg-warning text-warning-foreground";
      case "Suspicious":
        return "bg-orange-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Layout userRole="student">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  const getRecordDate = (record: AttendanceRecord) => {
    if (record.attendanceSession?.date) {
      return new Date(record.attendanceSession.date);
    }
    if (record.attendanceSession?.startTime) {
      return new Date(record.attendanceSession.startTime);
    }
    return new Date(record.timestamp);
  };

  const filteredAttendance =
    filterMode === 'today'
      ? attendanceRecords.filter((record) => isSameDay(getRecordDate(record), new Date()))
      : attendanceRecords;

  const displayedAttendance = filteredAttendance.slice(0, 10);

  return (
    <Layout userRole="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back, {user?.name}!</h1>
          <p className="text-muted-foreground">Here's your attendance overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        <Card className="p-6 shadow-elevated">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Attendance</h2>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Percent className="h-3 w-3" />
                {stats.attendancePercentage}% Overall
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant={filterMode === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterMode('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterMode === 'today' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterMode('today')}
                >
                  Today
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Verification</th>
                </tr>
              </thead>
              <tbody>
                {displayedAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  displayedAttendance.map((record) => (
                    <tr key={record._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4">
                        {format(new Date(record.timestamp), "yyyy-MM-dd")}
                      </td>
                      <td className="py-4 font-medium">
                        {record.attendanceSession?.subject || 'N/A'}
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {record.attendanceSession?.startTime 
                          ? format(new Date(record.attendanceSession.startTime), "h:mm a")
                          : 'N/A'}
                      </td>
                      <td className="py-4">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        {record.qrScanned && record.faceVerified ? (
                          <Badge variant="outline" className="gap-1 border-accent text-accent">
                            <CheckCircle className="h-3 w-3" />
                            Both Verified
                          </Badge>
                        ) : record.qrScanned ? (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            QR Only
                          </Badge>
                        ) : record.faceVerified ? (
                          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500">
                            <Clock className="h-3 w-3" />
                            Face Only
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
