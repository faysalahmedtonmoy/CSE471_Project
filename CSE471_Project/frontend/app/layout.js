import { ClerkProvider } from "@clerk/nextjs";
import NotificationSystem from '../components/NotificationSystem';
import PushNotificationManager from '../components/PushNotificationManager';
import PresenceTracker from '../components/PresenceTracker';
import './globals.css';

export const metadata = {
  title: "AshePashe",
  description: "Find nearby services instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <PushNotificationManager>
            <NotificationSystem />
            <PresenceTracker />
            {children}
          </PushNotificationManager>
        </ClerkProvider>
      </body>
    </html>
  );
}