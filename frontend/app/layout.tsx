import type { Metadata } from 'next';
import './globals.css';
import { CustomCursor } from '@/components/CustomCursor';

export const metadata: Metadata = {
  title: 'HireAI — AI Video Interview Platform',
  description: 'The AI that interviews for you. 24/7. At scale. Without bias.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#06030f]">
      <body className="bg-[#06030f] min-h-screen text-white antialiased">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
