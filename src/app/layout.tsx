import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Engy Up",
  description:
    "Interactive English language learning platform with engaging activities for grades 7–12.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Top nav */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                E
              </div>
              <span className="font-bold text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                Engy Up
              </span>
            </a>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border py-8 mt-16">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted">
            © {new Date().getFullYear()} Engy Up. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
