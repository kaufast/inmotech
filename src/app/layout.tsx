import { ReactNode } from 'react';
import { SecureAuthProvider } from '@/contexts/SecureAuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <title>InmoTech - Real Estate Investment Platform</title>
      </head>
      <body>
        <SecureAuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </SecureAuthProvider>
      </body>
    </html>
  );
}