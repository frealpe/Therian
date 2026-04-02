/**
 * BadgeUploader.jsx
 * Componente para enviar imágenes al display del ESP32 (Smart Badge).
 * Se integra en HomeScreen como una sección adicional no invasiva.
 *
 * Props:
 *   ipAddress {string} - IP del ESP32 (ej: "192.168.1.198")
 */
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Image as ImageIcon, Send, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import useBadge from '../hook/useBadge';
import { Theme } from '../styles/Theme';

const BadgeUploader = ({ ipAddress }) => {
    const { preview, loading, error, success, hasImage, pickImage, sendBadge, reset } = useBadge();

    return (
        <View style={styles.container}>
            {/* Título del panel */}
            <Text style={styles.title}>SMART_BADGE</Text>

            {/* Preview de imagen y controles */}
            <View style={styles.row}>
                {/* Área de preview */}
                <TouchableOpacity
                    style={styles.previewBox}
                    onPress={loading ? undefined : pickImage}
                    activeOpacity={0.75}
                >
                    {preview ? (
                        <Image source={{ uri: preview }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.previewPlaceholder}>
                            <ImageIcon size={28} color={Theme.colors.textSecondary} />
                            <Text style={styles.placeholderText}>TAP TO SELECT</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Botones de acción */}
                <View style={styles.actions}>
                    {/* Enviar */}
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.sendBtn, (!hasImage || loading) && styles.btnDisabled]}
                        onPress={() => sendBadge(ipAddress)}
                        disabled={!hasImage || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Send size={14} color="#fff" />
                                <Text style={styles.btnText}>SEND</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Reset */}
                    {hasImage && !loading && (
                        <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={reset} activeOpacity={0.8}>
                            <X size={14} color={Theme.colors.text} />
                            <Text style={[styles.btnText, { color: Theme.colors.text }]}>CLEAR</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Estado: éxito */}
            {success && (
                <View style={styles.statusRow}>
                    <CheckCircle size={14} color="#00e676" />
                    <Text style={[styles.statusText, { color: '#00e676' }]}>
                        Imagen enviada al ESP32 ✓
                    </Text>
                </View>
            )}

            {/* Estado: error */}
            {error && (
                <View style={styles.statusRow}>
                    <AlertCircle size={14} color={Theme.colors.secondary} />
                    <Text style={[styles.statusText, { color: Theme.colors.secondary }]} numberOfLines={2}>
                        {error}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0, 242, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(0, 242, 255, 0.15)',
        borderRadius: 12,
        padding: Theme.spacing.md,
        gap: Theme.spacing.sm,
    },
    title: {
        color: Theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        gap: Theme.spacing.md,
        alignItems: 'center',
    },
    previewBox: {
        width: 72,
        height: 72,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0, 242, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    previewPlaceholder: {
        alignItems: 'center',
        gap: 4,
    },
    placeholderText: {
        color: Theme.colors.textSecondary,
        fontSize: 7,
        letterSpacing: 0.5,
    },
    actions: {
        flex: 1,
        gap: Theme.spacing.sm,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    sendBtn: {
        backgroundColor: Theme.colors.primary,
    },
    resetBtn: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    btnDisabled: {
        opacity: 0.4,
    },
    btnText: {
        color: '#000',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 11,
        flex: 1,
    },
});

export default BadgeUploader;
