vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	// mvPosition = instanceMatrix * mvPosition;
    vec4 cP = texture(computedPosition, simUV);
    float scl = cP.a;
    float sP = smoothstep(0., 200., length(cP.rgb));
    // scl *= mix(.00012, .5, sP);
    scl = 1.0;

    mvPosition.xyz += cP.xyz;

    /* mat4 computedMatrix = mat4(
        scl, 0.0, 0.0, cP.r,
        0.0, scl, 0.0, cP.g,
        0.0, 0.0, scl, cP.b,
        0.0, 0.0, 0.0, 1.0
    );
    mvPosition = computedMatrix * mvPosition; */
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;