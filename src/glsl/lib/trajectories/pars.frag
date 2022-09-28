#include <clipping_planes_pars_fragment>

uniform float time;
in float vWeight;
uniform float selected;
in vec3 pos;
uniform vec3 bodyPos;
uniform float dRadius;

layout(location = 1) out vec4 gGlow;