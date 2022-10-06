#include <fog_vertex>
vPosition = position;

#include <fresnel_vert>

float nX = vertexAmp * snoise(vec3(position.xz * 10.0, time * .2));
float nY = vertexAmp * snoise(vec3(position.xy * 10.0, time * .1));
float nZ = vertexAmp * snoise(vec3(position.yz * 10.0, time * .12));

gl_Position.xyz += vec3(nX, nY, nZ);