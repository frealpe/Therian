
#pragma once
#include "iot32_functions.hpp"
#include "iot32_header.hpp"

boolean settingsRead();
void settingsReset();
boolean settingsSave();
// -------------------------------------------------------------------
// Leer settings.json
// -------------------------------------------------------------------
boolean settingsRead() {
  settingsReset();

  DynamicJsonDocument jsonSettings(capacitySettings);
  File file = SPIFFS.open("/settings.json", "r");

  if (!file) {
    log("[ ERROR ] No se pudo abrir settings.json. Usando valores por "
        "defecto.");
    return false;
  }

  DeserializationError error = deserializeJson(jsonSettings, file);
  file.close();

  if (error) {
    log("[ ERROR ] Error al parsear settings.json: " + String(error.c_str()));
    return false;
  }

  // --- Dispositivo ---
  if (jsonSettings.containsKey("device_config_file"))
    device_config_file = jsonSettings["device_config_file"];

  const char *val;
  if ((val = jsonSettings["device_config_serial"]))
    strlcpy(device_config_serial, val, sizeof(device_config_serial));

  // --- OVERRIDE MANUAL: Descomenta la siguiente línea para forzar el serial de
  // pruebas ---
  strlcpy(device_config_serial, "serial1320001", sizeof(device_config_serial));
  if ((val = jsonSettings["device_id"]))
    strlcpy(device_id, val, sizeof(device_id));
  if ((val = jsonSettings["device_old_user"]))
    strlcpy(device_old_user, val, sizeof(device_old_user));
  if ((val = jsonSettings["device_old_password"]))
    strlcpy(device_old_password, val, sizeof(device_old_password));

  // --- WIFI Cliente ---
  if (jsonSettings.containsKey("wifi_ip_static"))
    wifi_ip_static = jsonSettings["wifi_ip_static"];
  if ((val = jsonSettings["wifi_ssid"]))
    strlcpy(wifi_ssid, val, sizeof(wifi_ssid));
  if ((val = jsonSettings["wifi_password"]))
    strlcpy(wifi_password, val, sizeof(wifi_password));
  if ((val = jsonSettings["wifi_ipv4"]))
    strlcpy(wifi_ipv4, val, sizeof(wifi_ipv4));
  if ((val = jsonSettings["wifi_subnet"]))
    strlcpy(wifi_subnet, val, sizeof(wifi_subnet));
  if ((val = jsonSettings["wifi_gateway"]))
    strlcpy(wifi_gateway, val, sizeof(wifi_gateway));
  if ((val = jsonSettings["wifi_dns_primary"]))
    strlcpy(wifi_dns_primary, val, sizeof(wifi_dns_primary));
  if ((val = jsonSettings["wifi_dns_secondary"]))
    strlcpy(wifi_dns_secondary, val, sizeof(wifi_dns_secondary));

  // --- WIFI AP ---
  if (jsonSettings.containsKey("ap_mode"))
    ap_mode = jsonSettings["ap_mode"];
  if ((val = jsonSettings["ap_ssid"]))
    strlcpy(ap_ssid, val, sizeof(ap_ssid));
  if ((val = jsonSettings["ap_password"]))
    strlcpy(ap_password, val, sizeof(ap_password));
  if (jsonSettings.containsKey("ap_visibility"))
    ap_visibility = jsonSettings["ap_visibility"];
  if (jsonSettings.containsKey("ap_chanel"))
    ap_chanel = jsonSettings["ap_chanel"];
  if (jsonSettings.containsKey("ap_connect"))
    ap_connect = jsonSettings["ap_connect"];

  // --- MQTT ---
  if (jsonSettings.containsKey("mqtt_cloud_enable"))
    mqtt_cloud_enable = jsonSettings["mqtt_cloud_enable"];
  if ((val = jsonSettings["mqtt_user"]))
    strlcpy(mqtt_user, val, sizeof(mqtt_user));
  if ((val = jsonSettings["mqtt_password"]))
    strlcpy(mqtt_password, val, sizeof(mqtt_password));
  if ((val = jsonSettings["mqtt_server"]))
    strlcpy(mqtt_server, val, sizeof(mqtt_server));
  if ((val = jsonSettings["mqtt_cloud_id"]))
    strlcpy(mqtt_cloud_id, val, sizeof(mqtt_cloud_id));
  if (jsonSettings.containsKey("mqtt_port"))
    mqtt_port = jsonSettings["mqtt_port"];
  if (jsonSettings.containsKey("mqtt_retain"))
    mqtt_retain = jsonSettings["mqtt_retain"];
  if (jsonSettings.containsKey("mqtt_qos"))
    mqtt_qos = jsonSettings["mqtt_qos"];
  if (jsonSettings.containsKey("mqtt_time_send"))
    mqtt_time_send = jsonSettings["mqtt_time_send"];
  if (jsonSettings.containsKey("mqtt_time_interval"))
    mqtt_time_interval = jsonSettings["mqtt_time_interval"];
  if (jsonSettings.containsKey("mqtt_time_unit"))
    mqtt_time_unit = jsonSettings["mqtt_time_unit"];
  if (jsonSettings.containsKey("mqtt_status_send"))
    mqtt_status_send = jsonSettings["mqtt_status_send"];
  if ((val = jsonSettings["mqtt_topic_publish"]) && strcmp(val, "null") != 0 &&
      strlen(val) > 0)
    strlcpy(mqtt_topic_publish, val, sizeof(mqtt_topic_publish));
  if ((val = jsonSettings["mqtt_topic_subscribe"]) &&
      strcmp(val, "null") != 0 && strlen(val) > 0)
    strlcpy(mqtt_topic_subscribe, val, sizeof(mqtt_topic_subscribe));
  if ((val = jsonSettings["mqtt_custom_message"]) && strcmp(val, "null") != 0 &&
      strlen(val) > 0)
    strlcpy(mqtt_custom_message, val, sizeof(mqtt_custom_message));

  log("[ INFO ] Lectura de las configuraciones correcta");
  return true;
}
// -------------------------------------------------------------------
// Valores de Fábrica al settings.json
// -------------------------------------------------------------------
void settingsReset() {
  // -------------------------------------------------------------------
  // Dispositivo settings.json
  // -------------------------------------------------------------------
  device_config_file = true;
  strlcpy(device_config_serial, "serial1320001", sizeof(device_config_serial));
  strlcpy(device_id, "acueductobogota", sizeof(device_id));
  strlcpy(device_old_user, hexStr(ESP.getEfuseMac(), 12).c_str(),
          sizeof(device_old_user));
  strlcpy(device_old_password, hexStr(ESP.getEfuseMac(), 12).c_str(),
          sizeof(device_old_password));
  // -------------------------------------------------------------------
  // WIFI Cliente settings.json
  // -------------------------------------------------------------------
  wifi_ip_static = true;
  strlcpy(wifi_ssid, "NICOLAS", sizeof(wifi_ssid));
  strlcpy(wifi_password, "nicolas1308", sizeof(wifi_password));
  strlcpy(wifi_ipv4, "192.168.20.150", sizeof(wifi_ipv4));
  strlcpy(wifi_subnet, "255.255.255.0", sizeof(wifi_subnet));
  strlcpy(wifi_gateway, "192.168.20.1", sizeof(wifi_gateway));
  strlcpy(wifi_dns_primary, "8.8.8.8", sizeof(wifi_dns_primary));
  strlcpy(wifi_dns_secondary, "8.8.4.4", sizeof(wifi_dns_secondary));
  // -------------------------------------------------------------------
  // WIFI AP settings.json
  // -------------------------------------------------------------------
  ap_mode = false;
  strlcpy(ap_ssid, deviceID().c_str(), sizeof(ap_ssid));
  strlcpy(ap_password, hexStr(ESP.getEfuseMac(), 12).c_str(),
          sizeof(ap_password));
  ap_visibility = false; // Parametro para ocultar el AP
  ap_chanel = 9;
  ap_connect = 4;
  // -------------------------------------------------------------------
  // Cloud settings.json
  // -------------------------------------------------------------------
  mqtt_cloud_enable = true;
  strlcpy(mqtt_user, "", sizeof(mqtt_user));
  strlcpy(mqtt_password, "", sizeof(mqtt_password));
  strlcpy(mqtt_server, "109.199.101.0", sizeof(mqtt_server));
  strlcpy(mqtt_cloud_id, deviceID().c_str(), sizeof(mqtt_cloud_id));
  mqtt_port = 1883;
  mqtt_retain = false;
  mqtt_qos = 0;
  mqtt_time_send = true;
  mqtt_time_interval = 30000;
  mqtt_time_unit = 1;
  mqtt_status_send = true;
  strlcpy(mqtt_topic_publish, "cat1/acb/up", sizeof(mqtt_topic_publish));
  strlcpy(mqtt_topic_subscribe, "cat1/acb/down/imei",
          sizeof(mqtt_topic_subscribe));
  strlcpy(mqtt_custom_message, "", sizeof(mqtt_custom_message));
  log("[ INFO ] Se reiniciaron todos los valores por defecto");
}

