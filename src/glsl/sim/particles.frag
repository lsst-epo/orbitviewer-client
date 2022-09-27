precision highp float;

in float alive;
// in float depth;
// uniform sampler2D map;
// uniform sampler2D normalMap;
// uniform sampler2D alphaMap;
in vec3 vColor;

layout(location = 1) out vec4 gGlow;

void main () {
    if(alive < 1.0) discard;

    vec2 uv = gl_PointCoord.xy;
    vec2 st = vec2(-1.0) + 2.0 * uv;
    float d = 1.0 - distance(vec2(0.), st);

    // d = (1.0-depth) * smoothstep(0.25, 1.0, d);

    d = smoothstep(0.25, 1.0, d);

    /* vec4 map = texture(map, uv);
    float alpha = texture(alphaMap, uv).r; */

    if(d < .01) discard;

    vec3 color = vColor;

    gl_FragColor = vec4(color, d);
    gGlow = vec4(color * .5, d);
}