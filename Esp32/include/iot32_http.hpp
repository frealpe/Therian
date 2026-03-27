#pragma once
#include "iot32_functions.hpp"
#include "iot32_header.hpp"
#include "mbedtls/aes.h"
#include "mbedtls/base64.h"
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <base64.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// -------------------------------------------------------------------
// Retorna la hora actual en formato ISO 8601
// -------------------------------------------------------------------
String getISO8601Time() {
  time_t nowTime;
  time(&nowTime);
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    // Si falla el NTP, caer en TimeLib.h como respaldo
    nowTime = now();
    timeinfo = *localtime(&nowTime);
  }

  char buf[40];
  // Formato: 2025-02-03T09:29:55-05:00
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S-05:00", &timeinfo);
  return String(buf);
}

// -------------------------------------------------------------------
// Retorna la hora actual en formato YYYYMMDDHHMMSS
// -------------------------------------------------------------------
String getTimestampCompact() {
  time_t nowTime;
  time(&nowTime);
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    nowTime = now();
    timeinfo = *localtime(&nowTime);
  }
  char buf[20];
  strftime(buf, sizeof(buf), "%Y%m%d%H%M%S", &timeinfo);
  return String(buf);
}

// -------------------------------------------------------------------
// Encriptación AES-256-CBC con Padding PKCS7
// -------------------------------------------------------------------
String aes_256_cbc_encrypt(String plaintext) {
  log("[ AES ] Texto plano: " + plaintext);
  mbedtls_aes_context aes;

  size_t dlen = 0;
  unsigned char key[32];
  mbedtls_base64_decode(key, 32, &dlen, (const unsigned char *)http_encrypt_key,
                        strlen(http_encrypt_key));

  unsigned char iv[16];
  mbedtls_base64_decode(iv, 16, &dlen, (const unsigned char *)http_encrypt_iv,
                        strlen(http_encrypt_iv));

  int len = plaintext.length();
  int n_blocks = (len / 16) + 1;
  int n_padding = (n_blocks * 16) - len;
  size_t input_len = n_blocks * 16;

  unsigned char *input = (unsigned char *)malloc(input_len);
  memcpy(input, plaintext.c_str(), len);
  for (int i = 0; i < n_padding; i++) {
    input[len + i] = (unsigned char)n_padding;
  }

  unsigned char *output = (unsigned char *)malloc(input_len);

  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_enc(&aes, key, 256);
  mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, input_len, iv, input,
                        output);
  mbedtls_aes_free(&aes);

  String encoded = base64::encode(output, input_len);
  log("[ AES ] Base64 Cipher: " + encoded);

  free(input);
  free(output);
  return encoded;
}

// -------------------------------------------------------------------
// Prueba de Token HTTP
// -------------------------------------------------------------------
String http_get_token() {
  if (WiFi.status() != WL_CONNECTED)
    return "{\"status\": \"WiFi no conectado\", \"code\": 0}";

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = "https://" + String(http_server);
  if (http_port != 443 && http_port != 80) {
    url += ":" + String(http_port);
  }
  url += String(http_path) + String(http_auth_path);

  log("[ HTTP ] Obteniendo Token: " + url);

  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    String body =
        "name=" + String(http_user_name) + "&key=" + String(http_password);

    log("[ HTTP ] Body: " + body);

    int httpMsgCode = http.POST(body);
    String response = "";

    if (httpMsgCode > 0) {
      response = http.getString();
      log("[ HTTP ] Token Response (" + String(httpMsgCode) + "): " + response);

      if (httpMsgCode == 200) {
        if (response.startsWith("\"") && response.endsWith("\"")) {
          http_token = response.substring(1, response.length() - 1);
        } else if (!response.startsWith("{")) {
          http_token = response;
        } else {
          int tokenIndex = response.indexOf("\"access_token\":\"");
          if (tokenIndex == -1)
            tokenIndex = response.indexOf("\"accessToken\":\"");
          if (tokenIndex == -1)
            tokenIndex = response.indexOf("\"token\":\"");

          if (tokenIndex != -1) {
            int start = response.indexOf(":", tokenIndex) + 2;
            int end = response.indexOf("\"", start);
            http_token = response.substring(start, end);
          }
        }
        log("[ HTTP ] Token guardado correctamente.");
      }
    } else {
      log("[ HTTP ] Error Auth: " + http.errorToString(httpMsgCode));
    }
    http.end();

    String result = "{";
    result += "\"status\": \"Token request\",";
    result += "\"code\": " + String(httpMsgCode) + ",";
    result +=
        "\"response\": " + (response.length() > 0 && response.startsWith("{")
                                ? response
                                : "\"" + response + "\"");
    result += "}";
    return result;
  }
  return "{\"status\": \"Error inicio HTTP\", \"code\": -1}";
}

