// import { Stack } from 'expo-router';
// import { AuthProvider } from '../contexts/AuthContext';
// import { useEffect } from 'react';
// import { useFrameworkReady } from '../hooks/useFrameworkReady';

// export default function RootLayout() {
//   useFrameworkReady();

//   return (
//     <AuthProvider>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="login" options={{ headerShown: false }} />
//         <Stack.Screen name="register" options={{ headerShown: false }} />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
//       </Stack>
//     </AuthProvider>
//   );
// }

// import { Stack } from 'expo-router';
// import { AuthProvider } from '../contexts/AuthContext';
// import { useEffect, useRef } from 'react';
// import { useFrameworkReady } from '../hooks/useFrameworkReady';
// import * as Notifications from 'expo-notifications';
// import { router } from 'expo-router';

// // ── Global notification tap handler ──────────────────────────────────────────
// // When user taps the "🆘 Medical ID" lock screen notification,
// // this opens the offline SOS QR screen immediately.
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: false,
//     shouldSetBadge: false,
//   }),
// });

// export default function RootLayout() {
//   useFrameworkReady();
//   const notifListener = useRef<Notifications.Subscription>();
//   const notifResponseListener = useRef<Notifications.Subscription>();

//   useEffect(() => {
//     // Listen for notifications received while app is foregrounded
//     notifListener.current = Notifications.addNotificationReceivedListener(notification => {
//       const data = notification.request.content.data;
//       if (data?.screen === 'sos-qr') {
//         // Already in foreground — user can see the app
//         // No need to navigate, but we could open the SOS screen
//       }
//     });

//     // Listen for notification TAPS (when user taps from lock screen or shade)
//     notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
//       const data = response.notification.request.content.data;
//       if (data?.screen === 'sos-qr') {
//         // Navigate to the offline SOS QR screen
//         // Use a short timeout to ensure the navigator is ready
//         setTimeout(() => {
//           try { router.push('/sos-qr'); } catch { }
//         }, 300);
//       }
//     });

//     return () => {
//       if (notifListener.current)
//         Notifications.removeNotificationSubscription(notifListener.current);
//       if (notifResponseListener.current)
//         Notifications.removeNotificationSubscription(notifResponseListener.current);
//     };
//   }, []);

//   return (
//     <AuthProvider>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="login" options={{ headerShown: false }} />
//         <Stack.Screen name="register" options={{ headerShown: false }} />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="sos-qr" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
//         <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
//       </Stack>
//     </AuthProvider>
//   );
// }

// import { Stack } from 'expo-router';
// import { AuthProvider } from '../contexts/AuthContext';
// import { useEffect, useRef } from 'react';
// import { useFrameworkReady } from '../hooks/useFrameworkReady';
// import { router } from 'expo-router';
// import { Platform } from 'react-native';

// // ── Notification tap handler ──────────────────────────────────────────────────
// // expo-notifications push support was removed from Expo Go in SDK 53.
// // We guard the import so the app doesn't crash in Expo Go.
// // To get full lock-screen notification support, create a development build:
// //   npx expo run:android
// // In the meantime, the SOS QR is still accessible from the in-app SOS button.
// let Notifications: any = null;
// try {
//   // This will throw in Expo Go SDK 53 — we catch it gracefully
//   Notifications = require('expo-notifications');
// } catch {
//   console.log('expo-notifications not available in this environment (Expo Go)');
// }

// export default function RootLayout() {
//   useFrameworkReady();

//   const notifResponseListener = useRef<any>(null);

//   useEffect(() => {
//     // Only set up notification listener if the module loaded successfully
//     if (!Notifications) return;

//     try {
//       // Set handler for foreground notifications
//       Notifications.setNotificationHandler({
//         handleNotification: async () => ({
//           shouldShowAlert: true,
//           shouldPlaySound: false,
//           shouldSetBadge: false,
//         }),
//       });

//       // Listen for notification taps — opens SOS QR screen
//       notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
//         (response: any) => {
//           const data = response?.notification?.request?.content?.data;
//           if (data?.screen === 'sos-qr') {
//             setTimeout(() => {
//               try { router.push('/sos-qr'); } catch { }
//             }, 300);
//           }
//         }
//       );
//     } catch (err) {
//       console.log('Notification listener setup skipped:', err);
//     }

//     return () => {
//       try {
//         if (notifResponseListener.current && Notifications) {
//           Notifications.removeNotificationSubscription(notifResponseListener.current);
//         }
//       } catch { }
//     };
//   }, []);

