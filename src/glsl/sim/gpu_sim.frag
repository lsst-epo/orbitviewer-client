precision highp float;
#include <solar_compute>

uniform float d;

flat in OrbitElements els;
in float isActive;

void main() {
    if(isActive == 0.0) discard;

    vec3 pos = ellipticalCalc(els, d);

    gl_FragColor = vec4(pos, 1.0);
    // gl_FragColor = vec4(vec3(1.0), 1.0);
}