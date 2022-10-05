varying vec2 vUv;

uniform sampler2D tDepth;
uniform sampler2D tDiffuse;
uniform sampler2D tBlur;

uniform float focalDistance;
uniform float aperture;

uniform float cameraNear;
uniform float cameraFar;
uniform float power;

#include <depth>

void main () {
    vec4 noBlur = texture2D(tDiffuse, vUv);
    vec4 blur = texture2D(tBlur, vUv);
    // float depth = texture2D(tDepth, vUv).x;

    float depth = readDepth(tDepth, vUv, cameraNear, cameraFar);

    float distanceToCamera = depth;

    float CoC = distance(distanceToCamera, focalDistance);
    float st = smoothstep(0.0, aperture, CoC);

    vec3 color = mix(noBlur.rgb, blur.rgb, power*st);

    gl_FragColor = vec4(color, max(noBlur.a, blur.a));
}