//   return (
//     <AuthProvider>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="login" options={{ headerShown: false }} />
//         <Stack.Screen name="register" options={{ headerShown: false }} />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="sos-qr" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
//         <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
//       </Stack>
//     </AuthProvider>
//   );
// }





// import { Stack } from 'expo-router';
// import { AuthProvider } from '../contexts/AuthContext';
// import { useEffect, useRef } from 'react';
// import { useFrameworkReady } from '../hooks/useFrameworkReady';
// import { router } from 'expo-router';
// import { Platform } from 'react-native';

// // Check if we're in Expo Go
// const isExpoGo = () => {
//   try {
//     // @ts-ignore
//     return typeof ExpoConstants !== 'undefined' &&
//       ExpoConstants.appOwnership === 'expo';
//   } catch {
//     return false;
//   }
// };

// export default function RootLayout() {
//   useFrameworkReady();

//   const notifResponseListener = useRef<any>(null);
//   const notificationListener = useRef<any>(null);

//   useEffect(() => {
//     // Skip notification setup entirely in Expo Go
//     if (isExpoGo()) {
//       console.log('📱 Running in Expo Go - notifications skipped');
//       return;
//     }

//     let isMounted = true;

//     const setupNotifications = async () => {
//       try {
//         const Notifications = await import('expo-notifications');

//         if (!isMounted) return;

//         Notifications.setNotificationHandler({
//           handleNotification: async () => ({
//             shouldShowAlert: true,
//             shouldPlaySound: false,
//             shouldSetBadge: false,
//           }),
//         });

//         notificationListener.current = Notifications.addNotificationReceivedListener(
//           (notification: any) => {
//             console.log('Notification received:', notification);
//           }
//         );

//         notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
//           (response: any) => {
//             const data = response?.notification?.request?.content?.data;
//             if (data?.screen === 'sos-qr') {
//               setTimeout(() => {
//                 try {
//                   router.push('/sos-qr');
//                 } catch (err) {
//                   console.log('Navigation error:', err);
//                 }
//               }, 300);
//             }
//           }
//         );

//         console.log('✅ Notifications setup complete');
//       } catch (error) {
//         console.log('Failed to setup notifications:', error);
//       }
//     };

//     setupNotifications();

//     return () => {
//       isMounted = false;
//       const cleanup = async () => {
//         try {
//           const Notifications = await import('expo-notifications');
//           if (notificationListener.current) {
//             Notifications.removeNotificationSubscription(notificationListener.current);
//           }
//           if (notifResponseListener.current) {
//             Notifications.removeNotificationSubscription(notifResponseListener.current);
//           }
//         } catch (error) {
//           // Ignore cleanup errors
//         }
//       };
//       cleanup();
//     };
//   }, []);

//   return (
//     <AuthProvider>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="login" options={{ headerShown: false }} />
//         <Stack.Screen name="register" options={{ headerShown: false }} />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="sos-qr" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
//         <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
//       </Stack>
//     </AuthProvider>
//   );
// }




// import { Stack } from 'expo-router';
// import { AuthProvider } from '../contexts/AuthContext';
// import { useEffect, useRef } from 'react';
// import { useFrameworkReady } from '../hooks/useFrameworkReady';
// import { router } from 'expo-router';
// import { Platform } from 'react-native';


// // Check if we're in Expo Go
// const isExpoGo = () => {
//   try {
//     // @ts-ignore
//     return typeof ExpoConstants !== 'undefined' &&
//       ExpoConstants.appOwnership === 'expo';
//   } catch {
//     return false;
//   }
// };

// export default function RootLayout() {
//   useFrameworkReady();

//   const notifResponseListener = useRef<any>(null);
//   const notificationListener = useRef<any>(null);


//   useEffect(() => {
//     // Skip notification setup entirely in Expo Go
//     if (isExpoGo()) {
//       console.log('📱 Running in Expo Go - notifications skipped');
//       return;
//     }

//     let isMounted = true;

//     const setupNotifications = async () => {
//       try {
//         const Notifications = await import('expo-notifications');

//         if (!isMounted) return;

//         // Set up notification handler
//         Notifications.setNotificationHandler({
//           handleNotification: async (notification) => {
//             console.log('🔔 Handling notification:', notification);
//             return {
//               shouldShowAlert: true,
//               shouldPlaySound: true,
//               shouldSetBadge: true,
//             };
//           },
//         });

//         // Listen for notifications received while app is in foreground
//         notificationListener.current = Notifications.addNotificationReceivedListener(
//           (notification: any) => {
//             console.log('🔔 Notification received while app open:', notification);
//           }
//         );

