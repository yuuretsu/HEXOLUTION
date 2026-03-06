precision highp float;

varying vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform vec2 uWorldSize;
uniform vec2 uOffset;
uniform float uScale;
uniform bool uWrap;

const float SQRT3 = 1.7320508;
const float INV_SQRT3 = 0.57735027;

void main() {
    vec2 pixelPos = vUv * uResolution - uOffset;
    float hexSize = uScale * INV_SQRT3;

    float q = (SQRT3 / 3.0 * pixelPos.x - 1.0 / 3.0 * pixelPos.y) / hexSize;
    float r = (2.0 / 3.0 * pixelPos.y) / hexSize;

    vec3 cubePos = vec3(q, -q - r, r);
    vec3 cubeRounded = floor(cubePos + 0.5);
    vec3 cubeDiff = abs(cubeRounded - cubePos);

    if (cubeDiff.x > cubeDiff.y && cubeDiff.x > cubeDiff.z) {
        cubeRounded.x = -cubeRounded.y - cubeRounded.z;
    } else if (cubeDiff.y > cubeDiff.z) {
        cubeRounded.y = -cubeRounded.x - cubeRounded.z;
    } else {
        cubeRounded.z = -cubeRounded.x - cubeRounded.y;
    }

    float centerX = hexSize * (SQRT3 * cubeRounded.x + SQRT3/2.0 * cubeRounded.z);
    float centerY = hexSize * (3.0/2.0 * cubeRounded.z);
    vec2 centerPos = vec2(centerX, centerY);

    float dist = distance(pixelPos, centerPos);
    float circleRadius = hexSize * (SQRT3 * 0.5);
    float circleMask = smoothstep(circleRadius, circleRadius - 1.5, dist);

    float col = cubeRounded.x + (cubeRounded.z - mod(abs(cubeRounded.z), 2.0)) * 0.5;
    float row = cubeRounded.z;

    bool isOutOfBounds = col < 0.0 || col >= uWorldSize.x || row < 0.0 || row >= uWorldSize.y;

    if (!uWrap && isOutOfBounds) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec2 gridIndex = vec2(col, row);
    vec2 wrappedIndex = mod(mod(gridIndex, uWorldSize) + uWorldSize, uWorldSize);
    vec2 targetTexCoord = (wrappedIndex + 0.5) / uWorldSize;

    vec4 texColor = texture2D(uScene, targetTexCoord);

    float brightness = mix(0.9, 1.0, circleMask);

    gl_FragColor = vec4(texColor.rgb * brightness, texColor.a);
}
