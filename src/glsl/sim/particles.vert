precision highp float;

uniform sampler2D computedPosition;
attribute vec2 simUV;

out float alive;
out vec3 vColor;

void main () {
    vec4 cP = texture(computedPosition, simUV);
    alive = cP.a;

    vColor = color;

    vec3 pos = cP.rgb;

    gl_PointSize = 10.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}