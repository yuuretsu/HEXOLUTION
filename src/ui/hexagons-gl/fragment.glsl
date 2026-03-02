precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform vec2 uWorldSize;
uniform vec2 uOffset;
uniform float uScale;
uniform bool uWrap;

vec3 cube_round(vec3 frac) {
  float rx = floor(frac.x + 0.5);
  float ry = floor(frac.y + 0.5);
  float rz = floor(frac.z + 0.5);
  float dx = abs(rx - frac.x);
  float dy = abs(ry - frac.y);
  float dz = abs(rz - frac.z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return vec3(rx, ry, rz);
}

vec2 get_hex_coords(vec2 pixelPos) {
  float size = uScale / 1.7320508;
  float q = (1.7320508 / 3.0 * pixelPos.x - 1.0 / 3.0 * pixelPos.y) / size;
  float r = (2.0 / 3.0 * pixelPos.y) / size;
  
  vec3 cube = vec3(q, -q - r, r);
  vec3 rounded = cube_round(cube);
  
  float col = rounded.x + (rounded.z - mod(abs(rounded.z), 2.0)) / 2.0;
  float row = rounded.z;

  float finalCol;
  float finalRow;

  if (uWrap) {
    finalCol = mod(mod(col, uWorldSize.x) + uWorldSize.x, uWorldSize.x);
    finalRow = mod(mod(row, uWorldSize.y) + uWorldSize.y, uWorldSize.y);
  } else {
    if (col < 0.0 || col >= uWorldSize.x || row < 0.0 || row >= uWorldSize.y) {
      return vec2(-1.0);
    }
    finalCol = col;
    finalRow = row;
  }
  return (vec2(finalCol, finalRow) + 0.5) / uWorldSize;
}

void main() {
  if (uWorldSize.x <= 0.0 || uWorldSize.y <= 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  vec2 pixelPos = vUv * uResolution - uOffset;
  vec2 coords = get_hex_coords(pixelPos);

  if (coords.x == -1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    gl_FragColor = texture2D(uScene, coords);
  }
}