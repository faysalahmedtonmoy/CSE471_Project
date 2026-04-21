// REMOVE THE IMPORT LINE HERE
import NotificationSystem from '../components/NotificationSystem';

export const metadata = {
  title: "AshePashe",
  description: "Find nearby services instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NotificationSystem />
        {children}
      </body>
    </html>
  );
}