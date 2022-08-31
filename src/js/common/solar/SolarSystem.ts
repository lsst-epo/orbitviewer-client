import { Vector3 } from "three";
import { OrbitDataElements } from "./SolarUtils";

export const DEG_TO_RAD = Math.PI / 180;
export const E_CONVERGE_MAX_ITERATIONS = 10;
export const E_CONVERGENCE_THRESHOLD = .001 * Math.PI / 180;

export const K = 0.01720209895;

export type OrbitElements = {
    id:string;
    N:number;
    a:number;
    e:number;
    name?:string;
    G?:number;
    i:number;
    H?:number;
    w:number;
    M:number;
    n:number;
    q?:number;
    Tp?:number;
    type:OrbitType;
}

export enum OrbitType {
    Elliptical,
    Parabolic,
    NearParabolic,
    Hyperbolic
}

export const TestBody:OrbitElements = {
    "N": 258.0442, // longitude of ascending node (degrees)
    "a": 49.9849804, // semi major axis (AU)
    "e": 0.2905768, // eccentricity
    "id": "2007 OC10",
    "G": 0.15, // don't worry about this for now
    "i": 21.65338, // inclination (degrees)
    "H": 5.0, // don't worry about this for now
    "w": 52.45668, // argument of perihelion (degrees)
    "M": 11.95706, // mean anomaly (degrees)
    "n": 0.00278898, // daily motion (degrees per day)
    "type": OrbitType.Elliptical
}

export const TestBodyData:OrbitDataElements = {
    "node": 258.0442, // longitude of ascending node (degrees)
    "a": 49.9849804, // semi major axis (AU)
    "e": 0.2905768, // eccentricity
    "fulldesignation": "2007 OC10",
    "G": 0.15, // don't worry about this for now
    "incl": 21.65338, // inclination (degrees)
    "H": 5.0, // don't worry about this for now
    "peri": 52.45668, // argument of perihelion (degrees)
    "M": 11.95706, // mean anomaly (degrees)
    "n": 0.00278898 // daily motion (degrees per day)
}

export function getCartesianCoordinates(v:number, r:number, el:OrbitElements, target:Vector3=new Vector3()):Vector3 {
    // convert to 3D cartesian coordinates
    const N = el.N * DEG_TO_RAD;
    const w = el.w * DEG_TO_RAD;
    const i = el.i * DEG_TO_RAD;

    const xh = r * ( Math.cos(N) * Math.cos(v+w) - Math.sin(N) * Math.sin(v+w) * Math.cos(i) );
    const yh = r * ( Math.sin(N) * Math.cos(v+w) + Math.cos(N) * Math.sin(v+w) * Math.cos(i) );
    const zh = r * ( Math.sin(v+w) * Math.sin(i) );

    // Double check coordinates conversion with them!
    // target.set(xh,yh,zh);
    target.set(xh,zh,-yh); // convert from z up to y up (y must be also inverted to convert into Z)

    return target;
}

export function calculateOrbitByType(el:OrbitElements, d:number, type:OrbitType=OrbitType.Elliptical, target:Vector3= new Vector3()):Vector3 {
    if(type === OrbitType.Elliptical) {
        return keplerCalc(el, d, target);
    } else if(type === OrbitType.Parabolic) {
        return parabolicCalc(el, d, target);
    } else if(type === OrbitType.NearParabolic) {
        return nearParabolicCalc(el, d, target);
    } else {
        return hyperbolicCalc(el, d, target);
    }
}

export function calculateOrbit(el:OrbitElements, d:number, target:Vector3= new Vector3()):Vector3 {
    return calculateOrbitByType(el, d, el.type, target);
}

