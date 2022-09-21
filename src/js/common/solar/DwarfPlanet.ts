import { Planet } from "./Planet";

export class DwarfPlanet extends Planet {
    constructor(name: string, _data:OrbitElements) {
        super(name, _data);
    }
}