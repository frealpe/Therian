#pragma once
#include "iot32_functions.hpp"
#include "iot32_header.hpp"
#include <PubSubClient.h>
#include <WiFi.h>

WiFiClient espClient;
PubSubClient mqttClient(espClient);

char topic[150];

String mqtt_data = "";

long lastMqttReconnectAttempt = 0;
long lastMsg = 0;

void callback(char *topic, byte *payload, unsigned int length);
String Json();

char willTopic[150];
bool willQoS = 0;
bool willRetain = false;
String willMessage = "{\"connected\": false}";
bool cleanSession = true;

// -------------------------------------------------------------------
// MQTT Connect
// -------------------------------------------------------------------
boolean mqtt_connect() {
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(callback);
  log("[ INFO ] Intentando conexión al Broker MQTT...");
  // https://pubsubclient.knolleary.net/api.html
  // https://www.amebaiot.com/zh/rtl8722dm-arduino-api-pubsubclient/

  // boolean connect (clientID)
  // boolean connect (clientID, willTopic, willQoS, willRetain,willMessage)
  // boolean connect (clientID, username, password)
  // boolean connect (clientID, username, password, willTopic, willQoS,
  // willRetain, willMessage)
  // * boolean connect (clientID, username, password, willTopic, willQoS,
  // willRetain, willMessage, cleanSession)

  /*
      Parámetros id: ID de cliente, un identificador de cadena único
      usuario: nombre de usuario para autenticación, valor predeterminado NULL
      pass: contraseña para autenticación, valor predeterminado NULL
      willTopic: el tema que utilizará el mensaje
      willQoS: la calidad del servicio que utilizará el mensaje will
      willRetain: si el testamento debe publicarse con el indicador de retención
      willMessage: la carga del mensaje del testamento
      cleanSession: Si cleansession se establece en true , se eliminarán todos
     los temas suscritos
  */

  // Topico para enviar los estados.
  // Topic de subida (Publish)
  String topic_publish = String(mqtt_topic_publish);
  topic_publish.toCharArray(willTopic, 150);

  // Buffer para el ID de cliente
  const char *client_id = mqtt_cloud_id;

  // Intento de conexión anónima (sin credenciales)
  // Descomentar el bloque if/else cuando el broker requiera autenticación:
  // if (strlen(mqtt_user) > 0) {
  //   connected = mqttClient.connect(client_id, mqtt_user, mqtt_password,
  //                                  willTopic, willQoS, willRetain,
  //                                  willMessage.c_str(), cleanSession);
  // } else {
  //   connected = mqttClient.connect(client_id, NULL, NULL, willTopic, willQoS,
  //                                  willRetain, willMessage.c_str(),
  //                                  cleanSession);
  // }
  boolean connected =
      mqttClient.connect(client_id, NULL, NULL, willTopic, willQoS, willRetain,
                         willMessage.c_str(), cleanSession);

  if (connected) {
    log("[ INFO ] Conectado al Broker MQTT");
    // Topic de bajada (Subscribe)
    String topic_subscribe = String(mqtt_topic_subscribe);
    topic_subscribe.toCharArray(topic, 150);

    // Nos suscribimos a comandos Topico: v1/device/usuario/dispositivo/comando
    // boolean subscribe (topic)
    // * boolean subscribe (topic, [qos])
    // qos - optional the qos to subscribe at (int: 0 or 1 only)
    // Función para suscribirnos al Topico
    if (mqttClient.subscribe(topic, mqtt_qos)) {
      log("[ INFO ] Suscrito: " + String(topic));
    } else {
      log("[ ERROR ] Failed, to suscribe!");
    }
    // Si tenemos habilitado en envío de estados enviamos en mensaje de
    // conectado
    if (mqtt_status_send) {
      // int publish (topic, payload)
      //  * int publish (topic, payload, retained)
      // int publish (topic, payload, length, retained)
      // topic - the topic to publish to (const char[])
      // payload - the message to publish (const char[])
      // retained - informacion retenida (boolean)
      // length - the length of the message (byte)
      mqttClient.publish(willTopic, "{\"connected\": true}", mqtt_retain);
    }
  } else {
    log(String("[ ERROR ] Fallo conexión MQTT, rc= ") +
        String(mqttClient.state()));
    return (0);
  }
  return (1);
}
// -------------------------------------------------------------------
// Manejo de los Mensajes Entrantes
// -------------------------------------------------------------------
void callback(char *topic, byte *payload, unsigned int length) {
  String str_topic(topic);
  String mensaje((char *)payload, length);
  mensaje.trim();

  // Parpadeo del Led por recepción (llamamos una vez en lugar de iterar)
  mqttRX();

  log("[ INFO ] Topico -->" + str_topic);
  log("[ INFO ] Mensaje -->" + mensaje);
}
// -------------------------------------------------------------------
// Manejo de los Mensajes Salientes
// -------------------------------------------------------------------
void mqtt_publish() {
  String topic = String(mqtt_topic_publish);

  if (strlen(mqtt_custom_message) > 0) {
    mqtt_data = String(mqtt_custom_message);
  } else {
    mqtt_data = Json();
  }

  mqttClient.publish(topic.c_str(), mqtt_data.c_str(), mqtt_retain);
  mqtt_data = "";
  mqttTX();
}
// -------------------------------------------------------------------
// JSON con información del Dispositivo para envio por MQTT
// -------------------------------------------------------------------
String Json() {
  String response;
  DynamicJsonDocument jsonDoc(2048);
  jsonDoc["device_serial"] = deviceID();
  jsonDoc["device_manufacturer"] = String(device_manufacturer);
  jsonDoc["device_fw_version"] = device_fw_version;
  jsonDoc["device_hw_version"] = String(device_hw_version);
  jsonDoc["device_sdk"] = String(ESP.getSdkVersion());
  jsonDoc["device_time_active"] = String(longTimeStr(millis() / 1000));
  jsonDoc["device_ram_available"] = String(ESP.getFreeHeap());
  jsonDoc["device_ram_size"] = String(ESP.getHeapSize());
  jsonDoc["device_spiffs_total"] = String(SPIFFS.totalBytes());
  jsonDoc["device_spiffs_used"] = String(SPIFFS.usedBytes());
  jsonDoc["device_cpu_clock"] = String(getCpuFrequencyMhz());
  jsonDoc["device_flash_size"] =
      String(ESP.getFlashChipSize() / (1024.0 * 1024), 2);
  jsonDoc["device_restart"] = String(device_restart);
  serializeJson(jsonDoc, response);
  return response;
}
// -------------------------------------------------------------------
// MQTT Loop Principal
// -------------------------------------------------------------------
void mqttLoop() {
  if (mqtt_cloud_enable) {
    if (!mqttClient.connected()) {
      long now = millis();
      // Intente conectarse continuamente durante los primeros 60 segundos
      // y luego vuelva a intentarlo una vez cada 120 segundos
      if ((now < 60000) || ((now - lastMqttReconnectAttempt) > 120000)) {
        lastMqttReconnectAttempt = now;
        // Intento de reconectar
        if (mqtt_connect()) {
          lastMqttReconnectAttempt = 0;
        }
        // Poner en ON el Led del MQTT
        setOnSingle(MQTTLED);
      }
    } else {
      mqttClient.loop();
      // Poner en OFF el Led del MQTT
      setOffSingle(MQTTLED);
    }
  }
}
