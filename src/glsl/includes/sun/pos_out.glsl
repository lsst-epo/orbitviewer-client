#include <fog_vertex>
vPosition = position;

#include <fresnel_vert>

float nX = .005 * snoise(vec3(position.xz, time * .2));
float nY = .005 * snoise(vec3(position.xy, time * .1));
float nZ = .005 * snoise(vec3(position.yz, time * .12));

gl_Position.xyz += vec3(nX, nY, nZ);