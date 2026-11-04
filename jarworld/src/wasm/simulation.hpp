#pragma once
#include <cstdint>
extern "C" {
void jw_init(int width, int height);
void jw_reset();
void jw_step(float dt);
void jw_paint(int x, int y, int material, int radius);
std::uint8_t* jw_world();
int jw_width();
int jw_height();
int jw_active_count();
}