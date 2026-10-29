import './globals.css';
import BottomNav from '../components/BottomNav';

export const metadata = {
  title: 'Shanora.pk - Social & Professional Network',
  description: 'Connect, Create Pages, and Network in Pakistan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#070b14', color: '#f8fafc' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
