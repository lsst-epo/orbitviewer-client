#include <clipping_planes_pars_fragment>
#include <noise4D>
#include <fbm4D>
#include <fresnel_pars_frag>

in vec3 vPosition;

uniform float time;
uniform float glowStrength;

layout (location = 1) out vec4 gGlow;