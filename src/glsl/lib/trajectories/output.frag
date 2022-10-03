#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif

// float w = smoothstep(-1., 1., sin(vWeight*PI*2.0-time));
float w = vWeight;

outgoingLight = mix(outgoingLight * w, vec3(.9), selected);
float alpha = mix(w * globalOpacity, 1.0, selected);

float d = distance(bodyPos, pos);

alpha *= smoothstep(dRadius*2.0, 8.0*dRadius, d);

// if(alpha < .1) discard;

pc_fragColor = vec4( outgoingLight, alpha * diffuseColor.a );

#ifdef EMISSIVE
#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	totalEmissiveRadiance *= vColor;
#endif
gGlow = vec4(totalEmissiveRadiance, alpha);
#else
gGlow = vec4(0.0);
#endif