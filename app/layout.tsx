import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { AppProvider } from "@/context/AppContext";
import ToastContainer from "@/components/ui/Toast";
import XPPopupLayer from "@/components/ui/XPPopup";

export const metadata: Metadata = {
  title: "EduPro — Professional Student Management Platform",
  description: "Track attendance, manage assignments, study smarter, and level up your academic journey with EduPro.",
  keywords: ["student", "attendance", "assignments", "study", "academic", "timetable"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Run before React hydration — reads saved theme from localStorage to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('edupro-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <AppProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
            <XPPopupLayer />
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
