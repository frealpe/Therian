/**
 * @file lv_conf.h
 * Configuration file for v8.3.11
 */

#ifndef LV_CONF_H
#define LV_CONF_H

#include <stdint.h>

/*====================
   COLOR SETTINGS
 *====================*/
#define LV_COLOR_DEPTH 16
#define LV_COLOR_16_SWAP 0

/*=========================
   MEMORY SETTINGS
 *=========================*/
#define LV_MEM_CUSTOM 0
#if LV_MEM_CUSTOM == 0
#define LV_MEM_SIZE (48U * 1024U)
#define LV_MEM_ADR 0
#else
#define LV_MEM_CUSTOM_INCLUDE <stdlib.h>
#define LV_MEM_CUSTOM_ALLOC malloc
#define LV_MEM_CUSTOM_FREE free
#define LV_MEM_CUSTOM_REALLOC realloc
#endif

/*=========================
   HAL SETTINGS
 *=========================*/
#define LV_TICK_CUSTOM 1
#if LV_TICK_CUSTOM
#define LV_TICK_CUSTOM_INCLUDE "Arduino.h"
#define LV_TICK_CUSTOM_SYS_TIME_EXPR (millis())
#endif

/*=========================
   RENDERER SETTINGS
 *=========================*/
#define LV_DPI_DEF 130

/*=========================
   DEBUG SETTINGS
 *=========================*/
#define LV_USE_ASSERT_NULL 1
#define LV_USE_ASSERT_MEM 1
#define LV_USE_ASSERT_STR 1
#define LV_USE_ASSERT_OBJ 1
#define LV_USE_ASSERT_STYLE 1

/*=========================
   THEME USAGE
 *=========================*/
#define LV_USE_THEME_DEFAULT 1
#define LV_THEME_DEFAULT_DARK 1

/*=========================
   FONT USAGE
 *=========================*/
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_20 1
#define LV_FONT_DEFAULT &lv_font_montserrat_14

/*=========================
   WIDGETS
 *=========================*/
#define LV_USE_IMG 1
#define LV_USE_ANIMIMG 1

#endif /*LV_CONF_H*/
