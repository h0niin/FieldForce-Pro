import React, { useState, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { workOrderNotesApi, voiceApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function VoiceNotesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    // Recording State
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Playback State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Submission State
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);

    // Keep refs for unmount cleanup
    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        recordingRef.current = recording;
    }, [recording]);

    useEffect(() => {
        soundRef.current = sound;
    }, [sound]);

    // Cleanup permissions and audio resources ONLY on unmount
    useEffect(() => {
        return () => {
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => { });
            }
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => { });
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            console.log('[VoiceNote] Requesting permissions...');
            const { status } = await Audio.requestPermissionsAsync();
            console.log('[VoiceNote] Permission status:', status);

            if (status !== 'granted') {
                Alert.alert('Permission required', 'Microphone access is needed to record voice notes.');
                return;
            }

            console.log('[VoiceNote] Setting audio mode...');
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Clear previous recording
            setRecordingUri(null);
            setTranscription(null);
            setRecordingDuration(0);

            console.log('[VoiceNote] Creating recording instance...');
            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

            console.log('[VoiceNote] Starting recording...');
            await newRecording.startAsync();

            setRecording(newRecording);
            console.log('[VoiceNote] Recording started successfully');

            timerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000) as unknown as NodeJS.Timeout;

        } catch (err) {
            console.error('[VoiceNote] Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordingUri(uri);
            setRecording(null);

            // Reset audio mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
        } catch (error) {
            console.error('Failed to stop recording', error);
            setRecording(null);
        }
    };

    const playRecording = async () => {
        if (!recordingUri) return;

        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
                return;
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: recordingUri },
                { shouldPlay: true }
            );

            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (error) {
            console.error('Failed to play sound', error);
            Alert.alert('Error', 'Failed to play the recording.');
        }
    };

    const deleteRecording = () => {
        Alert.alert('Discard Recording', 'Are you sure you want to discard this voice note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Discard',
                style: 'destructive',
                onPress: () => {
                    if (sound) {
                        sound.unloadAsync();
                        setSound(null);
                    }
                    setRecordingUri(null);
                    setTranscription(null);
                    setRecordingDuration(0);
                    setIsPlaying(false);
                }
            }
        ]);
    };

    const submitVoiceNote = async () => {
        if (!recordingUri || !id) return;

        setIsTranscribing(true);

        try {
            const formData = new FormData();
            formData.append('file', {
                uri: recordingUri,
                name: `voice_note_${Date.now()}.m4a`,
                type: 'audio/m4a',
            } as any);

            const response = await voiceApi.transcribe(formData);
            const actualText = response.data?.data?.text || 'No transcription text returned.';

            setTranscription(actualText);

            // Save as an internal note to the work order
            await workOrderNotesApi.create({
                work_order_id: id,
                content: `[Voice Note] ${actualText}`,
                is_internal: true,
            });

            setIsTranscribing(false);
        } catch (error) {
            console.error('[VoiceNote] Transcription error:', error);
            setIsTranscribing(false);
            Alert.alert('Error', 'Failed to transcribe and save voice note.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: cardBg, borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isTranscribing}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Voice Note</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>

                {/* State 1: Active Recording */}
                {recording ? (
                    <View style={styles.recordingContainer}>
                        <View style={styles.pulseRing}>
                            <View style={[styles.micActive, { borderColor }]}>
                             <Ionicons name="mic" size={48} color={colors.white} />
                            </View>
                        </View>
                        <Text style={[styles.recordingTime, { color: colors.text }]}>{formatDuration(recordingDuration)}</Text>
                        <Text style={styles.recordingLabel}>Recording in progress...</Text>

                        <TouchableOpacity style={[styles.stopButton, { borderColor }]} onPress={stopRecording}>
                            <Ionicons name="square" size={24} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                ) : !recordingUri ? (
                    /* State 2: Ready to Record */
                    <View style={styles.readyContainer}>
                        <View style={styles.micCircle}>
                            <Ionicons name="mic-outline" size={48} color={colors.primary} />
                        </View>
                        <Text style={[styles.readyTitle, { color: colors.text }]}>Tap to Record</Text>
                        <Text style={[styles.readyDesc, { color: colors.textSecondary }]}>Capture observations quickly using AI transcription. Speak clearly into your device.</Text>

                        <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                            <View style={styles.recordButtonInner} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* State 3: Review and Submit */
                    <View style={styles.reviewContainer}>
                        <View style={[styles.audioPlayerCard, { backgroundColor: cardBg, borderColor }]}>
                            <TouchableOpacity style={styles.playButton} onPress={playRecording}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={colors.white} />
                            </TouchableOpacity>
                            <View style={styles.waveformContainer}>
                                {/* Simplified Waveform visualization */}
                                {[...Array(20)].map((_, i) => (
                                    <View key={i} style={[styles.waveBar, { height: Math.max(8, Math.random() * 32) }]} />
                                ))}
                            </View>
                            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
                        </View>

                        <TouchableOpacity style={styles.deleteButtonTextRow} onPress={deleteRecording} disabled={isTranscribing}>
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                            <Text style={styles.deleteText}>Discard Recording</Text>
                        </TouchableOpacity>

                        {!transcription ? (
                            <View style={styles.actionContainer}>
                                <TouchableOpacity
                                    style={[styles.transcribeButton, isTranscribing && { opacity: 0.7 }]}
                                    onPress={submitVoiceNote}
                                    disabled={isTranscribing}
                                >
                                    {isTranscribing ? (
                                        <>
                                            <ActivityIndicator color={colors.white} size="small" />
                                            <Text style={styles.transcribeButtonText}>Transcribing...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="color-wand-outline" size={20} color={colors.white} />
                                            <Text style={styles.transcribeButtonText}>Transcribe & Save</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.hintText}>Audio will be converted to text and saved as an internal work order note.</Text>
                            </View>
                        ) : (
                            <View style={styles.successContainer}>
                                <View style={styles.successBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                    <Text style={styles.successBadgeText}>Transcribed & Saved</Text>
                                </View>
                                <View style={styles.transcriptionCard}>
                                    <Text style={[styles.transcriptionText, { color: colors.text }]}>{transcription}</Text>
                                </View>
                                <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backButton: {
        padding: spacing.xs,
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    content: {
        flexGrow: 1,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    // Ready State
    readyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    micCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    readyTitle: {
        ...typography.h2,
        color: colors.text,
    },
    readyDesc: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        lineHeight: 22,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.error + '20',
        borderWidth: 4,
        borderColor: colors.error + '40',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    recordButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.error,
    },
    // Recording State
    recordingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    pulseRing: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: colors.error + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    micActive: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    recordingTime: {
        fontSize: 48,
        fontWeight: '300',
        color: colors.text,
        fontVariant: ['tabular-nums'],
    },
    recordingLabel: {
        ...typography.body,
        color: colors.error,
        fontWeight: '600',
    },
    stopButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.text,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    // Review State
    reviewContainer: {
        flex: 1,
    },
    audioPlayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: spacing.md,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waveformContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 40,
    },
    waveBar: {
        width: 3,
        backgroundColor: colors.primary + '60',
        borderRadius: 2,
    },
    durationText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    deleteButtonTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.lg,
        gap: spacing.xs,
    },
    deleteText: {
        ...typography.button,
        color: colors.error,
    },
    actionContainer: {
        marginTop: 'auto',
        gap: spacing.md,
    },
    transcribeButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    transcribeButtonText: {
        ...typography.button,
        color: colors.white,
    },
    hintText: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    // Success state
    successContainer: {
        marginTop: spacing.xl,
        flex: 1,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    successBadgeText: {
        ...typography.label,
        color: colors.success,
    },
    transcriptionCard: {
        backgroundColor: colors.success + '10',
        borderWidth: 1,
        borderColor: colors.success + '30',
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        marginBottom: spacing['2xl'],
    },
    transcriptionText: {
        ...typography.body,
        color: colors.text,
        lineHeight: 24,
    },
    doneButton: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: 'auto',
    },
    doneButtonText: {
        ...typography.button,
        color: colors.text,
    },
});
