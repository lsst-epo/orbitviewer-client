precision highp float;

uniform sampler2D computedPosition;
attribute vec2 simUV;

out float alive;
out vec3 vColor;
// out float depth;

void main () {
    vec4 cP = texture(computedPosition, simUV);
    alive = cP.a;

    vColor = color;

    vec3 pos = cP.rgb;

    /* depth = smoothstep(
        1.0,
        100.0,
        length(cameraPosition-pos)
    ); */

    gl_PointSize = 8.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}