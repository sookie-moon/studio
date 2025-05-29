import type {Metadata} from 'next';
import { Poppins } from 'next/font/google'; // Changed from Geist to Poppins
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { SoundProvider } from '@/contexts/SoundContext';

const poppins = Poppins({ // Configured Poppins
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], // Added common weights
  variable: '--font-poppins', // CSS variable for Poppins
});

export const metadata: Metadata = {
  title: 'WordCraft Duel',
  description: 'Hangman battle game with single and two player modes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}> {/* Applied Poppins variable */}
        <FirebaseProvider>
          <SoundProvider>
            {children}
            <Toaster />
          </SoundProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
