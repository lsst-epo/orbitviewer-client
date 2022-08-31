// Source: https://jsfiddle.net/8n36c47p/4/

vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
float fresnelTerm = 1.0 - dot(vNormalW, viewDirectionW);
// fresnelTerm = clamp(fresnelTerm, 0., 1.);
fresnelTerm = smoothstep(1.-fresnelWidth, 1., fresnelTerm);
vec3 fresCol = vec3( fresnelColor * fresnelTerm) * .5;