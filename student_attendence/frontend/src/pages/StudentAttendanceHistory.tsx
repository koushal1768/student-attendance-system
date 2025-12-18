import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attendanceAPI } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const StudentAttendanceHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getStudentRecords(user?.id || '');
      
      if (response.success) {
        setRecords(response.data.records || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

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

  // Calculate statistics
  const stats = {
    total: records.length,
    present: records.filter((r: any) => r.status === 'Present').length,
    absent: records.filter((r: any) => r.status === 'Absent').length,
    pending: records.filter((r: any) => r.status === 'Pending').length,
    suspicious: records.filter((r: any) => r.status === 'Suspicious').length,
    percentage: records.length > 0 
      ? ((records.filter((r: any) => r.status === 'Present').length / records.length) * 100).toFixed(1)
      : '0'
  };

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set<string>();
    records.forEach((record: any) => {
      if (record.attendanceSession?.subject) {
        uniqueSubjects.add(record.attendanceSession.subject);
      }
    });
    return Array.from(uniqueSubjects);
  }, [records]);

  const filteredRecords = subjectFilter === "all"
    ? records
    : records.filter((record: any) => record.attendanceSession?.subject === subjectFilter);

  if (loading) {
    return (
      <Layout userRole="student">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading attendance history...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Attendance History</h1>
          <p className="text-muted-foreground">View your complete attendance records</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Classes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-accent">{stats.present}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Attendance %</p>
            <p className="text-2xl font-bold text-accent">{stats.percentage}%</p>
          </Card>
        </div>

        {/* Records Table */}
        <Card className="p-6 shadow-elevated">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Attendance Records</h2>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">QR Verified</th>
                  <th className="pb-3 font-medium">Face Verified</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {subjectFilter === "all"
                        ? "No attendance records found"
                        : `No records found for ${subjectFilter}`}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4">
                        {format(new Date(record.timestamp), "MMM dd, yyyy")}
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
                        <Badge variant={record.qrScanned ? "default" : "outline"}>
                          {record.qrScanned ? "✓" : "✗"}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={record.faceVerified ? "default" : "outline"}>
                          {record.faceVerified ? "✓" : "✗"}
                        </Badge>
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

export default StudentAttendanceHistory;



