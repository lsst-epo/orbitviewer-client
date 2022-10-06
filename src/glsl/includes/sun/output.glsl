#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif

float m = snoise(vec4(vPosition * .5, time * .02)) * 5.0;
// m = smoothstep(-1., 1., m);
float r = fbm(vec4(vPosition * 20.0 + vec3(m), time * .5), 3);
// float r = snoise(vec4(vPosition, time));

r = smoothstep(-.5, .5, r);

vec3 col = mix(outgoingLight*.5, outgoingLight, r);

#include <fresnel_frag>

gl_FragColor = vec4(col, diffuseColor.a );
gGlow = vec4(col*fresnelTerm*glowStrength, glowStrength*fresnelTerm);