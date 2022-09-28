import { hideLoader } from "../../production/ui/loader";
import { SolarParticles } from "./SolarParticles";
import { OrbitElements } from "./SolarSystem";
import { mapOrbitElements, OrbitDataElements } from "./SolarUtils";

const data = new Array<OrbitElements>();
export const particles:SolarParticles = new SolarParticles();

export const buildSimWithData = (d:Array<OrbitDataElements>, forceKeep:boolean=false) => {
    if(!forceKeep) {
        data.splice(0, data.length);
    }

    for(const el of d) {            
        const mel = mapOrbitElements(el);
        data.push(mel);
    }

    particles.data = data;
}