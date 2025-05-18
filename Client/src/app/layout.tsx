
import type { Metadata } from 'next';
// Removed GeistSans and GeistMono imports
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// const geistSans = GeistSans; // Removed
// const geistMono = GeistMono; // Removed

export const metadata: Metadata = {
  title: 'AI·GOTCHA', // Updated title
  description: 'AI-powered chat by AI·GOTCHA', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}> {/* Updated className */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
