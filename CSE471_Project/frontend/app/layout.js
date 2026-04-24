import NotificationSystem from '../components/NotificationSystem';
import PushNotificationManager from '../components/PushNotificationManager';
import './globals.css';

export const metadata = {
  title: "AshePashe",
  description: "Find nearby services instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PushNotificationManager>
          <NotificationSystem />
          {children}
        </PushNotificationManager>
      </body>
    </html>
  );
}