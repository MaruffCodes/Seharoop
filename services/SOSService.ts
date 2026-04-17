/**
 * SOSService — Persistent Medical ID Lock Screen Notification
 *
 * How it works:
 *  1. After medical form is saved, we store critical info (name, blood group,
 *     allergies, emergency contact, QR data) in AsyncStorage.
 *  2. We schedule a repeating foreground notification that:
 *     - Shows on the Android lock screen without unlocking
 *     - Contains the patient's name, blood group, and allergies
 *     - Has an action button "View Medical QR"
 *  3. When tapped, the app opens and navigates to the offline QR screen.
 *  4. The QR itself is generated from locally-stored data — NO internet needed.
 *
 * Works in Expo Go on Android (lock screen notifications are supported).
 * iOS shows the notification but lock screen visibility depends on user settings.
 */

// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';

// // ── Storage keys ──────────────────────────────────────────────────────────────
// export const SOS_STORAGE_KEY = 'seharoop_sos_data';
// export const SOS_NOTIF_ID_KEY = 'seharoop_sos_notif_id';

// export interface SOSData {
//     patientName: string;
//     patientId: string;
//     bloodGroup: string;
//     allergies: string[];
//     emergencyName: string;
//     emergencyPhone: string;
//     chronicDiseases: string[];
//     isDiabetic: boolean;
//     qrCodeData: string;   // base64 QR image URI — generated offline
//     lastUpdated: string;
// }

// // ── Configure how notifications behave when app is foregrounded ───────────────
// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: false,
//         shouldSetBadge: false,
//     }),
// });

// class SOSService {

//     // ── Request notification permission ────────────────────────────────────────
//     async requestPermissions(): Promise<boolean> {
//         if (!Device.isDevice) {
//             console.log('SOS notifications: not a real device, skipping');
//             return false;
//         }

//         const { status: existing } = await Notifications.getPermissionsAsync();
//         if (existing === 'granted') return true;

//         const { status } = await Notifications.requestPermissionsAsync({
//             ios: {
//                 allowAlert: true,
//                 allowBadge: false,
//                 allowSound: false,
//                 allowCriticalAlerts: true,
//             },
//         });

//         return status === 'granted';
//     }

//     // ── Set up Android notification channel ────────────────────────────────────
//     async setupAndroidChannel(): Promise<void> {
//         if (Platform.OS !== 'android') return;
//         await Notifications.setNotificationChannelAsync('medical-id', {
//             name: '🆘 Medical ID',
//             description: 'Emergency medical information shown on lock screen',
//             importance: Notifications.AndroidImportance.MAX,
//             lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
//             // PUBLIC = show full content on lock screen (no unlock needed)
//             sound: null,
//             vibrationPattern: [0],
//             enableLights: true,
//             lightColor: '#DC2626',
//             bypassDnd: true,
//         });
//     }

//     // ── Save SOS data locally (works offline) ──────────────────────────────────
//     async saveSOSData(data: SOSData): Promise<void> {
//         await AsyncStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(data));
//     }

//     // ── Load SOS data ──────────────────────────────────────────────────────────
//     async loadSOSData(): Promise<SOSData | null> {
//         try {
//             const raw = await AsyncStorage.getItem(SOS_STORAGE_KEY);
//             return raw ? JSON.parse(raw) : null;
//         } catch { return null; }
//     }

//     // ── Post (or update) the persistent lock screen notification ──────────────
//     async postMedicalIDNotification(data: SOSData): Promise<void> {
//         try {
//             await this.setupAndroidChannel();

//             // Cancel any existing SOS notification first
//             await this.cancelMedicalIDNotification();

//             const allergiesLine = data.allergies.length > 0
//                 ? `⚠️ Allergies: ${data.allergies.slice(0, 3).join(', ')}`
//                 : '✅ No known allergies';

//             const chronicLine = data.chronicDiseases.length > 0
//                 ? `🩺 Conditions: ${data.chronicDiseases.slice(0, 2).join(', ')}`
//                 : '';

//             const emergencyLine = data.emergencyName
//                 ? `📞 Emergency: ${data.emergencyName}${data.emergencyPhone ? ' — ' + data.emergencyPhone : ''}`
//                 : '';

//             const bodyLines = [
//                 `🩸 Blood Group: ${data.bloodGroup || 'Unknown'}`,
//                 allergiesLine,
//                 chronicLine,
//                 emergencyLine,
//             ].filter(Boolean).join('\n');