export function keplerCalc(el:OrbitElements, d:number, target:Vector3= new Vector3()):Vector3 {
    // Mean Anomally and Eccentric Anomally
    const e = el.e;
    const M = (el.M + el.n * d) * DEG_TO_RAD;
    let E = M + e * Math.sin(M) * ( 1.0 + e * Math.cos(M) );

    // E convergence check
    if(e >= 0.05) {
        let E0 = E;
        let E1 = E0 - ( E0 - e * Math.sin(E0) - M ) / ( 1 - e * Math.cos(E0) );
        let iterations = 0;
        while(Math.abs(E1-E0) > E_CONVERGENCE_THRESHOLD) {
            iterations++;
            E0 = E1;
            E1 = E0 - ( E0 - e * Math.sin(E0) - M ) / ( 1 - e * Math.cos(E0) );
        }
        if(iterations > 6) console.log(e, iterations);
        E = E1;
    }

    // Find True Anomally and Distance
    const a = el.a;
    const xv = a * ( Math.cos(E) - e );
    const yv = a * ( Math.sqrt(1.0 - e*e) * Math.sin(E) );

    const v = Math.atan2( yv, xv );
    const r = Math.sqrt( xv*xv + yv*yv );

    return getCartesianCoordinates(v, r, el, target);
}

export function parabolicCalc(el:OrbitElements, d:number, target:Vector3= new Vector3()):Vector3 {
    const dT = el.Tp;//JD2MJD(el.Tp);
    const q = el.q;

    const H = (d-dT) * (K/Math.sqrt(2)) / Math.sqrt(q*q*q);
    
    const h = 1.5 * H;
    const g = Math. sqrt( 1.0 + h*h );
    const s = Math.cbrt( g + h ) - Math.cbrt( g - h );

    const v = 2.0 * Math.atan(s);
    const r = q * ( 1.0 + s*s );

    return getCartesianCoordinates(v, r, el, target);
}

export function nearParabolicCalc(el:OrbitElements, d:number, target:Vector3= new Vector3()):Vector3 {
    //Perihelion distance
    const q = el.q;
    const dT = el.Tp;//JD2MJD(el.Tp);
    const e = el.e;

    const a = 0.75 * (d-dT) * K * Math.sqrt( (1 + e) / (q*q*q) );
    const b = Math.sqrt( 1 + a*a );
    const W = Math.cbrt(b + a) - Math.cbrt(b - a);
    const f = (1 - e) / (1 + e);

    const a1 = (2/3) + (2/5) * W*W;
    const a2 = (7/5) + (33/35) * W*W + (37/175) * W**4;
    const a3 = W*W * ( (432/175) + (956/1125) * W*W + (84/1575) * W**4 );

    const C = W*W / (1 + W*W);
    const g = f * C*C;
    const w = W * ( 1 + f * C * ( a1 + a2*g + a3*g*g ) );
    // const w = DEG_TO_RAD * W * ( 1 + f * C * ( a1 + a2*g + a3*g*g ) );

    const v = 2 * Math.atan(w);
    const r = q * ( 1 + w*w ) / ( 1 + w*w * f );

    return getCartesianCoordinates(v, r, el, target);

}

export function hyperbolicCalc(el:OrbitElements, d:number, target:Vector3) {
    const q = el.q;
    const e = el.e;
    // const a = q / (1 - e);
    const a = el.a;
    const dT = el.Tp;//JD2MJD(el.Tp);

    // console.log(el.Tp);

    const M = DEG_TO_RAD * (d-dT) / (-a)**1.5;

    let F0 = M;
    let F1 = ( M + e * ( F0 * Math.cosh(F0) - Math.sinh(F0) ) ) / ( e * Math.cosh(F0) - 1 );
    let iterations = 1;

    // console.log(( e * Math.cosh(F0) - 1 ));
    // console.log(e, M + e * ( F0 * Math.cosh(F0) - Math.sinh(F0) ));

    while(Math.abs(F1-F0) > E_CONVERGENCE_THRESHOLD) {
        iterations++;
        F0 = F1;
        F1 = ( M + e * ( F0 * Math.cosh(F0) - Math.sinh(F0) ) ) / ( e * Math.cosh(F0) - 1 );
    }
    // if(iterations > 6) console.log(e, iterations);
    const F = F1;
    

    const v = 2 * Math.atan( Math.sqrt((e+1)/(e-1)) ) * Math.tanh(F/2);
    const r = a * ( 1 - e*e ) / ( 1 + e * Math.cos(v) );

    return getCartesianCoordinates(v, r, el, target);
}