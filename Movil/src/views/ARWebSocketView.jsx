import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useWebSocket } from '../hook/useWebSocket';

const ARWebSocketView = () => {
    // Para simplificar la prueba, permitiremos que el usuario introduzca la IP del ESP32
    // En producción se autodescubriría o vendría configurado por MDNS / DHCP.
    const [ipAddress, setIpAddress] = useState('192.168.4.1');
    const [wsUrl, setWsUrl] = useState(null);

    const {
        isConnected,
        telemetry,
        info,
        sendAnimation,
        requestTelemetry,
    } = useWebSocket(wsUrl);

    const handleConnect = () => {
        setWsUrl(`ws://${ipAddress}/ws`);
    };

    const handleDisconnect = () => {
        setWsUrl(null);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>AR ESP32 Bridge</Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Conexión</Text>
                <TextInput
                    style={styles.input}
                    value={ipAddress}
                    onChangeText={setIpAddress}
                    placeholder="IP del ESP32 (ej. 192.168.4.1)"
                    keyboardType="numeric"
                    editable={!isConnected}
                />

                {!isConnected ? (
                    <TouchableOpacity style={styles.buttonConnect} onPress={handleConnect}>
                        <Text style={styles.buttonText}>Conectar</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.buttonDisconnect} onPress={handleDisconnect}>
                        <Text style={styles.buttonText}>Desconectar</Text>
                    </TouchableOpacity>
                )}

                <Text style={[styles.status, { color: isConnected ? '#4caf50' : '#f44336' }]}>
                    Estado: {isConnected ? 'Conectado' : 'Desconectado'}
                </Text>
                {info ? <Text style={styles.infoText}>{info}</Text> : null}
            </View>

            {isConnected && (
                <>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Telemetría</Text>
                        <TouchableOpacity style={styles.buttonSecondary} onPress={requestTelemetry}>
                            <Text style={styles.buttonText}>Solicitar Telemetría</Text>
                        </TouchableOpacity>

                        {telemetry ? (
                            <View style={styles.telemetryContainer}>
                                <Text style={styles.dataText}>Batería: {telemetry.bat}%</Text>
                                <Text style={styles.dataText}>Señal (RSSI): {telemetry.signal} dBm</Text>
                                <Text style={styles.dataText}>RAM Libre: {telemetry.free_heap} B</Text>
                                <Text style={styles.dataText}>RAM Total: {telemetry.heap_size} B</Text>
                                <Text style={styles.dataText}>Uptime: {(telemetry.uptime / 1000).toFixed(1)} s</Text>
                            </View>
                        ) : (
                            <Text style={styles.dataText}>Esperando datos...</Text>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Controles AR (Avatar)</Text>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.buttonAnim} onPress={() => sendAnimation('IDLE')}>
                                <Text style={styles.buttonText}>IDLE</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonAnim} onPress={() => sendAnimation('WALK')}>
                                <Text style={styles.buttonText}>WALK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonAnim} onPress={() => sendAnimation('JUMP')}>
                                <Text style={styles.buttonText}>JUMP</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.buttonAnim} onPress={() => sendAnimation('HAPPY')}>
                                <Text style={styles.buttonText}>HAPPY</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonAnim} onPress={() => sendAnimation('ANGRY')}>
                                <Text style={styles.buttonText}>ANGRY</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#1e1e1e',
        paddingTop: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#e0e0e0',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#3a3a3a',
        color: '#ffffff',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    buttonConnect: {
        backgroundColor: '#4caf50',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonDisconnect: {
        backgroundColor: '#f44336',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonSecondary: {
        backgroundColor: '#2196f3',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    buttonAnim: {
        flex: 1,
        backgroundColor: '#ff9800',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    status: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    infoText: {
        color: '#9e9e9e',
        textAlign: 'center',
        marginTop: 5,
    },
    telemetryContainer: {
        backgroundColor: '#121212',
        padding: 10,
        borderRadius: 5,
    },
    dataText: {
        color: '#4db8ff',
        fontSize: 14,
        marginVertical: 2,
    },
});

export default ARWebSocketView;