// -------------------------------------------------------------------
// Enviar Datos por HTTP (Genérico)
// -------------------------------------------------------------------
bool http_post_data(String subPath, String payload) {
  if (WiFi.status() != WL_CONNECTED)
    return false;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = "https://" + String(http_server);
  if (http_port != 443 && http_port != 80)
    url += ":" + String(http_port);
  url += String(http_path) + subPath;

  log("[ HTTP ] Enviando a URL: " + url);

  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    if (http_token.length() > 0)
      http.addHeader("Authorization", "Bearer " + http_token);

    int httpResponseCode = http.POST(payload);
    bool success = false;

    if (httpResponseCode > 0) {
      String response = http.getString();
      log("[ HTTP ] Respuesta (" + String(httpResponseCode) + "): " + response);
      if (httpResponseCode >= 200 && httpResponseCode < 300)
        success = true;
      else if (httpResponseCode == 401) {
        http_token = "";
        log("[ HTTP ] Token inválido (401). Se solicitará uno nuevo.");
      }
    } else {
      log("[ HTTP ] Error en POST: " + http.errorToString(httpResponseCode));
    }
    http.end();
    return success;
  }
  return false;
}

// -------------------------------------------------------------------
// Consultar Datos por HTTP (Genérico GET)
// -------------------------------------------------------------------
String http_get_data(String subPath) {
  if (WiFi.status() != WL_CONNECTED)
    return "{\"status\": \"WiFi no conectado\", \"code\": 0}";

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = "https://" + String(http_server);
  if (http_port != 443 && http_port != 80)
    url += ":" + String(http_port);
  url += String(http_path) + subPath;

  log("[ HTTP ] Consultando URL: " + url);

  if (http.begin(client, url)) {
    http.addHeader("Accept", "application/json");
    if (http_token.length() > 0)
      http.addHeader("Authorization", "Bearer " + http_token);

    const char *headerKeys[] = {"Content-Type", "Date", "Content-Length"};
    http.collectHeaders(headerKeys, 3);

    int httpResponseCode = http.GET();
    String response = "";
    String headers = "{";

    if (httpResponseCode > 0) {
      response = http.getString();
      log("[ HTTP ] Respuesta (" + String(httpResponseCode) + "): " + response);
      for (int i = 0; i < http.headers(); i++) {
        headers += "\"" + http.headerName(i) + "\": \"" + http.header(i) + "\"";
        if (i < http.headers() - 1)
          headers += ",";
      }
    } else {
      log("[ HTTP ] Error en GET: " + http.errorToString(httpResponseCode));
    }
    headers += "}";
    http.end();

    String result = "{";
    result += "\"status\": \"Consulta realizada\",";
    result += "\"code\": " + String(httpResponseCode) + ",";
    result += "\"headers\": " + headers + ",";
    result +=
        "\"response\": " + (response.length() > 0 && response.startsWith("{")
                                ? response
                                : "\"" + response + "\"");
    result += "}";
    return result;
  }
  return "{\"status\": \"Error inicio HTTP\", \"code\": -1}";
}

// -------------------------------------------------------------------
// Consultar Índices Históricos (Reporte)
// -------------------------------------------------------------------
String http_get_meter_indices(String cutoffDate = "") {
  // Si no se pasa fecha, usar el mes actual YYYYMM
  if (cutoffDate == "") {
    cutoffDate = getTimestampCompact().substring(0, 6);
  }

  String subPath = String(http_get_index_path);
  subPath += "?meterSerial=" + String(device_config_serial);
  subPath += "&meterCutoffDate=" + cutoffDate;

  log("[ HTTP ] Consultando histórico de medidor: " +
      String(device_config_serial));
  return http_get_data(subPath);
}