//             const notifId = await Notifications.scheduleNotificationAsync({
//                 content: {
//                     title: `🆘 Medical ID — ${data.patientName}`,
//                     body: bodyLines,
//                     subtitle: `ID: ${data.patientId}`,
//                     data: { screen: 'sos-qr', patientId: data.patientId },
//                     // Android-specific: make it sticky and lock-screen visible
//                     ...(Platform.OS === 'android' && {
//                         sticky: true,
//                         priority: 'max',
//                     }),
//                     color: '#DC2626',
//                 },
//                 trigger: null,   // null = show immediately, stays until cancelled
//             });

//             await AsyncStorage.setItem(SOS_NOTIF_ID_KEY, notifId);
//             console.log('✅ Medical ID notification posted:', notifId);
//         } catch (err) {
//             console.error('SOS notification error:', err);
//         }
//     }

//     // ── Cancel the persistent notification ────────────────────────────────────
//     async cancelMedicalIDNotification(): Promise<void> {
//         try {
//             const id = await AsyncStorage.getItem(SOS_NOTIF_ID_KEY);
//             if (id) {
//                 await Notifications.dismissNotificationAsync(id);
//                 await Notifications.cancelScheduledNotificationAsync(id);
//             }
//             // Also dismiss all to be safe
//             await Notifications.dismissAllNotificationsAsync();
//         } catch { }
//     }

//     // ── Build SOS data from medical form submission data ──────────────────────
//     buildSOSData(params: {
//         patientName: string;
//         patientId: string;
//         bloodGroup: string;
//         allergies: string[];
//         emergencyName: string;
//         emergencyPhone: string;
//         chronicDiseases: string[];
//         isDiabetic: boolean;
//         qrCodeDataUri: string;   // the base64 QR image from the patient profile
//     }): SOSData {
//         return {
//             patientName: params.patientName,
//             patientId: params.patientId,
//             bloodGroup: params.bloodGroup,
//             allergies: params.allergies,
//             emergencyName: params.emergencyName,
//             emergencyPhone: params.emergencyPhone,
//             chronicDiseases: params.chronicDiseases,
//             isDiabetic: params.isDiabetic,
//             qrCodeData: params.qrCodeDataUri,
//             lastUpdated: new Date().toISOString(),
//         };
//     }

//     // ── Full setup flow: called after medical form save ───────────────────────
//     async setupAfterFormSave(params: {
//         patientName: string;
//         patientId: string;
//         bloodGroup: string;
//         allergies: string[];
//         emergencyName: string;
//         emergencyPhone: string;
//         chronicDiseases: string[];
//         isDiabetic: boolean;
//         qrCodeDataUri: string;
//     }): Promise<boolean> {
//         try {
//             const granted = await this.requestPermissions();
//             if (!granted) {
//                 console.log('SOS: notification permission denied');
//                 return false;
//             }

//             const sosData = this.buildSOSData(params);
//             await this.saveSOSData(sosData);
//             await this.postMedicalIDNotification(sosData);
//             return true;
//         } catch (err) {
//             console.error('SOS setup error:', err);
//             return false;
//         }
//     }

//     // ── Refresh notification (e.g. after profile update) ──────────────────────
//     async refreshNotification(): Promise<void> {
//         const data = await this.loadSOSData();
//         if (data) await this.postMedicalIDNotification(data);
//     }
// }

// export const sosService = new SOSService();
// export default sosService;

