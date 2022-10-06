#include <fresnel_frag>

vec3 sunCol = vec3(1., .6, 0.) * fresnelTerm;
vec3 L = normalize(vec3(0., 0.0001, 0.0) - vPositionW);
vec3 e = normalize(cameraPosition);
float intensity = max(dot(vNormalW,L), 0.0);
// if (intensity > 0.0) {
    vec3 h = normalize(L + e);
    float intSpec = max(dot(h,vNormalW), 0.0);
    float spec = 100.0 * sunIntensity * pow(intSpec, 1.0);
    fresCol = mix(fresCol, sunCol * fresnelTerm, spec);
// }

#ifdef FRESNEL_SELECTED
fresCol = mix(fresCol, vec3(1.) * fresnelTerm, selected);
#endif

outgoingLight = mix(outgoingLight, outgoingLight + fresCol, fresnelTerm);

#include <envmap_fragment>