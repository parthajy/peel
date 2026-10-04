#!/usr/bin/env python3
"""Generate Peel icons (an orange with a curling peel) as PNGs with zero dependencies."""
import struct, zlib, math, os

def png(w, h, pixels):
    raw = b''.join(b'\x00' + bytes(pixels[y]) for y in range(h))
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

def blend(dst, src, a):
    return tuple(int(dst[i] * (1 - a) + src[i] * a) for i in range(3))

def render(size):
    cx = cy = size / 2
    R = size * 0.46
    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            d = math.hypot(px - cx, py - cy)
            # anti-aliased disc
            a = max(0.0, min(1.0, R - d + 0.5))
            if a <= 0:
                row += [0, 0, 0, 0]; continue
            # orange with soft radial shading
            t = d / R
            base = blend((255, 140, 40), (230, 90, 20), t * t)
            # a lighter "peel" wedge curling off the top-right
            ang = math.atan2(py - cy, px - cx)
            wedge = -1.25 < ang < -0.35 and d > R * 0.42
            if wedge:
                base = blend(base, (255, 222, 160), 0.85)
                # peel edge line
                if abs(d - R * 0.42) < size * 0.035 or abs(ang + 1.25) < 0.08 or abs(ang + 0.35) < 0.08:
                    base = blend(base, (200, 70, 10), 0.6)
            # tiny leaf at top
            if math.hypot(px - cx, py - (cy - R * 0.92)) < size * 0.07:
                base = (70, 160, 80)
            row += [*base, int(255 * a)]
        rows.append(row)
    return png(size, size, rows)

out = os.path.join(os.path.dirname(__file__), '..', 'icons')
os.makedirs(out, exist_ok=True)
for s in (16, 48, 128):
    with open(os.path.join(out, f'peel{s}.png'), 'wb') as f:
        f.write(render(s))
print('icons written')
