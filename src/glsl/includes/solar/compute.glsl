const float E_CONVERGENCE_THRESHOLD = radians(.001);
#define MAX_E_ITERATIONS 100

struct OrbitElements {
    float N;
    float a;
    float e;
    float G;
    float i;
    float H;
    float w;
    float M;
    float n;
    int type;
};

vec3 getCartesianCoordinates(float v, float r, OrbitElements el) {
    float N = radians(el.N);
    float w = radians(el.w);
    float i = radians(el.i);

    float xh = r * ( cos(N) * cos(v+w) - sin(N) * sin(v+w) * cos(i) );
    float yh = r * ( sin(N) * cos(v+w) + cos(N) * sin(v+w) * cos(i) );
    float zh = r * ( sin(v+w) * sin(i) );

    return vec3(xh,zh,-yh);
}

vec3 ellipticalCalc(OrbitElements el, float d) {
    // Mean Anomally and Eccentric Anomally
    float e = el.e;
    float M = radians(el.M + el.n * d);
    float E = M + e * sin(M) * ( 1.0 + e * cos(M) );

    // E convergence check
    if(e >= 0.05) {
        float E0 = E;
        float E1 = E0 - ( E0 - e * sin(E0) - M ) / ( 1. - e * cos(E0) );
        int iterations = 0;
        while(abs(E1-E0) > E_CONVERGENCE_THRESHOLD) {
            iterations++;
            E0 = E1;
            E1 = E0 - ( E0 - e * sin(E0) - M ) / ( 1. - e * cos(E0) );
            if(iterations >= MAX_E_ITERATIONS) break;
        }
        E = E1;
    }

    // Find True Anomally and Distance
    float a = el.a;
    float xv = a * ( cos(E) - e );
    float yv = a * ( sqrt(1.0 - e*e) * sin(E) );

    float v = atan( yv, xv );
    float r = sqrt( xv*xv + yv*yv );

    vec3 xyz = getCartesianCoordinates(v, r, el);

    return xyz;
}