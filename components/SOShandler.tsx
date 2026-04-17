import React, { useEffect, useState, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
    Vibration,
} from 'react-native';
import { useKeyEvent } from 'expo-key-event';
import * as ScreenCapture from 'expo-screen-capture';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import ApiService, { BASE_URL } from '../services/api';

interface SOSHandlerProps {
    children: React.ReactNode;
}

const SOSHandler: React.FC<SOSHandlerProps> = ({ children }) => {
    const [sosActive, setSosActive] = useState(false);
    const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
    const [isLoadingQR, setIsLoadingQR] = useState(false);
    const pressCountRef = useRef(0);
    const lastPressTimeRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { userData } = useAuth();
    const router = useRouter();

    const SOS_TIMEOUT = 2000; // 2 seconds window
    const REQUIRED_PRESSES = 3;

    // Listen for power button events (requires development build)
    useKeyEvent({
        listenOnMount: true,
        captureModifiers: false,
        onKeyDown: (event) => {
            // Power button on Android is keyCode 26
            // Volume buttons are 24 and 25
            if (event.keyCode === 26) {
                const currentTime = Date.now();

                // Reset if too much time has passed
                if (currentTime - lastPressTimeRef.current > SOS_TIMEOUT) {
                    pressCountRef.current = 1;
                } else {
                    pressCountRef.current += 1;
                }

                lastPressTimeRef.current = currentTime;

                // Clear previous timeout
                if (timeoutRef.current) clearTimeout(timeoutRef.current);

                // Set new timeout to reset press count
                timeoutRef.current = setTimeout(() => {
                    pressCountRef.current = 0;
                }, SOS_TIMEOUT);

                // Check if SOS should activate
                if (pressCountRef.current >= REQUIRED_PRESSES) {
                    activateSOS();
                    pressCountRef.current = 0;
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);

                    // Vibrate to acknowledge SOS activation
                    if (Platform.OS === 'android') {
                        Vibration.vibrate([500, 300, 500]);
                    }
                }
            }
        },
    });

    // Store QR code locally for offline access
    const cacheQRCode = async (qrCodeDataUrl: string): Promise<string> => {
        const fileName = `sos_qr_${userData?.patientId || 'user'}.png`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        // Remove base64 prefix if present
        const base64Data = qrCodeDataUrl.includes('base64,')
            ? qrCodeDataUrl.split('base64,')[1]
            : qrCodeDataUrl;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
        });

        return fileUri;
    };

    const loadCachedQRCode = async (): Promise<string | null> => {
        const fileName = `sos_qr_${userData?.patientId || 'user'}.png`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
            return fileUri;
        }
        return null;
    };

    const activateSOS = async () => {
        try {
            // Prevent screen capture for privacy
            await ScreenCapture.preventScreenCaptureAsync();

            setIsLoadingQR(true);

            // Try to load cached QR code first (offline)
            let cachedQR = await loadCachedQRCode();

            if (cachedQR) {
                setQrCodeUri(cachedQR);
                setSosActive(true);
                setIsLoadingQR(false);
                return;
            }

            // If no cache, try to fetch from API (requires internet)
            try {
                const response = await ApiService.refreshQRCode();
                if (response.success && response.data?.qrCode) {
                    const cachedUri = await cacheQRCode(response.data.qrCode);
                    setQrCodeUri(cachedUri);
                    setSosActive(true);
                } else {
                    // Fallback: generate basic QR with patient ID only
                    const fallbackQR = await generateFallbackQR();
                    if (fallbackQR) {
                        await cacheQRCode(fallbackQR);
                        setQrCodeUri(await loadCachedQRCode());
                        setSosActive(true);
                    } else {
                        Alert.alert('SOS Error', 'Could not load QR code');
                    }
                }
            } catch (networkError) {
                // Network error - try one more time with cached
                const retryCached = await loadCachedQRCode();
                if (retryCached) {
                    setQrCodeUri(retryCached);
                    setSosActive(true);
                } else {
                    Alert.alert('No Internet', 'Cannot load QR code without internet. Please connect and try again.');
                }
            }
        } catch (error) {
            console.error('SOS activation error:', error);
            Alert.alert('SOS Error', 'Failed to activate SOS mode');
        } finally {
            setIsLoadingQR(false);
        }
    };

    const generateFallbackQR = async (): Promise<string | null> => {
        try {
            // Create minimal patient data for QR
            const patientInfo = {
                pid: userData?.patientId || 'unknown',
                name: userData?.name || 'Patient',
                emergency: true,
                timestamp: Date.now(),
            };

            // Use a QR generation service or library here
            // For now, return null and rely on cached
            return null;
        } catch {
            return null;
        }
    };

    const deactivateSOS = async () => {
        await ScreenCapture.allowScreenCaptureAsync();
        setSosActive(false);
        setQrCodeUri(null);
    };

    const openFullScreenQR = () => {
        if (qrCodeUri) {
            setSosActive(false);
            router.push({
                pathname: '/(tabs)/FullScreenQR',
                params: {
                    qrCodeUrl: qrCodeUri,
                    sosMode: 'true',
                    patientId: userData?.patientId,
                    patientName: userData?.name,
                }
            });
        }
    };

    // Also add a visible SOS button for testing (optional)
    const showSOSButton = __DEV__; // Only show in development

    return (
        <>
            {children}

            {/* SOS Emergency Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={sosActive}
                onRequestClose={deactivateSOS}
            >
                <View style={styles.sosContainer}>
                    <View style={styles.sosHeader}>
                        <Text style={styles.sosTitle}>🚨 EMERGENCY MODE</Text>
                        <TouchableOpacity onPress={deactivateSOS} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sosContent}>
                        <Text style={styles.sosInstructions}>
                            Show this QR code to the attending doctor
                        </Text>
                        <Text style={styles.sosSubtext}>
                            Doctor can scan to access your medical records
                        </Text>

                        {isLoadingQR ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                                <Text style={styles.loadingText}>Loading emergency info...</Text>
                            </View>
                        ) : qrCodeUri ? (
                            <Image
                                source={{ uri: qrCodeUri }}
                                style={styles.sosQRCode}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>QR code unavailable</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={openFullScreenQR}
                        >
                            <Text style={styles.scanButtonText}>Open Full Screen QR</Text>
                        </TouchableOpacity>

                        <Text style={styles.sosFooter}>
                            Press the power button 3 times again to exit SOS mode
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Development SOS Button (for testing without power button) */}
            {showSOSButton && (
                <TouchableOpacity
                    style={styles.devSOSButton}
                    onPress={activateSOS}
                >
                    <Text style={styles.devSOSButtonText}>🧪 SOS Test</Text>
                </TouchableOpacity>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    sosContainer: {
        flex: 1,
        backgroundColor: '#DC2626',
    },
    sosHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#991B1B',
    },
    sosTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    sosContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    sosInstructions: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10,
    },
    sosSubtext: {
        fontSize: 16,
        color: '#FEE2E2',
        textAlign: 'center',
        marginBottom: 30,
    },
    sosQRCode: {
        width: 250,
        height: 250,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 30,
    },
    scanButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
        marginBottom: 30,
    },
    scanButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#DC2626',
    },
    sosFooter: {
        fontSize: 14,
        color: '#FEE2E2',
        textAlign: 'center',
        position: 'absolute',
        bottom: 40,
    },
    loadingContainer: {
        width: 250,
        height: 250,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 10,
    },
    errorContainer: {
        width: 250,
        height: 250,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    errorText: {
        color: '#FFFFFF',
        textAlign: 'center',
    },
    devSOSButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#DC2626',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        zIndex: 999,
    },
    devSOSButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default SOSHandler;