//         // Listen for notification taps (including from lock screen)
//         notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
//           (response: any) => {
//             const data = response?.notification?.request?.content?.data;
//             console.log('🔔 Notification tapped! Data:', data);

//             // Navigate to SOS QR screen when notification is tapped
//             if (data?.screen === 'sos-qr') {
//               console.log('🔔 Navigating to SOS QR screen...');
//               setTimeout(() => {
//                 try {
//                   router.replace('/sos-qr');
//                 } catch (err) {
//                   console.log('Navigation error:', err);
//                 }
//               }, 100);
//             }
//           }
//         );

//         console.log('✅ Notifications setup complete');
//       } catch (error) {
//         console.log('Failed to setup notifications:', error);
//       }
//     };


//     setupNotifications();

//     return () => {
//       isMounted = false;
//       const cleanup = async () => {
//         try {
//           const Notifications = await import('expo-notifications');
//           if (notificationListener.current) {
//             Notifications.removeNotificationSubscription(notificationListener.current);
//           }
//           if (notifResponseListener.current) {
//             Notifications.removeNotificationSubscription(notifResponseListener.current);
//           }
//         } catch (error) {
//           // Ignore cleanup errors
//         }
//       };
//       cleanup();
//     };
//   }, []);

//   return (
//     <AuthProvider>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="login" options={{ headerShown: false }} />
//         <Stack.Screen name="register" options={{ headerShown: false }} />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="sos-qr" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
//         <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
//       </Stack>
//     </AuthProvider>
//   );
// }


import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { useEffect, useRef } from 'react';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { router } from 'expo-router';
import { Platform } from 'react-native';

// Check if we're in Expo Go
const isExpoGo = () => {
  try {
    // @ts-ignore
    return typeof ExpoConstants !== 'undefined' &&
      ExpoConstants.appOwnership === 'expo';
  } catch {
    return false;
  }
};

export default function RootLayout() {
  useFrameworkReady();

  // Global error handler for uncaught errors
  useEffect(() => {
    // Handle unhandled promise rejections
    const rejectionHandler = (event: any) => {
      console.log('🌍 UNHANDLED PROMISE REJECTION:', event?.reason || event);
    };

    // Setup global error handler
    // @ts-ignore
    if (global.ErrorUtils) {
      // @ts-ignore
      const originalHandler = global.ErrorUtils.getGlobalHandler();
      // @ts-ignore
      global.ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        console.log('🌍 GLOBAL FATAL ERROR:', error);
        console.log('IsFatal:', isFatal);
        originalHandler(error, isFatal);
      });
    }

    // Add rejection listener
    // @ts-ignore
    if (typeof HermesInternal === 'undefined') {
      // @ts-ignore
      globalThis.addEventListener('unhandledrejection', rejectionHandler);
    }

    return () => {
      // @ts-ignore
      if (typeof HermesInternal === 'undefined') {
        // @ts-ignore
        globalThis.removeEventListener('unhandledrejection', rejectionHandler);
      }
    };
  }, []);

  const notifResponseListener = useRef<any>(null);
  const notificationListener = useRef<any>(null);

  useEffect(() => {
    // Skip notification setup entirely in Expo Go
    if (isExpoGo()) {
      console.log('📱 Running in Expo Go - notifications skipped');
      return;
    }

    let isMounted = true;

    const setupNotifications = async () => {
      try {
        const Notifications = await import('expo-notifications');

        if (!isMounted) return;

        // Set up notification handler
        Notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            console.log('🔔 Handling notification:', notification);
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            };
          },
        });

        // Listen for notifications received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(
          (notification: any) => {
            console.log('🔔 Notification received while app open:', notification);
          }
        );

        // Listen for notification taps (including from lock screen)
        notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
          (response: any) => {
            const data = response?.notification?.request?.content?.data;
            console.log('🔔 Notification tapped! Data:', data);

            // Navigate to SOS QR screen when notification is tapped
            if (data?.screen === 'sos-qr') {
              console.log('🔔 Navigating to SOS QR screen...');
              setTimeout(() => {
                try {
                  router.replace('/sos-qr');
                } catch (err) {
                  console.log('Navigation error:', err);
                }
              }, 100);
            }
          }
        );

        console.log('✅ Notifications setup complete');
      } catch (error) {
        console.log('Failed to setup notifications:', error);
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        try {
          const Notifications = await import('expo-notifications');
          if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
          if (notifResponseListener.current) {
            Notifications.removeNotificationSubscription(notifResponseListener.current);
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sos-qr" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </AuthProvider>
  );
}