precision highp float;

varying vec2 vUv;
uniform sampler2D tBackground;
uniform sampler2D tScene;
uniform sampler2D tGlow;
uniform float glowStrength;
uniform float vignette;

void main () {
    vec4 bg = texture2D(tBackground, vUv);
    vec4 scene = texture2D(tScene, vUv);
    vec4 glow = texture2D(tGlow, vUv);

    float alpha = step(.0001, (scene.r+scene.g+scene.b) / 3.0);

    vec3 color = mix(bg.rgb, scene.rgb, alpha);
    color += glow.rgb * glowStrength * glow.a;

    // vignette
    vec2 uv = vUv;
    uv *=  1.0 - uv.yx;   //vec2(1.0)- uv.yx; -> 1.-u.yx; Thanks FabriceNeyret !
    float vig = uv.x*uv.y * 15.0; // multiply with sth for intensity
    vig = pow(vig, mix(0.25, 0.95, vignette));

    gl_FragColor = vec4(color * vig, 1.0);
}