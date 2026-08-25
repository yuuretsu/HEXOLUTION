#[inline]
pub fn lerp_f32(a: f32, b: f32, t: f32) -> f32 {
    a * (1.0 - t) + b * t
}

#[inline]
pub fn lerp_rgba(a: &mut [f32; 4], b: &[f32; 4], t: f32) {
    a[0] = lerp_f32(a[0], b[0], t);
    a[1] = lerp_f32(a[1], b[1], t);
    a[2] = lerp_f32(a[2], b[2], t);
}

/// Matches the JS `createRandom` seeded by a string.
pub fn create_random_state(hash: &str) -> u32 {
    let mut state: u32 = 2166136261;
    for b in hash.bytes() {
        state ^= b as u32;
        state = state.wrapping_mul(16777619);
    }
    state
}

/// Matches the mulberry32-style PRNG inside JS `createRandom`.
pub fn next_random(state: &mut u32) -> f64 {
    *state = state.wrapping_add(0x6d2b79f5);
    let mut t = *state;
    t = (t ^ (t >> 15)).wrapping_mul(t | 1);
    t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61));
    ((t ^ (t >> 14)) as u64 as f64) / 4294967296.0
}

pub fn hsla_to_rgba(h: f64, s: f64, l: f64, a: f64) -> [u8; 4] {
    let h = h / 360.0;
    let s = s / 100.0;
    let l = l / 100.0;

    let (r, g, b) = if s == 0.0 {
        (l, l, l)
    } else {
        let hue2rgb = |p: f64, q: f64, mut t: f64| {
            if t < 0.0 {
                t += 1.0;
            }
            if t > 1.0 {
                t -= 1.0;
            }
            if t < 1.0 / 6.0 {
                p + (q - p) * 6.0 * t
            } else if t < 0.5 {
                q
            } else if t < 2.0 / 3.0 {
                p + (q - p) * (2.0 / 3.0 - t) * 6.0
            } else {
                p
            }
        };
        let q = if l < 0.5 {
            l * (1.0 + s)
        } else {
            l + s - l * s
        };
        let p = 2.0 * l - q;
        (
            hue2rgb(p, q, h + 1.0 / 3.0),
            hue2rgb(p, q, h),
            hue2rgb(p, q, h - 1.0 / 3.0),
        )
    };

    [
        (r * 255.0).round() as u8,
        (g * 255.0).round() as u8,
        (b * 255.0).round() as u8,
        (a * 255.0).round() as u8,
    ]
}

/// JS `ToInt32` — used so out-of-range channel values wrap exactly like `color[i] << n`.
#[inline]
fn js_to_int32(v: f64) -> i32 {
    if !v.is_finite() {
        return 0;
    }
    let m = v.trunc().rem_euclid(4294967296.0);
    if m >= 2147483648.0 {
        (m - 4294967296.0) as i32
    } else {
        m as i32
    }
}

/// Matches the JS pixel write `(255 << 24) | (b << 16) | (g << 8) | r`,
/// including bit-level wrapping for channels outside 0..255.
pub fn pack_rgba_u32(color: &[f32; 4]) -> u32 {
    let r = js_to_int32(color[0] as f64) as u32;
    let g = js_to_int32(color[1] as f64) as u32;
    let b = js_to_int32(color[2] as f64) as u32;
    0xFF00_0000u32 | b.wrapping_shl(16) | g.wrapping_shl(8) | r
}

pub fn pack_rgba_u8(color: &[u8; 4]) -> u32 {
    let r = color[0] as u32;
    let g = color[1] as u32;
    let b = color[2] as u32;
    0xFF00_0000u32 | (b << 16) | (g << 8) | r
}