// -------------------------------------------------------------------
// Dispatcher para Pruebas Manuales
// -------------------------------------------------------------------
String http_manual_dispatcher(String path, String method,
                              String extraData = "") {
  method.toUpperCase();
  if (method == "GET") {
    if (path.indexOf("GetIndexsByMeter") != -1) {
      return http_get_meter_indices(extraData);
    }
    return http_get_data(path);
  } else {
    if (path == String(http_auth_path))
      return http_get_token();

    String payload = "";
    if (path == String(http_register_path)) {
      // Formato Registro: Cifrar JSON minimalista sin espacios
      String rawData =
          "{\"meterSerial\":\"" + String(device_config_serial) + "\"}";
      String base64Data = aes_256_cbc_encrypt(rawData);

      payload = "{";
      payload += "\"timestamp\":\"" + getISO8601Time() + "\",";
      payload += "\"showErrorDetails\":true,";
      payload += "\"data\":\"" + base64Data + "\"";
      payload += "}";
    } else if (path == String(http_save_index_path) && extraData != "") {
      // Formato Save Index Manual con valor personalizado
      String rawData = "{";
      rawData += "\"meterSerial\":\"" + deviceID() + "\",";
      rawData += "\"meterIndex\":\"" + extraData + "\",";
      rawData += "\"meterDateTime\":\"" + getTimestampCompact() + "\"";
      rawData += "}";

      String base64Data = aes_256_cbc_encrypt(rawData);

      payload = "{";
      payload += "\"timestamp\":\"" + getISO8601Time() + "\",";
      payload += "\"showErrorDetails\":true,";
      payload += "\"data\":\"" + base64Data + "\"";
      payload += "}";
    } else if (path == String(http_save_index_path) ||
               path == String(http_save_alarm_path) ||
               path == String(http_save_batch_path)) {
      extern String Json();
      String rawData = Json();
      String base64Data = aes_256_cbc_encrypt(rawData);

      payload = "{";
      payload += "\"timestamp\":\"" + getISO8601Time() + "\",";
      payload += "\"showErrorDetails\":true,";
      payload += "\"data\":\"" + base64Data + "\"";
      payload += "}";
    } else {
      extern String Json();
      payload = Json();
    }

    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    String url = "https://" + String(http_server);
    if (http_port != 443 && http_port != 80)
      url += ":" + String(http_port);
    url += String(http_path) + path;

    log("[ HTTP ] Prueba Manual POST: " + url);
    log("[ HTTP ] Payload: " + payload);

    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/json");
      if (http_token.length() > 0)
        http.addHeader("Authorization", "Bearer " + http_token);

      const char *headerKeys[] = {"Content-Type", "Date", "Content-Length",
                                  "X-Powered-By", "Server"};
      http.collectHeaders(headerKeys, 5);

      int httpCode = http.POST(payload);
      String response = "{}";
      String headers = "{";

      if (httpCode > 0) {
        response = http.getString();
        log("[ HTTP ] Respuesta (" + String(httpCode) + "): " + response);
        for (int i = 0; i < http.headers(); i++) {
          headers +=
              "\"" + http.headerName(i) + "\": \"" + http.header(i) + "\"";
          if (i < http.headers() - 1)
            headers += ",";
        }
      } else {
        log("[ HTTP ] Error: " + http.errorToString(httpCode));
      }
      headers += "}";
      http.end();

      String result = "{";
      result += "\"status\": \"Prueba Manual POST (SECURE)\",";
      result += "\"code\": " + String(httpCode) + ",";
      result += "\"headers\": " + headers + ",";
      result +=
          "\"response\": " + (response.length() > 0 && response.startsWith("{")
                                  ? response
                                  : "\"" + response + "\"");
      result += "}";
      return result;
    }
    return "{\"status\": \"Error inicio HTTP\", \"code\": -1}";
  }
}

// -------------------------------------------------------------------
// Enviar Datos Cifrados (Acueducto Wrapper)
// -------------------------------------------------------------------
bool http_post_encrypted(String subPath, String rawJson) {
  String base64Data = aes_256_cbc_encrypt(rawJson);

  String payload = "{";
  payload += "\"timestamp\":\"" + getISO8601Time() + "\",";
  payload += "\"showErrorDetails\":true,";
  payload += "\"data\":\"" + base64Data + "\"";
  payload += "}";

  return http_post_data(subPath, payload);
}

// -------------------------------------------------------------------
// HTTP Setup & Loop
// -------------------------------------------------------------------
void httpLoop() {
  if (http_cloud_enable && http_time_send) {
    if (millis() - http_last_send > http_time_interval) {
      http_last_send = millis();
      log("[ HTTP ] Iniciando ciclo de envío automático...");

      if (http_token.length() == 0) {
        log("[ HTTP ] No hay token. Solicitando uno nuevo...");
        http_get_token();
      }

      if (http_token.length() == 0)
        return;

      // 1. Registro (si no está registrado)
      if (!http_registered) {
        log("[ HTTP ] Registrando medidor...");
        String regJson =
            "{\"meterSerial\":\"" + String(device_config_serial) + "\"}";
        if (http_post_encrypted(String(http_register_path), regJson)) {
          http_registered = true;
          log("[ HTTP ] Medidor registrado con éxito.");
        } else {
          log("[ HTTP ] Falló registro automático.");
          return; // No intentar enviar datos si no estamos registrados
        }
      }

      // 2. Envío de Telemetría (SaveIndex)
      extern String Json();
      String rawData = Json();
      log("[ HTTP ] Enviando telemetría automática...");
      http_post_encrypted(String(http_save_index_path), rawData);

      // Opcional: Alarma y Batch (según necesidad)
      // http_post_encrypted(String(http_save_alarm_path), rawData);
      // http_post_encrypted(String(http_save_batch_path), rawData);

      // 3. Consulta de historial (GetIndex) - Solo para log o debug
      http_get_meter_indices();
    }
  }
}
