import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Shield, Users, BarChart3, CheckCircle, Camera } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: QrCode,
      title: "QR Code Scanning",
      description: "Quick and secure attendance marking via unique QR codes generated per session"
    },
    {
      icon: Camera,
      title: "Face Recognition",
      description: "CCTV-based verification to prevent proxy attendance and ensure authenticity"
    },
    {
      icon: Shield,
      title: "Dual Verification",
      description: "Combined QR + Face match ensures accurate and fraud-proof attendance"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Comprehensive dashboards with attendance trends and exportable reports"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
              Smart Attendance System
            </h1>
            <p className="mb-8 max-w-2xl text-xl text-white/90">
              QR Code + CCTV Face Recognition for secure, automated attendance tracking in educational institutions
            </p>
            <div className="flex gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elevated">
                  Get Started
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Choose AttendEase?</h2>
            <p className="text-muted-foreground">
              Cutting-edge technology for fraud-proof attendance management
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">Simple, secure, and efficient attendance process</p>
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              {[
                { step: 1, title: "Teacher Generates QR Code", desc: "Unique QR code created for each class session" },
                { step: 2, title: "Students Scan QR Code", desc: "Students scan the code using their mobile devices" },
                { step: 3, title: "Face Recognition Verification", desc: "CCTV system verifies student presence" },
                { step: 4, title: "Attendance Marked", desc: "Dual verification confirms and logs attendance" }
              ].map((item) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-primary text-white font-bold shadow-elevated">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary p-12 text-center shadow-elevated">
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to Transform Your Attendance System?</h2>
            <p className="mb-8 text-white/90">
              Join educational institutions already using AttendEase for accurate, fraud-proof attendance
            </p>
            <Link to="/login">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elevated">
                Start Free Trial
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 AttendEase - Smart Student Attendance System</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
