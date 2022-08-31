precision highp float;

varying vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tGlow;

void main () {
    vec4 scene = texture2D(tScene, vUv);
    gl_FragColor = scene + vec4(texture2D(tGlow, vUv).rgb, 1.0);
}