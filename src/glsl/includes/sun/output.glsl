#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif

float m = snoise(vec4(vPosition, time * .1));
m = smoothstep(-1., 1., m);
float r = m * fbm(vec4(vPosition * 10.0, time * .5), 3);
// float r = snoise(vec4(vPosition, time));

r = smoothstep(-1., 1., r);

vec3 col = outgoingLight * r;

#include <fresnel_frag>

gl_FragColor = vec4(col, diffuseColor.a );
gGlow = vec4(col*fresnelTerm*4.0, fresnelTerm);