// -------------------------------------------------------------------
// Guardar settings.json
// -------------------------------------------------------------------
boolean settingsSave() {
  // StaticJsonDocument<capacitySettings> jsonSettings;
  DynamicJsonDocument jsonSettings(capacitySettings);

  File file = SPIFFS.open("/settings.json", "w+");

  if (file) {
    // -------------------------------------------------------------------
    // Dispositivo settings.json
    // -------------------------------------------------------------------
    jsonSettings["device_config_file"] = device_config_file;
    jsonSettings["device_config_serial"] = device_config_serial;
    jsonSettings["device_id"] = device_id;
    jsonSettings["device_old_user"] = device_old_user;
    jsonSettings["device_old_password"] = device_old_password;
    // -------------------------------------------------------------------
    // WIFI Cliente settings.json
    // -------------------------------------------------------------------
    jsonSettings["wifi_ip_static"] = wifi_ip_static;
    jsonSettings["wifi_ssid"] = wifi_ssid;
    jsonSettings["wifi_password"] = wifi_password;
    jsonSettings["wifi_ipv4"] = wifi_ipv4;
    jsonSettings["wifi_subnet"] = wifi_subnet;
    jsonSettings["wifi_gateway"] = wifi_gateway;
    jsonSettings["wifi_dns_primary"] = wifi_dns_primary;
    jsonSettings["wifi_dns_secondary"] = wifi_dns_secondary;
    // -------------------------------------------------------------------
    // WIFI AP settings.json
    // -------------------------------------------------------------------
    jsonSettings["ap_mode"] = ap_mode;
    jsonSettings["ap_ssid"] = ap_ssid;
    jsonSettings["ap_password"] = ap_password;
    jsonSettings["ap_visibility"] = ap_visibility;
    jsonSettings["ap_chanel"] = ap_chanel;
    jsonSettings["ap_connect"] = ap_connect;
    // -------------------------------------------------------------------
    // Cloud settings.json
    // -------------------------------------------------------------------
    jsonSettings["mqtt_cloud_enable"] = mqtt_cloud_enable;
    jsonSettings["mqtt_user"] = mqtt_user;
    jsonSettings["mqtt_password"] = mqtt_password;
    jsonSettings["mqtt_server"] = mqtt_server;
    jsonSettings["mqtt_cloud_id"] = mqtt_cloud_id;
    jsonSettings["mqtt_port"] = mqtt_port;
    jsonSettings["mqtt_retain"] = mqtt_retain;
    jsonSettings["mqtt_qos"] = mqtt_qos;
    jsonSettings["mqtt_time_send"] = mqtt_time_send;
    jsonSettings["mqtt_time_interval"] = mqtt_time_interval;
    jsonSettings["mqtt_time_unit"] = mqtt_time_unit;
    jsonSettings["mqtt_status_send"] = mqtt_status_send;
    jsonSettings["mqtt_topic_publish"] = mqtt_topic_publish;
    jsonSettings["mqtt_topic_subscribe"] = mqtt_topic_subscribe;
    jsonSettings["mqtt_custom_message"] = mqtt_custom_message;
    serializeJsonPretty(jsonSettings, file);
    file.close();
    log("[ INFO ] Configuración Guardada correctamente");
    serializeJsonPretty(jsonSettings, Serial);
    return true;
  } else {
    log("[ ERROR ] Falló el guardado de la configuración");
    return false;
  }
}