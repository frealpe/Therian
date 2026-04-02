/**
 * HomeScreen.jsx — Rediseño completo del Smart Badge Terminal.
 *
 * Características:
 * - Diseño cohesivo en ScrollView (no partido)
 * - Menú hamburguesa lateral (Drawer)
 * - Escáner de red: escanea IPs automáticas (192.168.x.x) para encontrar el ESP32
 * - Panel de Smart Badge: selección y envío de imagen
 * - Telemetría en tiempo real via WebSocket
 */
import React, { useState, useRef, useCallback } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, StatusBar,
    TouchableOpacity, TextInput, ScrollView, Modal,
    Animated, ActivityIndicator, Image, FlatList,
    Platform, Dimensions,
} from 'react-native';
import {
    Wifi, Cpu, Menu, X, Image as ImageIcon,
    Send, Zap, Battery, Signal, RefreshCw,
    CheckCircle, AlertCircle, ChevronRight, Link, Link2,
} from 'lucide-react-native';
import { Theme } from '../styles/Theme';
import useAppWebSocket, { wsManager } from '../hook/useAppWebSocket';
import useDeviceStore from '../store/useDeviceStore';
import useBadge from '../hook/useBadge';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = SCREEN_W * 0.78;

// ─────────────────────────────────────────────
// Utilidades de UI
// ─────────────────────────────────────────────
const Divider = () => <View style={styles.divider} />;

const StatusDot = ({ online }) => (
    <View style={[styles.dot, { backgroundColor: online ? '#00e676' : '#ff5252' }]} />
);

const MetricCard = ({ label, value, color = Theme.colors.primary }) => (
    <View style={styles.metricCard}>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
    </View>
);

