import { useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScanLine, Camera, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { attendanceAPI } from "@/lib/api";
import QrScanner from 'react-qr-scanner'; // Camera scanner

const ScanQR = () => {
  const [scanning, setScanning] = useState(false);
  const [qrCodeString, setQrCodeString] = useState("");
  const [scanResult, setScanResult] = useState<'success' | 'pending' | 'failed' | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);

const processQrCode = async (code: string) => {
    if (!code.trim()) {
      toast.error("QR code string is empty");
      return;
    }

    setScanning(true);
    setShowCamera(false); 

    let qrStringToSend = code.trim(); // Pehle default value set karein

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(code.trim());
      // Check if the expected key exists
      if (parsed.qrCodeString) {
        qrStringToSend = parsed.qrCodeString;
      }
      // Agar JSON hai par key nahi hai, toh hum raw code hi use karenge
      
    } catch {
      // Yeh JSON nahi hai, plain string hai.
      // qrStringToSend pehle se hi sahi set hai.
    }

    // --- YEH HAI FIX ---
    // Ab input field mein hamesha clean string hi set hogi
    setQrCodeString(qrStringToSend);
    // --- FIX KHATAM ---

    try {
      const response = await attendanceAPI.scanQR(qrStringToSend);
      
      if (response.success) {
        setAttendanceRecord(response.data.attendanceRecord);
        if (response.data.attendanceRecord.status === 'Present') {
          setScanResult('success');
          toast.success("Attendance marked as Present!");
        } else {
          setScanResult('pending');
          toast.success("QR code scanned. Waiting for face verification...");
        }
      }
    } catch (error: any) {
      setScanning(false);
      setScanResult('failed');
      toast.error(error.response?.data?.message || "Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitString = () => {
    processQrCode(qrCodeString);
  };

  const handleScannerScan = (data: any) => {
    if (data) {
      processQrCode(data.text);
    }
  };

  const handleScannerError = (err: any) => {
    console.error(err);
    toast.error("Camera error. Please check permissions.");
    setShowCamera(false);
  };

  const handleReset = () => {
    setScanResult(null);
    setQrCodeString("");
    setAttendanceRecord(null);
    setShowCamera(false);
  };

  return (
    <Layout userRole="student">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Scan QR Code</h1>
          <p className="text-muted-foreground">
            Scan the classroom QR code to mark your attendance
          </p>
        </div>

        <Card className="p-8 shadow-elevated">
          <div className="space-y-6">
            {/* QR Code Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">QR Code String</label>
              <Input
                placeholder="Paste QR code string or scan QR code"
                value={qrCodeString}
                onChange={(e) => setQrCodeString(e.target.value)}
                disabled={scanning || scanResult === 'success' || showCamera}
              />
              <p className="text-xs text-muted-foreground">
                You can paste the QR code data or just the QR code string (UUID)
              </p>
            </div>

            {/* Scanner Area */}
            <div className="relative aspect-square bg-muted rounded-2xl flex items-center justify-center overflow-hidden">
              
              {showCamera ? (
                <QrScanner
                  delay={300}
                  onError={handleScannerError}
                  onScan={handleScannerScan}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <>
                  {/* --- YEH SAB MISSING THA --- */}
                  {scanResult === null && (
                    <div className="text-center">
                      <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary">
                        <ScanLine className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {scanning ? "Scanning..." : "Enter QR string or press 'Scan with Camera'"}
                      </p>
                    </div>
                  )}

                  {scanResult === 'success' && (
                    <div className="text-center">
                      <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-success">
                        <CheckCircle className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-accent mb-2">Attendance Marked!</h3>
                      <p className="text-sm text-muted-foreground">
                        Status: {attendanceRecord?.status || 'Present'}
                      </p>
                    </div>
                  )}

                  {scanResult === 'pending' && (
                    <div className="text-center">
                      <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-warning">
                        <Clock className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-warning mb-2">Verification Pending</h3>
                      <p className="text-sm text-muted-foreground">
                        QR scanned. Waiting for face recognition verification from CCTV
                      </p>
                    </div>
                  )}

                  {scanResult === 'failed' && (
                    <div className="text-center">
                      <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-destructive">
                        <XCircle className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-destructive mb-2">Scan Failed</h3>
                      <p className="text-sm text-muted-foreground">Please try again or contact your teacher</p>
                    </div>
                  )}
                  {/* --- FIX KHATAM --- */}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={handleSubmitString}
                disabled={scanning || scanResult === 'success' || showCamera}
                className="flex-1 gap-2"
                size="lg"
              >
                <ScanLine className="h-5 w-5" />
                Submit QR String
              </Button>
              
              <Button 
                onClick={() => setShowCamera(!showCamera)}
                disabled={scanning || scanResult === 'success'}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Camera className="h-5 w-5" />
                {showCamera ? "Close Camera" : "Scan with Camera"}
              </Button>
            </div>

            {scanResult && (
              <Button 
                onClick={handleReset} 
                variant="outline"
                size="lg"
                className="w-full"
              >
                Scan Again
              </Button>
            )}

            {/* Instructions */}
            <Card className="p-4 bg-muted/50">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Ensure you're in the correct classroom</li>
                <li>• Get the QR code from your teacher</li>
                <li>• Paste the QR code string or scan it with your camera</li>
                <li>• Stand in view of the CCTV camera for face verification</li>
                <li>• Attendance will be marked as Present when both QR and face are verified</li>
              </ul>
            </Card>
          </div>
        </Card>

        {/* Verification Status */}
        {attendanceRecord && (
          <Card className="p-6 shadow-soft">
            <h3 className="font-semibold mb-4">Verification Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">QR Code Scanned:</span>
                <Badge variant={attendanceRecord.qrScanned ? "default" : "outline"}>
                  {attendanceRecord.qrScanned ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Yes</>
                  ) : (
                    "No"
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Face Recognition Verified:</span>
                <Badge variant={attendanceRecord.faceVerified ? "default" : "outline"}>
                  {attendanceRecord.faceVerified ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Yes</>
                  ) : (
                    "No"
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Status:</span>
                <Badge className={
                  attendanceRecord.status === 'Present' ? "bg-accent" :
                  attendanceRecord.status === 'Pending' ? "bg-warning" :
                  attendanceRecord.status === 'Suspicious' ? "bg-orange-500" :
                  "bg-destructive"
                }>
                  {attendanceRecord.status}
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ScanQR;