import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";



const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dronacharya — AI-Powered NCERT Tutor",
  description:
    "Learn smarter with AI-generated mind maps, quizzes, flashcards, voice tutoring, debates, and boss fights for NCERT curriculum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body
          className={`${outfit.variable} ${geistMono.variable} antialiased font-sans font-medium scrollbar-hide`}
        >
          {children}
        </body>


      </ClerkProvider>
    </html>
  );
}
