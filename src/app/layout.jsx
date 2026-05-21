import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PasswordLockGuard from "@/components/ui/PasswordLockGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "My Minimal Todo",
  description: "自分専用のシンプルなTODOリスト",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <PasswordLockGuard>
          {children}
        </PasswordLockGuard>
      </body>
    </html>
  );
}
