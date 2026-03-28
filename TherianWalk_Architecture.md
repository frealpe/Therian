# TherianWalk - Definición de Arquitectura y Comportamiento

Este documento define la lógica, flujos, estados y eventos de la aplicación móvil marketplace "TherianWalk".

## 🧠 1. Estados Globales (Global State Management)

Se recomienda el uso de Zustand, Redux Toolkit o Context API para manejar los siguientes estados:

*   **`useAuthStore`**: Maneja la sesión del usuario (`user: User | null`), el token JWT y el rol (`'CLIENT' | 'PROVIDER'`).
*   **`useLocationStore`**: Almacena las coordenadas actuales `[lat, lng]`, permisos de GPS y el radio de búsqueda activo.
*   **`useServiceStore`**: Caché de servicios recuperados (`services[]`), filtros activos (distancia, precio, rating) y estado de paginación o loading.
*   **`useBookingStore`**: Reservas activas, historial y estado temporal del flujo de checkout.
*   **`useDeviceStore`** (IoT): Estado del ESP32 vinculado (`isConnected: boolean`, `lastActivity: timestamp`, `currentAvatarState: string`).
*   **`useChatStore`**: Salas de chat activas, mensajes no leídos y estado de conexión principal del WebSocket.

---

## 🔁 2. Eventos WebSocket (Sincronización Real-Time)

El cliente de WebSocket central debe escuchar y emitir los siguientes canales o eventos clave (usando Socket.io o WS nativo):

### Emisiones (Cliente -> Servidor)
*   `update_location`: Envía `[lat, lng]` periódicamente si el proveedor está activo o el cliente está en un servicio.
*   `send_message`: Emite `{ chatId, text, location?, timestamp }`.
*   `device_command`: Envía comandos al ESP32 (`{ command: 'display_avatar', payload: 'happy' }`).
*   `booking_status_update`: Solicita cambio de estado de reserva (`accept`, `start`, `complete`).

### Escuchas (Servidor -> Cliente)
*   `location_updated`: Recibe coordenadas de los proveedores cercanos en tiempo real.
*   `new_message`: Recibe `{ senderId, text, timestamp }`.
*   `booking_notification`: Recibe actualizaciones del estado de una reserva.
*   `device_status`: Sincroniza la placa ESP32 (`{ status: 'online' | 'offline', telemetry: {...} }`).

---

## 📱 3. Definición de Lógica por Pantalla

### 📍 Home (Mapa Principal)
*   **Lógica**: Al montar, solicita permisos de ubicación. Si se otorgan, centra la cámara e inicia la conexión WS para emitir `update_location` y escuchar `providers_nearby`.
*   **Hooks**: `useLocation()`, `useWebSocket()`.
*   **Comportamiento**: 
    *   Muestra marcadores dinámicos.
    *   Almacena en caché la última ubicación conocida (Modo Offline).
    *   Si no hay resultados: Inyecta un BottomSheet sugiriendo ampliar el radio de búsqueda.
    *   Click en Marcador -> Abre un Modal/BottomSheet con resumen del Proveedor -> Click en "Ver Perfil".

### 🔎 Lista de Servicios (Explorar)
*   **Lógica**: Fetch inicial vía HTTP REST (`GET /api/services`). Aplica filtros a nivel backend. Implementa `FlatList` con `onEndReached` para paginación.
*   **Hooks**: `useServicesFetch()`, `useDebounce()` (para barras de búsqueda).
*   **Comportamiento**: Estados de `isLoading`, `isError` (con botón de reintentar si no hay red), y refetch al hacer Pull-to-Refresh.

### 👤 Perfil del Proveedor
*   **Lógica**: Obtiene el detalle completo del proveedor por HTTP. Verifica en el estado global de `chat` si ya existe una sala activa con este proveedor.
*   **Comportamiento**: Muestra reseñas, galería y servicios. Botón flotante persistente: "Solicitar Reserva".

### 📅 Flujo de Reserva y Pagos (Checkout)
*   **Lógica de Estados**:
    1.  *Selección*: Elegir fecha/hora (revisa disponibilidad contra el backend).
    2.  *Confirmación*: Resumen del total.
    3.  *Pago*: Integración con SDK de pagos (ej. Stripe/MercadoPago). Maneja estado `processing_payment`.
    4.  *Resultado*: Si hay éxito -> emite WS `new_booking`, cambia pantalla a "Reserva Confirmada". Si falla -> mantiene estado, muestra Toast y permite reintento.

### 📡 Panel de Control IoT (Integración ESP32)
*   **Lógica**: Disponible solo si `user.hasDevice == true`.
*   **Hooks**: `useDeviceControl()`.
*   **Comportamiento**:
    *   **Indicador de estado**: Punto verde (Online) o gris (Offline) basado en los pings del WS.
    *   Si está Offline: Los botones de comando se bloquean y muestran opacidad reducida (`disabled={true}`).
    *   **Botones de Acción Rápida**: Mapeados a funciones que ejecutan `device_command`.
        *   "Mostrar Avatar Feliz" -> emite `{ command: 'display_avatar', payload: 'happy' }`
        *   "Sonar Alarma" -> emite `{ command: 'buzzer_alert' }`
    *   **Feedback**: Al presionar, el botón pasa a `isLoading` hasta que el WS responde con `device_ack` (Acknowledge) confirmando que el ESP32 ejecutó la acción. Si toma más de 5 seg, muestra "Timeout - Dispositivo no respondió".

---

## ⚙️ 4. Hooks React Sugeridos (Custom Hooks)

```javascript
// Maneja la reconexión y fallback a HTTP si WS falla
function useAppWebSocket() { ... }

// Encapsula permisos, retries y watchPositionAsync
function useLiveLocation() { ... }

// Desacopla la lógica pesada del panel IoT
function useDeviceControl(deviceId) {
    const { sendCommand } = useAppWebSocket();
    const isOnline = useSelector(state => state.device.isOnline);
    
    const executeAction = async (action, payload) => {
        if (!isOnline) {
            showToast('El ESP32 está desconectado');
            return;
        }
        await sendCommand(deviceId, action, payload); // Promesa con timeout
    };
    
    return { isOnline, executeAction };
}
```

---

## 🚦 5. Manejo de Errores y Modo Offline

*   **Redundancia de Red**: La app intercepta cambios de `NetInfo` (conexión a internet). Si se pierde, pasa a "Modo Degrandado".
*   **Fallback WS -> HTTP**: Si el WebSocket falla tras 3 intentos (Exponential Backoff), el chat y las ubicaciones caen temporalmente a *Long Polling* o peticiones HTTP manuales cada 10 segundos.
*   **Alertas Claras**: UI libre de tecnicismos. Errores de API (ej. 404, 500) se traducen a "Tuvimos un problema al cargar esto. Toca para reintentar."
