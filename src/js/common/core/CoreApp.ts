import { WebGLSketch } from "@jocabola/gfx";
import { io } from "@jocabola/io";
import { AmbientLight, Clock, Group, Mesh, Object3D, PerspectiveCamera, PointLight, SphereGeometry, TextureLoader } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { css2D } from "../../production/ui/expandable-items/Css2D";
import { expandableItems, initExpandableItems, resizeExpandableItems } from "../../production/ui/expandable-items/ExpandableItems";
import { initRaycaster, updateRaycaster, updateRaycasterWatch } from "../../production/ui/expandable-items/Raycaster";
import { getEntryById } from "../data/DataManager";
import { loadData } from "../data/DataMap";
import { getSolarSystemElements } from "../data/GetData";
import { initShaders } from "../gfx/shaders";
import { SunMaterial } from "../gfx/SunMaterial";
import { VFXRenderer } from "../gfx/VFXRenderer";
import { Planet, PLANET_SCALE } from "../solar/Planet";
import { SolarClock } from "../solar/SolarClock";
import { SolarParticles } from "../solar/SolarParticles";
import { KM2AU, OrbitElements, SUN_RADIUS } from "../solar/SolarSystem";
import { mapOrbitElements, OrbitDataElements } from "../solar/SolarUtils";
import { SunLightHelper } from "../solar/SunLightHelper";
import { SunParticles } from "../solar/SunParticles";
import { CLOCK_SETTINGS, CONTROLS, DEV } from "./Globals";

import Stats from 'three/examples/jsm/libs/stats.module.js';

const GEO = new SphereGeometry(1, 32, 32);

const data = new Array<OrbitElements>();

const PLANETS = "planet_elems.json";
const DWARF_PLANETS = "dwarf_planet_elems.json";

export const solarClock = new SolarClock(new Clock());

export class CoreApp extends WebGLSketch {
    particles:SolarParticles;

    solarClock:SolarClock = solarClock;

    planets:Group = new Group();
    dwarfPlanets:Group = new Group();

    planetPaths:Group = new Group();
    dwarfPlanetPaths:Group = new Group();

    sunLight:PointLight;
    sunLightHelper:SunLightHelper;

    ambientLight:AmbientLight;

    vfx:VFXRenderer;
    sun:Mesh;
    sunParticles:SunParticles;

    constructor() {
        super(window.innerWidth, window.innerHeight, {
            alpha: false,
            antialias: true,
            near: 0.01
        }, false);

        document.body.appendChild(this.domElement);
        this.domElement.classList.add('view');

        this.camera.position.z = 5;

        window.addEventListener('resize', () =>{
            this.resize(window.innerWidth, window.innerHeight);
        });

        initShaders();
        
        initRaycaster();

        css2D.init(window.innerWidth, window.innerHeight);
        initExpandableItems();

        this.vfx = new VFXRenderer(this.renderer, window.innerWidth, window.innerHeight);

        const sun = new Mesh(
            GEO,
            new SunMaterial({
                emissive: 0xff6600,
                emissiveIntensity: 1.5
            })
        );

        sun.scale.setScalar(SUN_RADIUS * KM2AU * PLANET_SCALE * .2);

        this.scene.add(sun);
        this.sun = sun;
        // this.renderer.physicallyCorrectLights = true;

        this.sunParticles = new SunParticles(sun.scale.x+.006, sun.scale.x * .15);
        this.scene.add(this.sunParticles.mesh);

        this.scene.add(this.planets);
        this.scene.add(this.dwarfPlanets);

        this.scene.add(this.planetPaths);
        this.scene.add(this.dwarfPlanetPaths);

        this.particles = new SolarParticles(this.renderer);
        this.scene.add(this.particles.points);
        // this.scene.add(this.particles.mesh);

        this.sunLight = new PointLight(0xffffff, .5, 400, 2);
        this.scene.add(this.sunLight);
        this.sunLightHelper = new SunLightHelper(this.sunLight, 0x999900, 0xcc0000);
        this.sunLightHelper.visible = false;
        this.scene.add(this.sunLightHelper);

        this.ambientLight = new AmbientLight(0xffffff, 0.1);
        this.scene.add(this.ambientLight);

        console.log('Core App init');

        // background
        const tex = new TextureLoader().load('/assets/textures/8k_stars.jpg', (t) => {
            this.vfx.bg = t;
            this.vfx.needsBGUpdate = true;
        });
        

        io.load(window.location.origin + `/assets/data/${PLANETS}`, (res) => {
            const d = JSON.parse(res)
            this.createPlanets(d);

            io.load(window.location.origin + `/assets/data/${DWARF_PLANETS}`, (res) => {
                const d = JSON.parse(res);
                this.createDwarfPlanets(d);

                getSolarSystemElements().then((res) => {
                    
                    const d = res.mpcorb;
                    this.buildSimWithData(d);
                    
                    loadData(()=> {
                        this.onDataLoaded();
                    });
                });
                
            });

        });
    }

