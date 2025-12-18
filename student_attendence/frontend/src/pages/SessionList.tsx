import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, StopCircle, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { sessionAPI } from "@/lib/api";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const SessionList = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.getSessions();
      if (response.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleStartFaceRecognition = async (sessionId: string) => {
    try {
      const response = await sessionAPI.startFaceRecognition(sessionId);
      if (response.success) {
        toast.success("Face recognition started!");
        fetchSessions();
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to start face recognition");
    }
  };

  const handleStopFaceRecognition = async (sessionId: string) => {
    try {
      const response = await sessionAPI.stopFaceRecognition(sessionId);
      if (response.success) {
        toast.success("Face recognition stopped!");
        fetchSessions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to stop face recognition");
    }
  };

  const handleDeactivate = async (sessionId: string) => {
    try {
      const response = await sessionAPI.updateSession(sessionId, { isActive: false });
      if (response.success) {
        toast.success("Session deactivated!");
        fetchSessions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to deactivate session");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      const response = await sessionAPI.deleteSession(sessionId);
      if (response.success) {
        toast.success("Session deleted!");
        fetchSessions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete session");
    }
  };

  if (loading) {
    return (
      <Layout userRole="teacher">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="teacher">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Sessions</h1>
            <p className="text-muted-foreground">View and manage your attendance sessions</p>
          </div>
          <Link to="/teacher/sessions/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </Link>
        </div>

        <Card className="p-6 shadow-elevated">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No sessions created yet</p>
              <Link to="/teacher/sessions/create">
                <Button>Create Your First Session</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{session.subject}</h3>
                      <Badge variant={session.isActive ? "default" : "outline"}>
                        {session.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {session.faceRecognitionActive && (
                        <Badge variant="outline" className="border-accent text-accent">
                          Face Recognition Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Date: {format(new Date(session.date), "MMM dd, yyyy")}</p>
                      <p>Time: {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}</p>
                      <p className="font-mono text-xs">QR: {session.qrCodeString?.substring(0, 16)}...</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {session.isActive && !session.faceRecognitionActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartFaceRecognition(session._id)}
                        className="gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Start Face Recognition
                      </Button>
                    )}
                    {session.faceRecognitionActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStopFaceRecognition(session._id)}
                        className="gap-2"
                      >
                        <StopCircle className="h-4 w-4" />
                        Stop Face Recognition
                      </Button>
                    )}
                    {session.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(session._id)}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(session._id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default SessionList;



