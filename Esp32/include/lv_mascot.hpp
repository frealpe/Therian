#ifndef LV_MASCOT_HPP
#define LV_MASCOT_HPP

#include <Arduino.h>
#include <lvgl.h>
#include <stdlib.h>

/*
 * Este es un ejemplo de cómo declarar el Sprite Sheet.
 * En una implementación real, convertirías un PNG a un C-Array
 * usando el convertidor online de LVGL (True Color with Alpha).
 */

// Dummy Sprite Sheet (ejemplo de 4 cuadros de 64x64 cada uno, total 256x64)
// En la práctica, usa el código generado por LVGL Image Converter.
extern const lv_img_dsc_t mascot_sprite_sheet;

/* Estructura para el control de la mascota */
struct lv_mascot_t {
  lv_obj_t *img;
  uint16_t frame_width;
  uint16_t frame_height;
  uint8_t total_frames;
  uint8_t current_frame;
  uint16_t anim_speed; // ms por cuadro
};

/* Función de animación que será llamada por lv_anim */
static void mascot_anim_cb(void *var, int32_t v) {
  lv_mascot_t *mascot = (lv_mascot_t *)var;
  mascot->current_frame = v;

  /* Calculamos el offset en X para mostrar el cuadro actual */
  /* Nota: LVGL v8 usa lv_img_set_offset_x */
  lv_img_set_offset_x(mascot->img, -(v * mascot->frame_width));
}

/* Inicializa la mascota en la pantalla circular */
static lv_mascot_t *lv_mascot_create(lv_obj_t *parent, const lv_img_dsc_t *src,
                                     uint16_t w, uint16_t h, uint8_t frames) {
  lv_mascot_t *mascot = (lv_mascot_t *)malloc(sizeof(lv_mascot_t));
  mascot->img = lv_img_create(parent);
  lv_img_set_src(mascot->img, src);

  /* Configuramos el tamaño de visualización (un solo cuadro) */
  lv_obj_set_size(mascot->img, w, h);

  /* Centramos la mascota en el GC9A01 (240x240) */
  lv_obj_center(mascot->img);

  mascot->frame_width = w;
  mascot->frame_height = h;
  mascot->total_frames = frames;
  mascot->current_frame = 0;
  mascot->anim_speed = 100;

  /* Configuramos la animación de LVGL */
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

#endif // LV_MASCOT_HPP
