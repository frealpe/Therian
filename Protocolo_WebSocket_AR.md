# Protocolo de Comunicación WebSocket para Realidad Aumentada (AR) y ESP32

Este documento describe la arquitectura y el protocolo JSON optimizado para la comunicación en tiempo real entre la aplicación móvil (Frontend en React Native) y el backend ligero en el ESP32, permitiendo la futura integración con agentes de IA.

## Arquitectura de Red

La comunicación se basa en una conexión **WebSocket (WS)** bidireccional sobre la red WiFi local o mediante conexión directa al Access Point (AP) del ESP32.
- **Servidor:** El ESP32 aloja un servidor WebSocket asíncrono en `ws://<IP_ESP32>/ws`.
- **Cliente:** La App Móvil AR se conecta a este servidor usando la API estándar de WebSockets.
- **Escalabilidad y Agentes de IA:** La misma interfaz WebSocket permite que agentes externos (ej. un backend NodeJS central) se conecten y envíen comandos de control y animación que el ESP32 interpreta de la misma manera que si vinieran de la app móvil.

## Protocolo de Mensajes JSON

Todos los mensajes transmitidos sobre el WebSocket tienen una estructura base consistente:

```json
{
  "t": "<TIPO_DE_MENSAJE>",
  "v": <VALOR_O_PAYLOAD>
}
```

- **`t` (type):** String que define la categoría del mensaje.
- **`v` (value/payload):** String, Objeto o Número con los datos de la acción o evento.

### 1. Mensajes del Servidor (ESP32) al Cliente

#### Información de Conexión Inicial
Enviado por el ESP32 justo después de establecerse el socket:
```json
{
  "t": "info",
  "v": "Conectado al ESP32 AR Bridge"
}
```

#### Telemetría Periódica (Status)
El ESP32 emite cada 5 segundos (por defecto) el estado de sus sensores y métricas vitales, facilitando a la App Móvil y a las IAs el monitoreo de recursos:
```json
{
  "t": "data",
  "v": {
    "bat": 85,          // Porcentaje estimado de batería (0-100)
    "signal": -60,      // Nivel de señal RSSI en dBm
    "free_heap": 124500,// Memoria RAM libre en bytes
    "heap_size": 320000,// Memoria RAM total disponible
    "uptime": 120000    // Tiempo de encendido en milisegundos (millis())
  }
}
```

### 2. Mensajes del Cliente (App Móvil / IA) al Servidor (ESP32)

#### Comandos de Animación
Usados para decirle a la interfaz gráfica del ESP32 (Avatar/Mascota) que cambie de estado o inicie una animación (basado en `lv_mascot.hpp` / `lvgl`):
```json
{
  "t": "anim",
  "v": "JUMP"
}
```
*Nota: Actualmente el ESP32 captura y hace log de `anim_type`. La implementación visual se debe extender en `lv_mascot.hpp` asociando los strings (ej. "JUMP", "WALK", "IDLE") a las acciones correspondientes del sprite.*

#### Comandos de Control (Control y Peticiones bajo demanda)
Pensados para escalar la interacción y consultar datos sin esperar el broadcast periódico.

**Petición de telemetría bajo demanda:**
```json
{
  "t": "control",
  "v": "GET_TELEMETRY"
}
```
*Respuesta del ESP32:* Inmediatamente emite el JSON de telemetría (mismo formato de `{"t": "data", ...}`).

### Manejo de Errores y Seguridad (Futuro)

- **Reconexión:** El cliente móvil implementa Backoff Exponencial en caso de desconexiones para no saturar al ESP32.
- **Autenticación (Futuro):** Si se expone fuera de la LAN local, se debería incluir un token de sesión en la URL de conexión WebSocket (`ws://<IP_ESP32>/ws?token=XYZ`), procesable en el evento de conexión de `AsyncWebServer`.
