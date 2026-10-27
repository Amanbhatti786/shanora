import './globals.css';

export const metadata = {
  title: 'Shanora PK | Pakistan’s Graduate Career & Talent Network',
  description: 'Verified entry-level jobs, AI degree-to-career roadmaps, ATS resume audits, and direct recruiter matching for Pakistani graduates.',
  metadataBase: new URL('https://shanora-pk.vercel.app'),
  openGraph: {
    title: 'Shanora PK - Land Your First Career Role in Pakistan',
    description: 'Fresh graduate opportunities in Lahore, Karachi, Islamabad. Scan CV with AI & connect directly with hiring teams.',
    url: 'https://shanora-pk.vercel.app',
    siteName: 'Shanora Pakistan',
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shanora PK - Graduate Career Platform',
    description: 'Verified entry-level jobs and AI career roadmaps for Pakistani students.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#090d16', color: '#f8fafc', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
