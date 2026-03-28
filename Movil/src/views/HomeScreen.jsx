import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, TextInput } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { Battery, Zap, Shield, Terminal, Wifi, Cpu, Settings } from 'lucide-react-native';
import useAppWebSocket from '../hook/useAppWebSocket';
import useDeviceStore from '../store/useDeviceStore';
import { Theme } from '../styles/Theme';
import GlassCard from '../components/GlassCard';
import NeonButton from '../components/NeonButton';

/**
 * 3D Avatar component (Conceptual Therian)
 */
function TherianModel({ isOnline }) {
    return (
        <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
            <mesh>
                <torusKnotGeometry args={[1, 0.35, 128, 32]} />
                <MeshDistortMaterial
                    color={isOnline ? Theme.colors.primary : Theme.colors.secondary}
                    speed={4}
                    distort={0.45}
                    roughness={0.1}
                    metalness={0.9}
                    emissive={isOnline ? Theme.colors.primary : Theme.colors.secondary}
                    emissiveIntensity={isOnline ? 0.6 : 0.2}
                />
            </mesh>
        </Float>
    );
}

const TelemetryItem = ({ icon: Icon, label, value, color }) => (
    <View style={styles.telemetryItem}>
        <Icon size={14} color={color} style={{ marginRight: 6 }} />
        <View>
            <Text style={styles.telemetryLabel}>{label}</Text>
            <Text style={[styles.telemetryValue, { color }]}>{value}</Text>
        </View>
    </View>
);

const HomeScreen = () => {
    const { isOnline, bat, signal } = useDeviceStore();
    const { connect, disconnect, sendCommand } = useAppWebSocket();
    const [ip, setIp] = useState('192.168.4.1');

    const handleToggleLink = () => {
        if (isOnline) {
            disconnect();
        } else {
            connect(ip);
        }
    };

    const handleAction = (type, value) => {
        sendCommand(type, value);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.brandContainer}>
                    <Cpu color={Theme.colors.primary} size={20} />
                    <Text style={styles.brandText}>THERIAN_WALK</Text>
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <Settings color={Theme.colors.text} size={20} />
                </TouchableOpacity>
            </View>

            {/* Main 3D View */}
            <View style={styles.avatarSection}>
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <pointLight position={[10, 10, 10]} intensity={2} color={Theme.colors.primary} />
                    <TherianModel isOnline={isOnline} />
                </Canvas>

                {/* Connection Toolset (Overlay) */}
                <View style={styles.connectionOverlay}>
                    <GlassCard style={styles.ipCard} padding={Theme.spacing.sm}>
                        <View style={styles.ipContainer}>
                            <Wifi size={16} color={Theme.colors.primary} />
                            <TextInput
                                style={styles.ipInput}
                                value={ip}
                                onChangeText={setIp}
                                placeholder="NODE_IP"
                                placeholderTextColor={Theme.colors.textSecondary}
                            />
                            <TouchableOpacity onPress={handleToggleLink} style={[styles.linkSwitch, isOnline && styles.linkActive]}>
                                <Text style={styles.linkSwitchText}>{isOnline ? 'OFF' : 'ON'}</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </View>
            </View>

            {/* Bottom Interface */}
            <View style={styles.controlsSection}>
                {/* Telemetry Row */}
                <View style={styles.telemetryRow}>
                    <GlassCard style={styles.telemetryCard}>
                        <TelemetryItem icon={Zap} label="BATT" value={isOnline ? `${bat}%` : '--'} color={Theme.colors.primary} />
                        <View style={styles.separator} />
                        <TelemetryItem icon={Shield} label="SIGNAL" value={isOnline ? `${signal}dBm` : '--'} color="#a1ffcf" />
                    </GlassCard>
                </View>

                {/* Action Panel */}
                <GlassCard style={styles.actionPanel}>
                    <Text style={styles.panelTitle}>COMMAND_DISPATCHER</Text>
                    <View style={styles.buttonGrid}>
                        <NeonButton title="FEED" onPress={() => handleAction('anim', 'FEED')} style={styles.gridBtn} />
                        <NeonButton title="PLAY" onPress={() => handleAction('anim', 'JUMP')} style={styles.gridBtn} />
                        <NeonButton title="LED" onPress={() => handleAction('control', 'LED_ON')} secondary style={styles.gridBtn} />
                    </View>
                </GlassCard>
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
                <Terminal color={Theme.colors.textSecondary} size={12} />
                <Text style={styles.footerText}>SYSTEM_STATUS: {isOnline ? 'LINK_ACTIVE' : 'IDLE'}</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.bg,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 2,
        marginLeft: 8,
    },
    avatarSection: {
        flex: 1,
        position: 'relative',
    },
    connectionOverlay: {
        position: 'absolute',
        top: Theme.spacing.md,
        left: Theme.spacing.lg,
        right: Theme.spacing.lg,
    },
    ipCard: {
        width: '100%',
    },
    ipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ipInput: {
        flex: 1,
        color: Theme.colors.primary,
        fontFamily: 'monospace',
        fontSize: 14,
        marginLeft: 10,
        padding: 0,
    },
    linkSwitch: {
        backgroundColor: 'rgba(255, 0, 102, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Theme.colors.secondary,
    },
    linkActive: {
        backgroundColor: 'rgba(0, 242, 255, 0.2)',
        borderColor: Theme.colors.primary,
    },
    linkSwitchText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    controlsSection: {
        padding: Theme.spacing.lg,
        gap: Theme.spacing.md,
    },
    telemetryRow: {
        flexDirection: 'row',
    },
    telemetryCard: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: Theme.spacing.md,
    },
    telemetryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    telemetryLabel: {
        color: Theme.colors.textSecondary,
        fontSize: 8,
        textTransform: 'uppercase',
    },
    telemetryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    separator: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(0, 242, 255, 0.1)',
    },
    actionPanel: {
        width: '100%',
    },
    panelTitle: {
        color: Theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: Theme.spacing.md,
        letterSpacing: 1,
    },
    buttonGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    gridBtn: {
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    footerText: {
        color: Theme.colors.textSecondary,
        fontSize: 9,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
    }
});

export default HomeScreen;
