// client/src/utils/notifications.js
import api from './api';

const VAPID_PUBLIC_KEY = 'BM2__OVIdLaN7VEj_fEthvnpam9fRNI9KOIr7zH6OOzNo2mYq8QrcrmGv7qvzL1uXGQzk4dkTz_aiLGLX1oJTu8';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToNotifications = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if we already have a subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe the user
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('User subscribed to push notifications');
    }

    // Send subscription to server
    await api.post('/subscribe', subscription);
    console.log('Subscription sent to server');
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
  }
};

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};
