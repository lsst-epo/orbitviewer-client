precision highp float;

varying vec2 vUv;

layout(location = 1) out vec4 alphaMap;
layout(location = 2) out vec4 diffuseMap;

void main () {
    vec2 st = vec2(-1.0) + 2.0 * vUv;

    // circle sdf (stored in alpha)
    float d = 1.0 - distance(st, vec2(0.));

    // spherical normal (stored in rgb)
    float z = sqrt(1.0-st.x*st.x+st.y*st.y);
    vec3 normal = normalize(vec3(st, z));

    // convert to normal map [-1..1] --> [0..1]
    normal += vec3(1.);
    normal /= 2.0;

    float alpha = d;//smoothstep(0., .2, d);

    float glow = d;//smoothstep(0., .85, d);

    gl_FragColor = vec4(normal, alpha);
    alphaMap = vec4(vec3(alpha), 1.0);
    diffuseMap = vec4(glow);
}