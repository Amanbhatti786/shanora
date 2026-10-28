export const metadata = {
  title: 'Shanora PK',
  description: 'Graduate Careers & Portfolios',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#090d16', color: '#f8fafc' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