// ─────────────────────────────────────────────
// Drawer (menú hamburguesa lateral)
// ─────────────────────────────────────────────
const DrawerMenu = ({ visible, onClose, ip, onIpChange, isOnline, onConnect, onDisconnect, onScan, scanning }) => {
    const translateX = useRef(new Animated.Value(-DRAWER_W)).current;

    React.useEffect(() => {
        Animated.spring(translateX, {
            toValue: visible ? 0 : -DRAWER_W,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
        }).start();
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Backdrop */}
            <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={onClose} />

            {/* Panel */}
            <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                {/* Drawer Header */}
                <View style={styles.drawerHeader}>
                    <View style={styles.drawerBrand}>
                        <Cpu size={18} color={Theme.colors.primary} />
                        <Text style={styles.drawerBrandText}>THERIAN_CTRL</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <X size={20} color={Theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Divider />

                {/* Conexión ESP32 */}
                <Text style={styles.drawerSection}>CONEXIÓN ESP32</Text>

                {/* Status */}
                <View style={styles.drawerStatusRow}>
                    <StatusDot online={isOnline} />
                    <Text style={[styles.drawerStatusText, { color: isOnline ? '#00e676' : Theme.colors.textSecondary }]}>
                        {isOnline ? 'ENLACE ACTIVO' : 'DESCONECTADO'}
                    </Text>
                </View>

                {/* Campo IP */}
                <View style={styles.ipRow}>
                    <Wifi size={14} color={Theme.colors.primary} />
                    <TextInput
                        style={styles.drawerInput}
                        value={ip}
                        onChangeText={onIpChange}
                        placeholder="192.168.x.x"
                        placeholderTextColor={Theme.colors.textSecondary}
                        keyboardType="numeric"
                        autoCapitalize="none"
                    />
                </View>

                {/* Botón Scan */}
                <TouchableOpacity
                    style={[styles.drawerBtn, styles.scanBtn]}
                    onPress={onScan}
                    disabled={scanning}
                    activeOpacity={0.8}
                >
                    {scanning ? (
                        <ActivityIndicator size="small" color={Theme.colors.primary} />
                    ) : (
                        <RefreshCw size={14} color={Theme.colors.primary} />
                    )}
                    <Text style={[styles.drawerBtnText, { color: Theme.colors.primary }]}>
                        {scanning ? 'ESCANEANDO...' : 'ESCANEAR RED'}
                    </Text>
                </TouchableOpacity>

                {/* Botón Connect/Disconnect */}
                <TouchableOpacity
                    style={[styles.drawerBtn, isOnline ? styles.disconnectBtn : styles.connectBtn]}
                    onPress={isOnline ? onDisconnect : onConnect}
                    activeOpacity={0.8}
                >
                    {isOnline ? (
                        <Link2 size={14} color="#ff5252" />
                    ) : (
                        <Link size={14} color="#000" />
                    )}
                    <Text style={[styles.drawerBtnText, { color: isOnline ? '#ff5252' : '#000' }]}>
                        {isOnline ? 'DESCONECTAR' : 'CONECTAR'}
                    </Text>
                </TouchableOpacity>

                <Divider />

                {/* Info */}
                <Text style={styles.drawerSection}>ESTADO SISTEMA</Text>
                <Text style={styles.drawerHint}>
                    La app se conecta vía WebSocket a {`ws://${ip}/ws`} y envía imágenes a {`http://${ip}/api/badge/image`}
                </Text>
            </Animated.View>
        </Modal>
    );
};

// ─────────────────────────────────────────────
// Panel Smart Badge
// ─────────────────────────────────────────────
const BadgePanel = ({ ip }) => {
    const { preview, loading, error, success, hasImage, pickImage, sendBadge, reset } = useBadge();

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>SMART_BADGE — ENVÍO DE IMAGEN</Text>

            <View style={styles.badgeRow}>
                {/* Miniatura */}
                <TouchableOpacity
                    style={styles.badgeThumb}
                    onPress={loading ? undefined : pickImage}
                    activeOpacity={0.75}
                >
                    {preview ? (
                        <Image source={{ uri: preview }} style={styles.badgeImg} />
                    ) : (
                        <View style={styles.badgePlaceholder}>
                            <ImageIcon size={24} color={Theme.colors.textSecondary} />
                            <Text style={styles.badgePlaceholderText}>TAP</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Acciones */}
                <View style={styles.badgeActions}>
                    <TouchableOpacity style={styles.badgePickBtn} onPress={pickImage} disabled={loading} activeOpacity={0.8}>
                        <ImageIcon size={13} color={Theme.colors.primary} />
                        <Text style={[styles.badgeBtnTxt, { color: Theme.colors.primary }]}>GALERÍA</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.badgeSendBtn, (!hasImage || loading) && styles.btnDisabled]}
                        onPress={() => sendBadge(ip)}
                        disabled={!hasImage || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <>
                                <Send size={13} color="#000" />
                                <Text style={styles.badgeBtnTxt}>ENVIAR</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {hasImage && !loading && (
                        <TouchableOpacity style={styles.badgeClearBtn} onPress={reset} activeOpacity={0.8}>
                            <X size={13} color={Theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Feedback */}
            {success && (
                <View style={styles.feedbackRow}>
                    <CheckCircle size={13} color="#00e676" />
                    <Text style={[styles.feedbackTxt, { color: '#00e676' }]}>Imagen enviada al ESP32 ✓</Text>
                </View>
            )}
            {error && (
                <View style={styles.feedbackRow}>
                    <AlertCircle size={13} color={Theme.colors.secondary} />
                    <Text style={[styles.feedbackTxt, { color: Theme.colors.secondary }]} numberOfLines={2}>{error}</Text>
                </View>
            )}
        </View>
    );
};

// ─────────────────────────────────────────────
// Escáner de red (descubrimiento del ESP32)
// ─────────────────────────────────────────────
const COMMON_PORTS = ['192.168.1.198', '192.168.4.1', '192.168.1.1', '192.168.0.1'];

async function probeIP(ip) {
    try {
        const res = await fetch(`http://${ip}/api/index`, { method: 'GET', signal: AbortSignal.timeout(800) });
        if (res.ok) return ip;
    } catch (_) { }
    return null;
}

// ─────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────
const HomeScreen = () => {
    const isOnline = useDeviceStore((s) => s.isConnected);
    const telemetry = useDeviceStore((s) => s.telemetry) || {};

    const [ip, setIp] = useState('192.168.1.198');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanResults, setScanResults] = useState([]);

    // Una sola instancia del hook — pasa la URL completa
    const wsUrl = `ws://${ip}/ws`;
    const { sendCommand } = useAppWebSocket(wsUrl);

    // ── Conexión ──────────────────────────────
    const handleConnect = useCallback(() => {
        // Forzar reconexión aunque haya fallback activo
        wsManager.isFallbackMode = false;
        wsManager.reconnectAttempts = 0;
        wsManager.setUrl(`ws://${ip}/ws`);
    }, [ip]);

    const handleDisconnect = useCallback(() => {
        if (wsManager.ws) {
            wsManager.url = null; // Evita reconexión automática
            wsManager.ws.close();
        }
    }, []);

    // ── Escaneo de red ────────────────────────
    const handleScan = useCallback(async () => {
        setScanning(true);
        setScanResults([]);
        const found = [];

        // Probar IPs comunes primero
        for (const candidate of COMMON_PORTS) {
            const result = await probeIP(candidate);
            if (result) found.push(result);
        }

        // Escaneo del rango 192.168.1.x paralelo (lotes de 10)
        const baseSubnet = ip.split('.').slice(0, 3).join('.');
        const batch = [];
        for (let i = 1; i <= 254; i++) {
            batch.push(`${baseSubnet}.${i}`);
        }
        for (let i = 0; i < batch.length; i += 10) {
            const slice = batch.slice(i, i + 10);
            const results = await Promise.all(slice.map(probeIP));
            results.forEach((r) => { if (r && !found.includes(r)) found.push(r); });
        }

        setScanResults(found);
        if (found.length > 0) setIp(found[0]); // auto-selecciona el primero encontrado
        setScanning(false);
    }, [ip]);

    const bat = telemetry?.bat ?? '--';
    const signal = telemetry?.signal ?? '--';
    const heap = telemetry?.free_heap ? `${Math.round(telemetry.free_heap / 1024)}KB` : '--';
    const uptime = telemetry?.uptime ? `${Math.round(telemetry.uptime / 1000)}s` : '--';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Theme.colors.bg} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.hamburger} onPress={() => setDrawerOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Menu size={22} color={Theme.colors.text} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Cpu size={16} color={Theme.colors.primary} />
                    <Text style={styles.headerTitle}>THERIAN</Text>
                </View>

                {/* Estado de conexión */}
                <View style={styles.headerStatus}>
                    <StatusDot online={isOnline} />
                    <Text style={styles.headerIp}>{ip}</Text>
                </View>
            </View>

            {/* ── Contenido principal en scroll ── */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Bloque de conexión visual ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>NODO ACTIVO</Text>
                    <View style={styles.connectionCard}>
                        {/* Indicador de pulso */}
                        <View style={styles.pulseContainer}>
                            <View style={[styles.pulseRing, isOnline && styles.pulseRingActive]} />
                            <View style={[styles.pulseDot, { backgroundColor: isOnline ? '#00e676' : Theme.colors.secondary }]} />
                        </View>

                        <View style={styles.connectionInfo}>
                            <Text style={styles.connectionLabel}>ESP32 NODE</Text>
                            <Text style={[styles.connectionIp, { color: isOnline ? Theme.colors.primary : Theme.colors.textSecondary }]}>
                                {ip}
                            </Text>
                            <Text style={[styles.connectionState, { color: isOnline ? '#00e676' : '#ff5252' }]}>
                                {isOnline ? '● ENLAZADO' : '○ SIN SEÑAL'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.scanQuickBtn}
                            onPress={() => setDrawerOpen(true)}
                            activeOpacity={0.8}
                        >
                            <RefreshCw size={14} color={Theme.colors.primary} />
                            <Text style={styles.scanQuickTxt}>SCAN</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Telemetría ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TELEMETRÍA EN VIVO</Text>
                    <View style={styles.metricsGrid}>
                        <MetricCard label="BATERÍA" value={isOnline ? `${bat}%` : '--'} color="#ffd740" />
                        <MetricCard label="SEÑAL" value={isOnline ? `${signal}dBm` : '--'} color="#69f0ae" />
                        <MetricCard label="HEAP" value={isOnline ? heap : '--'} color={Theme.colors.primary} />
                        <MetricCard label="UPTIME" value={isOnline ? uptime : '--'} color="#ea80fc" />
                    </View>
                    {!isOnline && (
                        <Text style={styles.offlineHint}>Abre el menú → CONECTAR para recibir datos en vivo</Text>
                    )}
                </View>

                {/* ── Comandos ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>COMANDOS RÁPIDOS</Text>
                    <View style={styles.cmdGrid}>
                        {[
                            { label: 'FEED', action: 'FEED', color: Theme.colors.primary },
                            { label: 'PLAY', action: 'JUMP', color: '#69f0ae' },
                            { label: 'LED ON', action: 'LED_ON', color: '#ffd740' },
                            { label: 'LED OFF', action: 'LED_OFF', color: Theme.colors.secondary },
                        ].map((cmd) => (
                            <TouchableOpacity
                                key={cmd.action}
                                style={[styles.cmdBtn, { borderColor: cmd.color + '55' }]}
                                onPress={() => sendCommand('esp32', cmd.action)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.cmdBtnText, { color: cmd.color }]}>{cmd.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Smart Badge ── */}
                <BadgePanel ip={ip} />

                {/* Espaciado inferior */}
                <View style={{ height: 24 }} />
            </ScrollView>

            {/* ── Drawer menú hamburguesa ── */}
            <DrawerMenu
                visible={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ip={ip}
                onIpChange={setIp}
                isOnline={isOnline}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onScan={handleScan}
                scanning={scanning}
            />
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.bg },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,242,255,0.08)',
    },
    hamburger: { padding: 4, marginRight: 12 },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: {
        color: Theme.colors.primary,
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 3,
    },
    headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerIp: { color: Theme.colors.textSecondary, fontSize: 10, fontFamily: 'monospace' },

    // ── Scroll ──
    scroll: { flex: 1 },
    scrollContent: { padding: Theme.spacing.md, gap: Theme.spacing.md },

    // ── Sections ──
    section: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(0,242,255,0.1)',
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        gap: 12,
    },
    sectionTitle: {
        color: Theme.colors.textSecondary,
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    divider: { height: 1, backgroundColor: 'rgba(0,242,255,0.08)', marginVertical: 8 },

    // ── Conexión ──
    connectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 4,
    },
    pulseContainer: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    pulseRing: {
        position: 'absolute',
        width: 36, height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#ff5252',
        opacity: 0.3,
    },
    pulseRingActive: { borderColor: '#00e676', opacity: 0.5 },
    pulseDot: { width: 14, height: 14, borderRadius: 7 },

    connectionInfo: { flex: 1 },
    connectionLabel: { color: Theme.colors.textSecondary, fontSize: 9, letterSpacing: 1 },
    connectionIp: { fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 2 },
    connectionState: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },

    scanQuickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Theme.colors.primary + '44',
    },
    scanQuickTxt: { color: Theme.colors.primary, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },

    // ── Telemetría ──
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metricCard: {
        flex: 1,
        minWidth: '40%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: Theme.borderRadius.sm,
        padding: Theme.spacing.sm,
        alignItems: 'center',
    },
    metricValue: { fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' },
    metricLabel: { color: Theme.colors.textSecondary, fontSize: 8, marginTop: 2, letterSpacing: 1 },
    offlineHint: { color: Theme.colors.textSecondary, fontSize: 11, textAlign: 'center', fontStyle: 'italic' },

    // ── Comandos ──
    cmdGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cmdBtn: {
        flex: 1,
        minWidth: '40%',
        paddingVertical: 14,
        borderRadius: Theme.borderRadius.sm,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    cmdBtnText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },

    // ── Smart Badge ──
    badgeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    badgeThumb: {
        width: 68, height: 68,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,242,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeImg: { width: '100%', height: '100%' },
    badgePlaceholder: { alignItems: 'center', gap: 4 },
    badgePlaceholderText: { color: Theme.colors.textSecondary, fontSize: 7, letterSpacing: 1 },
    badgeActions: { flex: 1, gap: 8 },
    badgePickBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 8, borderWidth: 1,
        borderColor: Theme.colors.primary + '44',
    },
    badgeSendBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
    },
    badgeClearBtn: {
        alignSelf: 'center',
        padding: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    badgeBtnTxt: { color: '#000', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    btnDisabled: { opacity: 0.35 },
    feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    feedbackTxt: { fontSize: 11, flex: 1 },

    // ── Drawer ──
    drawerBackdrop: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        width: '100%',
        height: '100%',
        ...StyleSheet.absoluteFillObject,
    },
    drawer: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: DRAWER_W,
        backgroundColor: '#0f1117',
        borderRightWidth: 1,
        borderRightColor: 'rgba(0,242,255,0.15)',
        padding: Theme.spacing.lg,
        paddingTop: Platform.OS === 'android' ? 40 : Theme.spacing.xl,
        gap: 12,
    },
    drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    drawerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    drawerBrandText: { color: Theme.colors.primary, fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
    drawerSection: { color: Theme.colors.textSecondary, fontSize: 9, letterSpacing: 1.5, fontWeight: 'bold' },
    drawerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    drawerStatusText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    ipRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(0,242,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(0,242,255,0.2)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    drawerInput: {
        flex: 1, color: Theme.colors.primary,
        fontFamily: 'monospace', fontSize: 13,
    },
    drawerBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, paddingHorizontal: 14,
        borderRadius: 10,
    },
    scanBtn: { backgroundColor: 'rgba(0,242,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,242,255,0.25)' },
    connectBtn: { backgroundColor: Theme.colors.primary },
    disconnectBtn: { backgroundColor: 'rgba(255,82,82,0.1)', borderWidth: 1, borderColor: '#ff525244' },
    drawerBtnText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    drawerHint: { color: Theme.colors.textSecondary, fontSize: 10, lineHeight: 15 },

    // ── StatusDot ──
    dot: { width: 8, height: 8, borderRadius: 4 },
});

export default HomeScreen;
