precision highp float;

const vec3 color1 = vec3(1.0, .1, .05);
const vec3 color2 = vec3(0.89, 0.65, 0);
uniform float time;
uniform float highlighted;
#include <noise4D>
#include <fbm4D>
#include <fresnel_pars_frag>

uniform float glowStrength;

in vec3 vPosition;

layout (location = 1) out vec4 gGlow;

void main () {
    /* vec2 st = gl_PointCoord.xy * 2.0 - vec2(1.);
    float d = 1.0 - distance(st, vec2(0.)); */
    #include <fresnel_frag>
    // fresnelTerm = smoothstep(.5, 1.0, fresnelTerm);
    float fP = mix(60.0, 500.0, highlighted);
    float f = fbm(vec4(vPosition * fP, time * .8), 5);
    f = smoothstep(-1., 1., f);
    float vP = mix(1.25, 10.25, highlighted);
    float mask = snoise(vec4(vPosition * vP, time * .1));
    f *= smoothstep(-.25, 1., mask);
    float alpha = fresnelTerm*f;
    if(alpha < .01) discard;
    vec3 col = mix(color1, color2, mask) * 6.8;// * (1.0-fresnelTerm);
    // col *= fresnelTerm;

    // col *= (1.0 - smoothstep(.96, 1.0, fresnelTerm));
    gGlow = glowStrength * vec4(col*(1.0-fresnelTerm), alpha);//vec4(color*f, f);
    gl_FragColor = vec4(col*fresnelTerm, alpha*.15);
}