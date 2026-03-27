import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Image, ActivityIndicator, Alert, Dimensions, ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, User, ShieldCheck, Zap, Activity, Cpu } from 'lucide-react-native';
import useApp from '../hook/useApp';
import useWebSocket from '../hook/useWebSocket';
import { uploadAvatar } from '../service/api';

const { width } = Dimensions.get('window');

const Home = () => {
    const { ToastMsgSuccess, ToastMsgError } = useApp();
    const { status, sendMessage, lastMessage } = useWebSocket();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deviceStats, setDeviceStats] = useState({ bat: '--', signal: '--' });

    useEffect(() => {
        if (lastMessage && lastMessage.t === 'data') {
            setDeviceStats(lastMessage.v);
        }
    }, [lastMessage]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleUpload = async () => {
        if (!image) return;
        setLoading(true);
        try {
            await uploadAvatar(image);
            ToastMsgSuccess('Avatar transferido con éxito');
        } catch (error) {
            ToastMsgError('Error al transferir el avatar');
        } finally {
            setLoading(false);
        }
    };

    const triggerAnim = (type) => {
        sendMessage('anim', type);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <ShieldCheck color="#00f2ff" size={32} />
                <Text style={styles.title}>THERIAN AR</Text>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: status === 'connected' ? '#00ff88' : '#ff3300' }]} />
                    <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Zap color="#00f2ff" size={16} />
                    <Text style={styles.statLabel}>ENERGÍA</Text>
                    <Text style={styles.statValue}>{deviceStats.bat}%</Text>
                </View>
                <View style={styles.statCard}>
                    <Activity color="#00f2ff" size={16} />
                    <Text style={styles.statLabel}>SEÑAL</Text>
                    <Text style={styles.statValue}>{deviceStats.signal} dBm</Text>
                </View>
            </View>

            <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                    {image ? <Image source={{ uri: image.uri }} style={styles.avatar} /> : <User color="#222" size={100} />}
                    <View style={styles.scanline} />
                </View>
                <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
                    <Camera color="#fff" size={20} />
                    <Text style={styles.buttonText}>CAMBIAR AVATAR</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.realtimeSection}>
                <Text style={styles.sectionTitle}>CENTRAL DE ANIMACIONES</Text>
                <View style={styles.grid}>
                    {['SALUDO', 'ALERTA', 'ESCANEANDO', 'DORMIR'].map((anim) => (
                        <TouchableOpacity key={anim} style={styles.animButton} onPress={() => triggerAnim(anim.toLowerCase())}>
                            <Text style={styles.animText}>{anim}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.syncButton, !image && styles.disabledButton]}
                onPress={handleUpload}
                disabled={!image || loading}
            >
                {loading ? <ActivityIndicator color="#0a0a0a" /> : (
                    <><Cpu color="#0a0a0a" size={20} /><Text style={styles.syncText}>SINCRONIZAR HARDWARE</Text></>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#050505',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    title: {
        color: '#00f2ff',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 6,
        marginVertical: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        color: '#888',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#0a0a0a',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#111',
        alignItems: 'center',
    },
    statLabel: {
        color: '#444',
        fontSize: 10,
        marginTop: 8,
        fontWeight: 'bold',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 3,
        borderColor: '#00f2ff',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#00f2ff',
        shadowRadius: 20,
        shadowOpacity: 0.5,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    scanline: {
        position: 'absolute',
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0, 242, 255, 0.5)',
        top: '50%',
    },
    pickerButton: {
        flexDirection: 'row',
        backgroundColor: '#111',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        marginTop: -20,
        borderWidth: 1,
        borderColor: '#222',
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    realtimeSection: {
        width: '100%',
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#444',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 15,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    animButton: {
        width: '48%',
        backgroundColor: '#111',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    animText: {
        color: '#888',
        fontWeight: '700',
        fontSize: 12,
    },
    syncButton: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#00f2ff',
        paddingVertical: 18,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    syncText: {
        color: '#0a0a0a',
        fontWeight: '900',
        fontSize: 16,
        marginLeft: 10,
        letterSpacing: 0.5,
    },
    disabledButton: {
        backgroundColor: '#111',
        opacity: 0.5,
    },
});

export default Home;
