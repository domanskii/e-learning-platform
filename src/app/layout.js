import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bezpieczny Start",
  description: "Platforma e-learningowa doszkalająca młodych kierowców",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 min-h-screen flex flex-col`}>
        {/* Powiadomienia globalne */}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        
        {/* Główna zawartość */}
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}
