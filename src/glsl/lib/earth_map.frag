#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		// inline sRGB decode (TODO: Remove this code when https://crbug.com/1256340 is solved)
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif

    #ifdef EARTH
        vec4 nightColor = texture2D( nightMap, vUv );
        vec2 cUV = vUv;
        cUV.x = mod(cUV.x + time *.01, 1.0);
        // cUV.y = mod(cUV.y + time *.001, 1.0);
        vec4 cloudsColor = texture2D( cloudsMap, cUV );
        vec3 eL = normalize(vec3(0., 0.0001, 0.0) - vPositionW);
        // vec3 ee = normalize(cameraPosition);
        float eIntensity = max(dot(vNormalW,eL), 0.0);
        sampledDiffuseColor = 2.5 * mix(nightColor, sampledDiffuseColor, eIntensity);
        sampledDiffuseColor += cloudsColor * .13;
    #endif

	diffuseColor *= sampledDiffuseColor;
#endif