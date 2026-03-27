#include <lvgl.h>

/*
 * Dummy Sprite Sheet de 256x64 (4 cuadros de 64x64)
 * Formato: CF_TRUE_COLOR_ALPHA (32 bits: R, G, B, A)
 * En una implementación real, usa lvgl_image_converter.
 */

// Datos de imagen ficticios (píxeles transparentes/vacíos para ejemplo)
static const uint8_t mascot_map[] = {
    0x00,
    0x00,
    0x00,
    0x00, // Primer píxel (ejemplo)
          // ... aquí irían los 256 * 64 * 4 bytes ...
};

const lv_img_dsc_t mascot_sprite_sheet = {
    .header.always_zero = 0,
    .header.w = 256,
    .header.h = 64,
    .data_size = sizeof(mascot_map),
    .header.cf = LV_IMG_CF_TRUE_COLOR_ALPHA,
    .data = mascot_map,
};
