import './globals.css';
import './leaderboard.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'carboniq — Build a Greener Web, One Site at a Time',
  description: 'Analyze the carbon footprint of any website. Measure page weight, resource usage, server energy source, and get actionable tips to reduce CO₂ emissions.',
  openGraph: {
    title: 'carboniq — Build a Greener Web, One Site at a Time',
    description: 'Discover how much CO₂ your website produces per visit and learn how to reduce it.',
    type: 'website',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌱</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
