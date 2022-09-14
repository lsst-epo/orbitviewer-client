#include <clipping_planes_pars_fragment>

uniform float time;
in float vWeight;
in float vSelected;

layout(location = 1) out vec4 gGlow;