    resize(width: number, height: number): void {
		super.resize(width, height);
        css2D.setSize(width, height);
        resizeExpandableItems();
		this.vfx.resize(width, height);
	}

    onDataLoaded() {
        console.log('Data Loaded');

        const globals = getEntryById('globals').data;
        // this.updateMeshSettings(globals['demo'] as DemoType);
        
        // --------------------------------------------- Hide loader
        document.body.classList.remove('loader__in-progress');
        document.querySelector('.site__loader')?.remove();
        // --------------------------------------------- Launch
        
        this.launch();
    }

    createPlanets(d:Array<OrbitDataElements>) {

        // Overwrite name so we can create fake items
        let i = 0;

		for(const el of d) {
			const mel = mapOrbitElements(el);

            // el.fulldesignation = `fake-${i}`;
			const planet = new Planet(el.fulldesignation, mel);

            const expandableItem = expandableItems.find(x => x.name === planet.name);
            if(expandableItem) expandableItem.ref = planet;
            
			this.planets.add(planet);
			this.planetPaths.add(planet.orbitPath.ellipse);

            updateRaycasterWatch([planet]);

            i++;
		}
	}

	createDwarfPlanets(d:Array<OrbitDataElements>) {
		for(const el of d) {
			const mel = mapOrbitElements(el);
			const planet = new Planet(el.fulldesignation, mel, {
                color: 0xFA6868
            });

			this.dwarfPlanets.add(planet);
			this.dwarfPlanetPaths.add(planet.orbitPath.ellipse);

            updateRaycasterWatch([planet]);
		}

	}

	buildSimWithData(d:Array<OrbitDataElements>, forceKeep:boolean=false) {
		if(!forceKeep) {
			data.splice(0, data.length);
		}

		for(const el of d) {
			const mel = mapOrbitElements(el);
			data.push(mel);
		}

		this.particles.data = data;
	}

	playPause() {
		if(this.solarClock.playing) {
			this.solarClock.pause();
		} else {
			this.solarClock.resume();
		}
	}

	importData(d:Array<OrbitDataElements>) {
		this.buildSimWithData(d);
	}

	resetClock() {
		this.solarClock.stop();
		this.solarClock.start();
	}

    launch() {
        this.camera.position.z = 10;
        this.camera.position.y = 3;
        this.camera.lookAt(this.scene.position);

        // Init controls
        const ctrls = new OrbitControls(this.camera, this.domElement);
        CONTROLS.orbit = ctrls;
        ctrls.minDistance = CONTROLS.min;
        ctrls.maxDistance = CONTROLS.max;
        ctrls.enableDamping = true;
        ctrls.dampingFactor = .1;

        window.addEventListener('keydown', (evt) =>{
            if(evt.key == ' ') this.playPause();
        });

        if(DEV) {
            const stats = new Stats();
            document.body.appendChild(stats.domElement);

            const customAnimate = () => {
                requestAnimationFrame(customAnimate);
                stats.begin();
                this.update();
                this.render();
                stats.end();
            }
            this.start(customAnimate);
        } else {
            this.start();
        }
        this.solarClock = solarClock;
        this.solarClock.start();
    }

    clockChanged():boolean {
        return (CLOCK_SETTINGS.speed !== this.solarClock.secsPerHour);
    }

    update() {
		super.update();

        updateRaycaster(this.camera);

		CONTROLS.orbit.update();

        if(this.clockChanged())this.solarClock.secsPerHour = CLOCK_SETTINGS.speed;
		const d = this.solarClock.update();
		
		this.particles.update(d, this.camera as PerspectiveCamera);

        const sunMat = this.sun.material as SunMaterial;
		sunMat.update(this.solarClock.time);
		
		for(const c of this.planets.children) {
			const p = c as Planet;
			p.update(d);
		}

		for(const c of this.dwarfPlanets.children) {
			const p = c as Planet;
			p.update(d);
		}

		this.sunParticles.update(this.solarClock.time);
	}

    render(): void {
        css2D.render(this.camera as PerspectiveCamera);	
		this.vfx.render(this.scene, this.camera as PerspectiveCamera);
        // this.particles.sim.drawFbo();
	}
}