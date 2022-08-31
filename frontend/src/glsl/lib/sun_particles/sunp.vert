precision highp float;

uniform float time;
uniform float amp;

out vec3 vPosition;

#include <noise3D>
#include <fresnel_pars_vert>

void main () {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);

    vPosition = position;
    #include <fresnel_vert>

    /* float d = smoothstep(0.0, 100.0, -mvPos.z);

    gl_PointSize = 50.0;//mix(20.0, 30.0, 1.0-d); */

    gl_Position = projectionMatrix * mvPos;

    float x = amp * snoise(vec3(position.xy * 200.0, time * .1));
    float y = amp * snoise(vec3(position.zy * 50.0, time * .13));
    float z = amp * snoise(vec3(position.xz * 800.0, time * .12));

    gl_Position.xyz += vec3(x,y,z);
}