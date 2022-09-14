precision highp float;

varying vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tGlow;

void main () {
    vec4 scene = texture2D(tScene, vUv);
    vec4 glow = texture2D(tGlow, vUv);
    gl_FragColor = scene + vec4(glow.rgb * 1.5 * glow.a, glow.a);
}