/**
 * useBadge.js
 * Hook para el sistema Smart Badge.
 * Permite seleccionar una imagen desde la galería, convertirla a base64
 * comprimida y enviarla al ESP32 via POST /api/badge/image.
 *
 * Uso:
 *   const { pickImage, sendBadge, preview, loading, error, success } = useBadge();
 */
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

// Dimensiones máximas de la imagen para el ESP32
const TARGET_WIDTH = 240;
const TARGET_HEIGHT = 240;
// Calidad de compresión JPEG (0 = mínima, 1 = máxima)
const JPEG_QUALITY = 0.55;

/**
 * Hook central para la funcionalidad Smart Badge.
 */
const useBadge = () => {
    const [preview, setPreview] = useState(null);   // URI local para vista previa
    const [base64Data, setBase64Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // ------------------------------------------------------------------
    // pickImage: Abre la galería, redimensiona y convierte a base64
    // ------------------------------------------------------------------
    const pickImage = useCallback(async () => {
        setError(null);
        setSuccess(false);

        // Solicitar permiso si es necesario
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setError('Se necesita permiso para acceder a la galería.');
            return;
        }

        // Abrir galería con opciones de redimensión y compresión integradas
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,        // Permite recortar cuadrado
            aspect: [1, 1],             // Forzar relación 1:1
            quality: JPEG_QUALITY,      // Compresión JPEG
            base64: true,              // Incluir base64 en el resultado
            exif: false,               // No necesitamos EXIF
        });

        if (result.canceled || !result.assets || result.assets.length === 0) return;

        const asset = result.assets[0];

        // Validar tamaño del base64 (límite aprox 120KB para ESP32 con 320KB RAM)
        const b64 = asset.base64;
        if (!b64) {
            setError('No se pudo obtener base64 de la imagen.');
            return;
        }

        const estimatedBytes = (b64.length * 3) / 4;
        if (estimatedBytes > 120 * 1024) {
            setError(`Imagen demasiado grande (${Math.round(estimatedBytes / 1024)}KB). Máximo 120KB.`);
            return;
        }

        setPreview(asset.uri);
        setBase64Data(b64);
    }, []);

    // ------------------------------------------------------------------
    // sendBadge: Envía el base64 al ESP32 vía HTTP POST
    // @param {string} ipAddress - IP del ESP32 ej: "192.168.1.198"
    // ------------------------------------------------------------------
    const sendBadge = useCallback(async (ipAddress) => {
        if (!base64Data) {
            setError('Primero selecciona una imagen.');
            return;
        }
        if (!ipAddress) {
            setError('IP del ESP32 no especificada.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        // Señalizar a la vista web (/mascota) que hay una transmisión en curso
        try { localStorage.setItem('badge_uploading', '1'); } catch (_) {}

        const url = `http://${ipAddress}/api/badge/image`;

        try {
            const controller = new AbortController();
            // Timeout de 30 segundos para imágenes grandes
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const body = await response.text();
                setError(`Error del ESP32 (${response.status}): ${body}`);
                return;
            }

            const json = await response.json();
            if (json.ok) {
                setSuccess(true);
            } else {
                setError(json.error || 'El ESP32 rechazó la imagen.');
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setError('Timeout: El ESP32 tardó demasiado. Verifica la conexión WiFi.');
            } else {
                setError(`Error de red: ${err.message}`);
            }
        } finally {
            setLoading(false);
            // Limpiar flag de uploading en la web
            try { localStorage.removeItem('badge_uploading'); } catch (_) {}
        }
    }, [base64Data]);

    // ------------------------------------------------------------------
    // checkStatus: Consulta /api/badge/status en el ESP32
    // ------------------------------------------------------------------
    const checkStatus = useCallback(async (ipAddress) => {
        if (!ipAddress) return null;
        try {
            const res = await fetch(`http://${ipAddress}/api/badge/status`, {
                method: 'GET',
            });
            if (res.ok) return await res.json();
        } catch (_) { /* ignorar errores de red */ }
        return null;
    }, []);

    const reset = useCallback(() => {
        setPreview(null);
        setBase64Data(null);
        setError(null);
        setSuccess(false);
    }, []);

    return {
        preview,
        loading,
        error,
        success,
        hasImage: !!base64Data,
        pickImage,
        sendBadge,
        checkStatus,
        reset,
    };
};

export default useBadge;
