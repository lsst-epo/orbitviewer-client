precision highp float;

varying vec2 vUv;
uniform sampler2D tBackground;
uniform sampler2D tScene;
uniform sampler2D tGlow;
uniform float glowStrength;

void main () {
    vec4 bg = texture2D(tBackground, vUv);
    vec4 scene = texture2D(tScene, vUv);
    vec4 glow = texture2D(tGlow, vUv);

    float alpha = step(.01, (scene.r+scene.g+scene.b) / 3.0);

    vec3 color = mix(bg.rgb, scene.rgb, alpha);
    color += glow.rgb * glowStrength * glow.a;

    gl_FragColor = vec4(color, 1.0);
}