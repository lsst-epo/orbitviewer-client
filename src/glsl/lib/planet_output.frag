#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
gGlow = vec4(0.);//vec4(fresCol * 2.0 * fresnelTerm, fresnelTerm);
#ifdef EARTH
    float gN = length(nightColor);
    gN = smoothstep(1.0, 1.1, gN);
    gGlow = nightColor * (1.0-eIntensity) * 1.5 * gN;
#endif