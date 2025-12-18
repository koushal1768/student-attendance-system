import { useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, RefreshCw, Clock, PlayCircle, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { sessionAPI } from "@/lib/api";
import { format } from "date-fns";

const GenerateQR = () => {
  const [qrGenerated, setQrGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState({
    subject: "",
    room: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
  });
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [faceRecognitionActive, setFaceRecognitionActive] = useState(false);
  const [startingFaceRecognition, setStartingFaceRecognition] = useState(false);

  const handleGenerate = async () => {
    if (!sessionData.subject || !sessionData.date || !sessionData.startTime || !sessionData.endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Format dates for API
      const startDateTime = new Date(`${sessionData.date}T${sessionData.startTime}`);
      const endDateTime = new Date(`${sessionData.date}T${sessionData.endTime}`);

      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time");
        setLoading(false);
        return;
      }

      const response = await sessionAPI.createSession({
        subject: sessionData.subject,
        date: sessionData.date,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (response.success) {
        setQrGenerated(true);
        setQrCodeImage(response.data.qrCode.image);
        setCurrentSession(response.data.session);
        toast.success("Session created and QR code generated successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const handleStartFaceRecognition = async () => {
    if (!currentSession?._id) {
      toast.error("No active session");
      return;
    }

    setStartingFaceRecognition(true);
    try {
      const response = await sessionAPI.startFaceRecognition(currentSession._id);
      if (response.success) {
        setFaceRecognitionActive(true);
        toast.success("Face recognition started!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start face recognition");
    } finally {
      setStartingFaceRecognition(false);
    }
  };

  const handleStopFaceRecognition = async () => {
    if (!currentSession?._id) {
      return;
    }

    try {
      const response = await sessionAPI.stopFaceRecognition(currentSession._id);
      if (response.success) {
        setFaceRecognitionActive(false);
        toast.success("Face recognition stopped!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to stop face recognition");
    }
  };

  const handleReset = () => {
    setQrGenerated(false);
    setSessionData({
      subject: "",
      room: "",
      date: new Date().toISOString().split('T')[0],
      startTime: "",
      endTime: "",
    });
    setQrCodeImage(null);
    setCurrentSession(null);
    setFaceRecognitionActive(false);
  };

  const handleDownload = () => {
    if (qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `qr-code-${sessionData.subject}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR code downloaded");
    }
  };

  return (
    <Layout userRole="teacher">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create Attendance Session</h1>
          <p className="text-muted-foreground">Create a new attendance session with QR code</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Panel */}
          <Card className="p-6 shadow-elevated">
            <h2 className="text-xl font-bold mb-6">Session Configuration</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Data Structures"
                  value={sessionData.subject}
                  onChange={(e) => setSessionData({...sessionData, subject: e.target.value})}
                  disabled={qrGenerated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  placeholder="e.g., CS-101"
                  value={sessionData.room}
                  onChange={(e) => setSessionData({...sessionData, room: e.target.value})}
                  disabled={qrGenerated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={sessionData.date}
                  onChange={(e) => setSessionData({...sessionData, date: e.target.value})}
                  disabled={qrGenerated}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={sessionData.startTime}
                    onChange={(e) => setSessionData({...sessionData, startTime: e.target.value})}
                    disabled={qrGenerated}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={sessionData.endTime}
                    onChange={(e) => setSessionData({...sessionData, endTime: e.target.value})}
                    disabled={qrGenerated}
                  />
                </div>
              </div>

              <div className="pt-4">
                {!qrGenerated ? (
                  <Button 
                    onClick={handleGenerate} 
                    className="w-full gap-2" 
                    size="lg"
                    disabled={loading}
                  >
                    <QrCode className="h-5 w-5" />
                    {loading ? "Creating..." : "Create Session & Generate QR Code"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="w-full gap-2" 
                    size="lg"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Create New Session
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* QR Display Panel */}
          <Card className="p-6 shadow-elevated">
            <h2 className="text-xl font-bold mb-6">QR Code Display</h2>
            
            {qrGenerated && qrCodeImage ? (
              <div className="space-y-6">
                {/* QR Code */}
                <div className="aspect-square bg-white rounded-2xl p-8 flex items-center justify-center border-4 border-primary">
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Session Info */}
                {currentSession && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subject:</span>
                      <span className="font-semibold">{currentSession.subject}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-semibold">
                        {format(new Date(currentSession.date), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(currentSession.startTime), "h:mm a")} - {format(new Date(currentSession.endTime), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">QR Code String:</span>
                      <span className="font-mono text-xs">{currentSession.qrCodeString?.substring(0, 8)}...</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <Button 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Display this QR code for students to scan
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Fill in the session details and create a session
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Active Session Controls */}
        {qrGenerated && currentSession && (
          <Card className="p-6 shadow-elevated">
            <h2 className="text-xl font-bold mb-4">Session Controls</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="font-semibold">{currentSession.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentSession.date), "MMM dd, yyyy")} • {format(new Date(currentSession.startTime), "h:mm a")} - {format(new Date(currentSession.endTime), "h:mm a")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {currentSession.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!faceRecognitionActive ? (
                    <Button 
                      onClick={handleStartFaceRecognition}
                      disabled={startingFaceRecognition}
                      variant="outline"
                      className="gap-2"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {startingFaceRecognition ? "Starting..." : "Start Face Recognition"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStopFaceRecognition}
                      variant="destructive"
                      className="gap-2"
                    >
                      <StopCircle className="h-4 w-4" />
                      Stop Face Recognition
                    </Button>
                  )}
                </div>
              </div>
              {faceRecognitionActive && (
                <div className="rounded-lg bg-accent/10 border border-accent p-3">
                  <p className="text-sm text-accent font-medium">
                    ✓ Face recognition is active. CCTV will automatically verify students.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GenerateQR;
