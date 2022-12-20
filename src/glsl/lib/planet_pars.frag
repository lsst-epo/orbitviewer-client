#include <clipping_planes_pars_fragment>
#include <fresnel_pars_frag>

uniform float selected;

layout(location = 1) out vec4 gGlow;

#ifdef EARTH
uniform sampler2D nightMap;
uniform sampler2D cloudsMap;
uniform float time;
#endif