/**
 * SOSService — Offline Medical ID + Lock Screen Notification
 *
 * NOTE ON EXPO GO: expo-notifications push support was removed from Expo Go
 * in SDK 53. Local scheduled notifications still partially work, but the
 * import crashes. We guard it with a try/catch so the app doesn't crash.
 *
 * To get full lock-screen notification support:
 *   npx expo run:android   (creates a dev build with full native support)
 *
 * The QR + critical info are ALWAYS stored offline in AsyncStorage and can
 * be viewed via the in-app SOS button regardless of notification status.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const SOS_STORAGE_KEY = 'seharoop_sos_data';
export const SOS_NOTIF_ID_KEY = 'seharoop_sos_notif_id';

export interface SOSData {
    patientName: string; patientId: string; bloodGroup: string;
    allergies: string[]; emergencyName: string; emergencyPhone: string;
    chronicDiseases: string[]; isDiabetic: boolean;
    qrCodeData: string; lastUpdated: string;
}

// ── Lazy-load expo-notifications (crashes in Expo Go SDK 53) ─────────────────
let Notifications: any = null;
let Device: any = null;
try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
} catch {
    console.log('SOSService: expo-notifications not available (Expo Go). SOS data stored offline only.');
}

class SOSService {

    async requestPermissions(): Promise<boolean> {
        if (!Notifications || !Device || !Device.isDevice) return false;
        try {
            const { status: ex } = await Notifications.getPermissionsAsync();
            if (ex === 'granted') return true;
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        } catch { return false; }
    }

    async setupAndroidChannel(): Promise<void> {
        if (!Notifications || Platform.OS !== 'android') return;
        try {
            await Notifications.setNotificationChannelAsync('medical-id', {
                name: '🆘 Medical ID',
                description: 'Emergency medical information on lock screen',
                importance: Notifications.AndroidImportance.MAX,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                sound: null, vibrationPattern: [0], enableLights: true, lightColor: '#DC2626', bypassDnd: true,
            });
        } catch { }
    }

    async saveSOSData(data: SOSData): Promise<void> {
        await AsyncStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(data));
    }

    async loadSOSData(): Promise<SOSData | null> {
        try {
            const r = await AsyncStorage.getItem(SOS_STORAGE_KEY);
            return r ? JSON.parse(r) : null;
        } catch { return null; }
    }

    async postMedicalIDNotification(data: SOSData): Promise<void> {
        if (!Notifications) return; // Expo Go — skip silently
        try {
            await this.setupAndroidChannel();
            await this.cancelMedicalIDNotification();

            const allergiesLine = data.allergies.length > 0 ? `⚠️ Allergies: ${data.allergies.slice(0, 3).join(', ')}` : '✅ No known allergies';
            const body = [`🩸 Blood Group: ${data.bloodGroup || 'Unknown'}`, allergiesLine, data.emergencyName ? `📞 Emergency: ${data.emergencyName}${data.emergencyPhone ? ' — ' + data.emergencyPhone : ''}` : ''].filter(Boolean).join('\n');

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🆘 Medical ID — ${data.patientName}`,
                    body, subtitle: `ID: ${data.patientId}`,
                    data: { screen: 'sos-qr', patientId: data.patientId },
                    color: '#DC2626',
                    ...(Platform.OS === 'android' && { sticky: true, priority: 'max' }),
                },
                trigger: null,
            });
            await AsyncStorage.setItem(SOS_NOTIF_ID_KEY, id);
        } catch (e) { console.log('SOS notification skipped:', e); }
    }

    async cancelMedicalIDNotification(): Promise<void> {
        if (!Notifications) return;
        try {
            const id = await AsyncStorage.getItem(SOS_NOTIF_ID_KEY);
            if (id) { await Notifications.dismissNotificationAsync(id).catch(() => { }); await Notifications.cancelScheduledNotificationAsync(id).catch(() => { }); }
            await Notifications.dismissAllNotificationsAsync().catch(() => { });
        } catch { }
    }

    buildSOSData(p: { patientName: string; patientId: string; bloodGroup: string; allergies: string[]; emergencyName: string; emergencyPhone: string; chronicDiseases: string[]; isDiabetic: boolean; qrCodeDataUri: string; }): SOSData {
        return { patientName: p.patientName, patientId: p.patientId, bloodGroup: p.bloodGroup, allergies: p.allergies, emergencyName: p.emergencyName, emergencyPhone: p.emergencyPhone, chronicDiseases: p.chronicDiseases, isDiabetic: p.isDiabetic, qrCodeData: p.qrCodeDataUri, lastUpdated: new Date().toISOString() };
    }

    async setupAfterFormSave(params: { patientName: string; patientId: string; bloodGroup: string; allergies: string[]; emergencyName: string; emergencyPhone: string; chronicDiseases: string[]; isDiabetic: boolean; qrCodeDataUri: string; }): Promise<boolean> {
        try {
            const sosData = this.buildSOSData(params);
            // Always save offline — this is the important part
            await this.saveSOSData(sosData);
            // Try to post notification (will silently skip in Expo Go)
            const granted = await this.requestPermissions();
            if (granted) await this.postMedicalIDNotification(sosData);
            return true;
        } catch (e) { console.log('SOS setup error:', e); return false; }
    }

    async refreshNotification(): Promise<void> {
        const data = await this.loadSOSData();
        if (data) await this.postMedicalIDNotification(data);
    }
}

export const sosService = new SOSService();
export default sosService;