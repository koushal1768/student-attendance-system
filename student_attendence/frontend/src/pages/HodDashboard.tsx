import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2 } from "lucide-react";
import { hodAPI } from "@/lib/api";
import { toast } from "sonner";

interface HodUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  studentId?: string;
  createdAt: string;
}

const HodDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pendingStudents, setPendingStudents] = useState<HodUser[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<HodUser[]>([]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await hodAPI.getPendingUsers();

      if (response.success) {
        const users: HodUser[] = response.data.users || [];
        setPendingStudents(users.filter((u) => u.role === "student"));
        setPendingTeachers(users.filter((u) => u.role === "teacher"));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      setVerifyingId(id);
      const response = await hodAPI.verifyUser(id);

      if (response.success) {
        toast.success("User verified successfully");
        // Local state se user hata dein
        setPendingStudents((prev) => prev.filter((u) => u._id !== id));
        setPendingTeachers((prev) => prev.filter((u) => u._id !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to verify user");
    } finally {
      setVerifyingId(null);
    }
  };

  const renderTable = (title: string, users: HodUser[]) => (
    <Card className="p-6 shadow-elevated">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Badge variant="outline">{users.length} pending</Badge>
      </div>

      {users.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">
          No pending {title.toLowerCase()} for verification
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                {title.includes("Students") && <th className="pb-3 font-medium">Student ID</th>}
                <th className="pb-3 font-medium">Registered On</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 font-medium">{user.name}</td>
                  <td className="py-3 text-sm text-muted-foreground">{user.email}</td>
                  {title.includes("Students") && (
                    <td className="py-3 text-sm">{user.studentId || "-"}</td>
                  )}
                  <td className="py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={verifyingId === user._id}
                      onClick={() => handleVerify(user._id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {verifyingId === user._id ? "Verifying..." : "Verify"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  return (
    <Layout userRole="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">HOD Dashboard</h1>
          <p className="text-muted-foreground">
            Verify newly registered students and teachers before they can access their dashboards.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-muted-foreground">Loading pending users...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {renderTable("Pending Students", pendingStudents)}
            {renderTable("Pending Teachers", pendingTeachers)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HodDashboard;


