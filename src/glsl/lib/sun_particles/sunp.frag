precision highp float;

const vec3 color1 = vec3(1.0, .1, .05);
const vec3 color2 = vec3(0.89, 0.65, 0);
uniform float time;
#include <noise4D>
#include <fbm4D>
#include <fresnel_pars_frag>

in vec3 vPosition;

layout (location = 1) out vec4 gGlow;

void main () {
    /* vec2 st = gl_PointCoord.xy * 2.0 - vec2(1.);
    float d = 1.0 - distance(st, vec2(0.)); */
    #include <fresnel_frag>
    fresnelTerm = smoothstep(.5, 1.0, fresnelTerm);
    float f = fbm(vec4(vPosition * 120.0, time * .8), 5);
    f = smoothstep(-1., 1., f);
    float mask = snoise(vec4(vPosition * 1.25, time * .1));
    f *= smoothstep(-1., 1., mask);
    float alpha = fresnelTerm*f;
    if(alpha < .1) discard;
    vec3 col = mix(color1, color2, mask) * 1.8;// * (1.0-fresnelTerm);
    gGlow = vec4(col*fresnelTerm, alpha);//vec4(color*f, f);
    gl_FragColor = vec4(col*fresnelTerm, alpha*.25);
}