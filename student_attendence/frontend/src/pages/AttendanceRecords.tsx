import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attendanceAPI, sessionAPI } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

const AttendanceRecords = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");

  useEffect(() => {
    fetchSessions();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getSessions();
      if (response.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = selectedSessionId !== "all" ? { sessionId: selectedSessionId } : undefined;
      const response = await attendanceAPI.getRecords(params);
      
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
  };

  if (loading) {
    return (
      <Layout userRole="teacher">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading attendance records...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="teacher">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Attendance Records</h1>
          <p className="text-muted-foreground">View and manage student attendance records</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
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
            <p className="text-sm text-muted-foreground">Suspicious</p>
            <p className="text-2xl font-bold text-orange-500">{stats.suspicious}</p>
          </Card>
        </div>

        {/* Filter */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Session:</label>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((session) => (
                  <SelectItem key={session._id} value={session._id}>
                    {session.subject} - {format(new Date(session.date), "MMM dd")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Records Table */}
        <Card className="p-6 shadow-elevated">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">QR</th>
                  <th className="pb-3 font-medium">Face</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4">
                        {format(new Date(record.timestamp), "MMM dd, yyyy")}
                      </td>
                      <td className="py-4 font-medium">
                        {record.student?.name || 'Unknown'} ({record.student?.studentId || 'N/A'})
                      </td>
                      <td className="py-4">
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

export default AttendanceRecords;

