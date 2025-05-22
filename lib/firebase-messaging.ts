import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase";
import { getDatabase, ref, set } from "firebase/database";

const messaging = getMessaging(app);
const database = getDatabase(app);

export const requestPermissionAndGetToken = async () => {
  try {
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    console.log("Permission:", permission);
    
    if (permission === "granted") {
      const vapidKey = "BEHGQO1_uZ6BKCrrQQPxkmyfPDiJf7NDOlcZ62NmjkEQjWX6qkyqr0r8YSwUHYrHRPjxHGte-yoC1TElELem-IQ";

      try {
        // Ensure service worker is registered and ready before requesting token
        console.log("Registering service worker...");
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("Service worker registered:", swRegistration);
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service worker is ready");

        // Get FCM token
        console.log("Getting FCM token...");
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration,
        });
        
        console.log("FCM Token obtained:", token);
      } catch (err) {
        console.error("Error during FCM token setup:", err);
      }
    } else {
      console.log("Notification permission denied");
    }
  } catch (err) {
    console.error("Permission denied or error occurred:", err);
  }
  return null;
};

// Handle foreground messages
export const setupForegroundNotifications = () => {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Extract notification data
    const title = payload.notification?.title || 'New Alert';
    const options = {
      body: payload.notification?.body || '',
      icon: '/logo192.png',
      // Add any additional data from payload if needed
      data: payload.data
    };
    
    // Show notification in foreground
    // We need to create the notification manually as onMessage doesn't do it automatically
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.showNotification(title, options);
        } else {
          // Fallback to regular Notification if service worker not available
          new Notification(title, options);
        }
      });
    }
  });
};

export { messaging, onMessage };