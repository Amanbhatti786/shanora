import './globals.css';
import { Suspense } from 'react';
import BottomNav from '../components/BottomNav';

export const metadata = {
  title: "Shanora.pk",
  description: "Connect with verified creators, discover executive career opportunities, build ATS-friendly resumes, and grow your professional network on Shanora.",
  metadataBase: new URL('https://shanora-pk.vercel.app'),
  openGraph: {
    title: "Shanora.pk | Professional Networking & Creator Platform",
    description: "Empowering Pakistan's talent with executive networking, verified credentials, and ATS resume tools.",
    url: 'https://shanora-pk.vercel.app',
    siteName: 'SHANORA.PK',
    images: [{ url: '/og-image.png' }],
    type: 'website'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#070b14',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          width: '100%',
          overflowX: 'hidden'
        }}
      >
        <div style={{ paddingBottom: '76px', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
          {children}
        </div>

        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
