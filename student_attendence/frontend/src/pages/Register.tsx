import { useState, useRef } from "react"; // useRef import karein
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Camera, UserCheck } from "lucide-react"; // Camera icons import karein
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Webcam from "react-webcam"; // Webcam library import karein

// --- YEH HAI .tsx ke liye zaroori ---
// Webcam component ke type ko import karein
type WebcamRef = Webcam & {
  getScreenshot: () => string | null;
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Student state ko type karein
  const [studentData, setStudentData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    imageSrc: null as string | null, // --- TYPE --- imageSrc string ya null ho sakta hai
  });
  
  const [teacherData, setTeacherData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [hodData, setHodData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminSecret: "",
  });

  // --- TYPE --- Webcam ref ko sahi se type karein
  const webcamRef = useRef<WebcamRef>(null);
  const [showWebcam, setShowWebcam] = useState(false);

  const captureFace = () => {
    // Check karein ki webcamRef.current maujood hai
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setStudentData({ ...studentData, imageSrc: imageSrc });
      setShowWebcam(false);
      toast.success("Face captured!");
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation mein image check karein
    if (!studentData.name || !studentData.email || !studentData.password || !studentData.studentId || !studentData.imageSrc) {
      toast.error("Please fill in all fields and capture your face image");
      return;
    }

    if (studentData.password !== studentData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (studentData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Backend ko 'faceImage' (Base64 string) bhejein
      await register({
        name: studentData.name,
        email: studentData.email,
        password: studentData.password,
        role: "student",
        studentId: studentData.studentId,
        faceImage: studentData.imageSrc, // Yahan image bhej rahe hain
      });
      toast.success("Registration successful! Wait for HOD verification before login.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherRegister = async (e: React.FormEvent) => {
    // ... (Aapka teacher registration code jaisa tha waisa hi hai)
    e.preventDefault();
    
    if (!teacherData.name || !teacherData.email || !teacherData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (teacherData.password !== teacherData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (teacherData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: teacherData.name,
        email: teacherData.email,
        password: teacherData.password,
        role: "teacher",
      });
      toast.success("Registration successful! Wait for HOD verification before login.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHodRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hodData.name || !hodData.email || !hodData.password || !hodData.adminSecret) {
      toast.error("Please fill in all fields including HOD code");
      return;
    }

    if (hodData.password !== hodData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (hodData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: hodData.name,
        email: hodData.email,
        password: hodData.password,
        role: "admin",
        adminSecret: hodData.adminSecret,
      });
      toast.success("HOD account created successfully! You can now login.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "HOD registration failed. Check the HOD code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ... (Header) ... */}
        <div className="mb-8 text-center">
         <Link to="/" className="inline-flex items-center gap-2 mb-4">
           <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
             <QrCode className="h-6 w-6 text-white" />
           </div>
           <span className="text-2xl font-bold text-white">AttendEase</span>
         </Link>
         <p className="text-white/80">Create a new account</p>
       </div>

        <Card className="p-6 shadow-elevated">
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
              <TabsTrigger value="hod">HOD</TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <form onSubmit={handleStudentRegister} className="space-y-4">
                {/* --- Student ke fields --- */}
                <div className="space-y-2">
                  <Label htmlFor="studentName">Full Name</Label>
                  <Input id="studentName" placeholder="Enter your full name" value={studentData.name} onChange={(e) => setStudentData({...studentData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email</Label>
                  <Input id="studentEmail" type="email" placeholder="Enter your email" value={studentData.email} onChange={(e) => setStudentData({...studentData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input id="studentId" placeholder="Enter your student ID" value={studentData.studentId} onChange={(e) => setStudentData({...studentData, studentId: e.target.value})} required />
                </div>

                {/* --- Face Capture Section --- */}
                <div className="space-y-2">
                  <Label>Face Registration</Label>
                  {showWebcam ? (
                    <div className="rounded-md overflow-hidden border">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width="100%"
                        videoConstraints={{ facingMode: "user" }}
                      />
                      <Button type="button" onClick={captureFace} className="w-full rounded-t-none">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Click Photo
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setShowWebcam(true)} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      {studentData.imageSrc ? "Recapture Face" : "Capture Face"}
                    </Button>
                  )}
                  {studentData.imageSrc && !showWebcam && (
                    <div className="p-2 border rounded-md mt-2">
                      <p className="text-sm text-center text-green-600 mb-2">Face Captured!</p>
                      <img src={studentData.imageSrc} alt="Face preview" className="rounded-md" />
                    </div>
                  )}
                </div>
                {/* --- End Face Capture --- */}

                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Password</Label>
                  <Input id="studentPassword" type="password" placeholder="Enter your password" value={studentData.password} onChange={(e) => setStudentData({...studentData, password: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentConfirmPassword">Confirm Password</Label>
                  <Input id="studentConfirmPassword" type="password" placeholder="Confirm your password" value={studentData.confirmPassword} onChange={(e) => setStudentData({...studentData, confirmPassword: e.target.value})} required />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register as Student"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="teacher">
              {/* --- Teacher ke fields (jaisa pehle tha) --- */}
              <form onSubmit={handleTeacherRegister} className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="teacherName">Full Name</Label>
                   <Input id="teacherName" placeholder="Enter your full name" value={teacherData.name} onChange={(e) => setTeacherData({...teacherData, name: e.target.value})} required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="teacherEmail">Email</Label>
                   <Input id="teacherEmail" type="email" placeholder="Enter your email" value={teacherData.email} onChange={(e) => setTeacherData({...teacherData, email: e.target.value})} required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="teacherPassword">Password</Label>
                   <Input id="teacherPassword" type="password" placeholder="Enter your password" value={teacherData.password} onChange={(e) => setTeacherData({...teacherData, password: e.target.value})} required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="teacherConfirmPassword">Confirm Password</Label>
                   <Input id="teacherConfirmPassword" type="password" placeholder="Confirm your password" value={teacherData.confirmPassword} onChange={(e) => setTeacherData({...teacherData, confirmPassword: e.target.value})} required />
                 </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register as Teacher"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="hod">
              <form onSubmit={handleHodRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hodName">Full Name</Label>
                  <Input
                    id="hodName"
                    placeholder="Enter your full name"
                    value={hodData.name}
                    onChange={(e) => setHodData({ ...hodData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hodEmail">Email</Label>
                  <Input
                    id="hodEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={hodData.email}
                    onChange={(e) => setHodData({ ...hodData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hodSecret">HOD Registration Code</Label>
                  <Input
                    id="hodSecret"
                    type="password"
                    placeholder="Enter HOD code (set on server)"
                    value={hodData.adminSecret}
                    onChange={(e) => setHodData({ ...hodData, adminSecret: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hodPassword">Password</Label>
                  <Input
                    id="hodPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={hodData.password}
                    onChange={(e) => setHodData({ ...hodData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hodConfirmPassword">Confirm Password</Label>
                  <Input
                    id="hodConfirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={hodData.confirmPassword}
                    onChange={(e) => setHodData({ ...hodData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register as HOD"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-primary transition-colors">
              Already have an account? Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;