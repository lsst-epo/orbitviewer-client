#include <clipping_planes_pars_vertex>
#include <solar_compute>

attribute float weight;
out float vWeight;

attribute float selected;
out float vSelected;

attribute float dt;
uniform float d;
uniform OrbitElements el;