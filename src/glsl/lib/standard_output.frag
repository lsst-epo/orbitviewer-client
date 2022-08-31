#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif

pc_fragColor = vec4( outgoingLight, diffuseColor.a );

#ifdef EMISSIVE
#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	totalEmissiveRadiance *= vColor;
#endif
gGlow = vec4(totalEmissiveRadiance, 1.0);
#else
gGlow = vec4(0.0);
#endif