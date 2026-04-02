#ifndef LV_MASCOT_HPP
#define LV_MASCOT_HPP

#include <Arduino.h>
#include <SPIFFS.h>
#include <lvgl.h>
#include <stdlib.h>

extern const lv_img_dsc_t mascot_sprite_sheet;

// -------------------------------------------------------------------
// Flag externo del servidor para detectar nueva imagen
// (definido en iot32_server.hpp)
// -------------------------------------------------------------------
extern volatile bool badge_updated;

struct lv_mascot_t {
  lv_obj_t *img;
  uint16_t frame_width;
  uint16_t frame_height;
  uint8_t total_frames;
  uint8_t current_frame;
  uint16_t anim_speed;
};

static void mascot_anim_cb(void *var, int32_t v) {
  lv_mascot_t *mascot = (lv_mascot_t *)var;
  mascot->current_frame = v;
  lv_img_set_offset_x(mascot->img, -(v * mascot->frame_width));
}

static lv_mascot_t *lv_mascot_create(lv_obj_t *parent, const lv_img_dsc_t *src,
                                     uint16_t w, uint16_t h, uint8_t frames) {
  lv_mascot_t *mascot = (lv_mascot_t *)malloc(sizeof(lv_mascot_t));
  mascot->img = lv_img_create(parent);
  lv_img_set_src(mascot->img, src);
  lv_obj_set_size(mascot->img, w, h);
  lv_obj_center(mascot->img);

  mascot->frame_width = w;
  mascot->frame_height = h;
  mascot->total_frames = frames;
  mascot->current_frame = 0;
  mascot->anim_speed = 100;

  static lv_anim_t a;
  lv_anim_init(&a);
  lv_anim_set_var(&a, mascot);
  lv_anim_set_values(&a, 0, frames - 1);
  lv_anim_set_time(&a, frames * mascot->anim_speed);
  lv_anim_set_exec_cb(&a, mascot_anim_cb);
  lv_anim_set_path_cb(&a, lv_anim_path_linear);
  lv_anim_set_repeat_count(&a, LV_ANIM_REPEAT_INFINITE);
  lv_anim_start(&a);

  return mascot;
}

/* Muestra el avatar desde SPIFFS (primera carga) */
static lv_obj_t *lv_avatar_create(lv_obj_t *parent) {
  if (SPIFFS.exists("/avatar.bin")) {
    lv_obj_t *img = lv_img_create(parent);
    // "S:" es el prefijo del driver de SPIFFS configurado en platformio.ini
    lv_img_set_src(img, "S:/avatar.bin");
    lv_obj_center(img);
    return img;
  }
  return NULL;
}

// -------------------------------------------------------------------
// SMART BADGE: Puntero estático al widget de badge en pantalla
// Se inicializa en lv_badge_init() y se actualiza en lv_badge_refresh()
// -------------------------------------------------------------------
static lv_obj_t *s_badge_img = NULL;

/**
 * @brief Inicializa el widget de badge en la pantalla.
 *        Llamar UNA VEZ desde setup() o desde la lógica de UI principal.
 *        Si existe /badge.bin en SPIFFS lo muestra inmediatamente.
 *
 * @param parent  Objeto padre LVGL (normalmente lv_scr_act())
 * @return lv_obj_t*  El objeto imagen creado (o NULL si no hay badge aún)
 */
static lv_obj_t *lv_badge_init(lv_obj_t *parent) {
  s_badge_img = lv_img_create(parent);
  lv_obj_center(s_badge_img);

  if (SPIFFS.exists("/badge.bin")) {
    lv_img_set_src(s_badge_img, "S:/badge.bin");
    lv_obj_clear_flag(s_badge_img, LV_OBJ_FLAG_HIDDEN);
  } else {
    lv_obj_add_flag(s_badge_img, LV_OBJ_FLAG_HIDDEN);
  }
  return s_badge_img;
}

/**
 * @brief Verifica la flag badge_updated y recarga la imagen en LVGL si es
 *        necesario. Debe llamarse periódicamente desde loop() o desde un
 *        timer LVGL para no bloquear el loop principal.
 *
 *        Ejemplo de uso en loop():
 *          if (badge_updated) lv_badge_refresh();
 *
 * @note  Invalida el área del objeto para que LVGL lo redibuje en el
 *        siguiente ciclo de renderizado sin bloquear otras tareas.
 */
static void lv_badge_refresh() {
  if (!badge_updated)
    return;
  badge_updated = false; // Reset flag primero para evitar doble lectura

  if (!s_badge_img)
    return; // Widget no inicializado

  if (SPIFFS.exists("/badge.bin")) {
    // Limpiar la fuente actual para forzar recarga desde SPIFFS
    lv_img_set_src(s_badge_img, "S:/badge.bin");
    lv_obj_clear_flag(s_badge_img, LV_OBJ_FLAG_HIDDEN);
    lv_obj_invalidate(s_badge_img); // Fuerza redibujado
    Serial.println("[ BADGE ] Imagen refrescada en pantalla");
  }
}

#endif // LV_MASCOT_HPP
