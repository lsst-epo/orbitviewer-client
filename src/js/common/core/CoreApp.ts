import { WebGLSketch } from "@jocabola/gfx";
import { io } from "@jocabola/io";
import { AmbientLight, Clock, Group, PerspectiveCamera, PointLight, TextureLoader } from "three";
import { css2D } from "../../production/ui/popups/Css2D";
import { initPopups, linkPlanetToPopup, popupsLoaded, resizePopups } from "../../production/ui/popups/PopupsManager";
import { initRaycaster, updateRaycaster, updateRaycasterWatch } from "../../production/ui/popups/Raycaster";
import { loadData } from "../data/DataMap";
import { getSolarSystemElements } from "../data/FiltersManager";
import { initShaders } from "../gfx/shaders";
import { VFXRenderer } from "../gfx/VFXRenderer";
import { Planet, PlanetId } from "../solar/Planet";
import { SolarClock } from "../solar/SolarClock";
import { buildSimWithData, particles } from "../solar/SolarParticlesManager";
import { mapOrbitElements, OrbitDataElements } from "../solar/SolarUtils";
import { SunLightHelper } from "../solar/SunLightHelper";
import { CLOCK_SETTINGS, DEV } from "./Globals";

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { LOCATION } from "../../production/pagination/History";
import { hideLoader } from "../../production/ui/loader";
import { getMinMaxPlanetsA } from "../data/Categories";
import { EllipticalPath } from "../solar/EllipticalPath";
import { Sun } from "../solar/Sun";
import { CameraManager, DEFAULT_CAM_POS } from "./CameraManager";
import { JD2MJD } from "../solar/SolarTime";
import { SolarElement } from "../solar/SolarElement";

const PLANETS = "planet_elems.json";
const DWARF_PLANETS = "dwarf_planet_elems.json";

export const solarClock = new SolarClock(new Clock());

export const orbitPaths:Array<EllipticalPath> = [];

export type SingletonApp = {
    instance:CoreApp;
}

export const CoreAppSingleton:SingletonApp = {
    instance: null
}

export const SUN = {
    instance: null
}

export class CoreApp extends WebGLSketch {
    solarClock:SolarClock = solarClock;

    planets:Group = new Group();
    SolarElements:Group = new Group();

    planetPaths:Group = new Group();
    dwarfPlanetPaths:Group = new Group();

    sunLight:PointLight;
    sunLightHelper:SunLightHelper;

    ambientLight:AmbientLight;

    vfx:VFXRenderer;
    sun:Sun;

    private launched:boolean = false;

    constructor() {
        super(window.innerWidth, window.innerHeight, {
            alpha: false,
            antialias: true,
            near: 0.01
        }, false);

        CoreAppSingleton.instance = this;

        document.body.appendChild(this.domElement);
        this.domElement.classList.add('view');

        this.camera.position.z = 5;

        window.addEventListener('resize', () =>{
            this.resize(window.innerWidth, window.innerHeight);
        });

        initShaders();
        
        css2D.init(window.innerWidth, window.innerHeight);

        initPopups();

        initRaycaster();


        this.vfx = new VFXRenderer(this.renderer, window.innerWidth, window.innerHeight);

        const sun = new Sun();

        this.scene.add(sun);
        this.sun = sun;
        SUN.instance = sun;
        // this.renderer.physicallyCorrectLights = true;

        this.scene.add(this.planets);
        this.scene.add(this.SolarElements);

        this.scene.add(this.planetPaths);
        this.scene.add(this.dwarfPlanetPaths);

        particles.init(this.renderer);
        this.scene.add(particles.points);
        
        this.sunLight = new PointLight(0xffffff, .5, 400, 2);
        this.scene.add(this.sunLight);
        this.sunLightHelper = new SunLightHelper(this.sunLight, 0x999900, 0xcc0000);
        this.sunLightHelper.visible = false;
        this.scene.add(this.sunLightHelper);

        this.ambientLight = new AmbientLight(0xffffff, 0.35);
        this.scene.add(this.ambientLight);

        console.log('Core App init');

        // background
        new TextureLoader().load('/assets/textures/8k_stars.jpg', (t) => {
            this.vfx.bg = t;
            this.vfx.needsBGUpdate = true;
        });
        

        io.load(window.location.origin + `/assets/data/${PLANETS}`, (res) => {
            const planetsData = JSON.parse(res)
            
            getMinMaxPlanetsA(planetsData);

            this.createPlanets(planetsData);

            io.load(window.location.origin + `/assets/data/${DWARF_PLANETS}`, (res) => {
                const dwarfData = JSON.parse(res);
                this.createDwarfPlanets(dwarfData);

                getSolarSystemElements().then((res) => {
                    
                    const d = res.mpcorb;                    
                    
                    buildSimWithData(d);
                    
                    loadData(()=> {
                        this.onDataLoaded();
                    });
                }).catch(() => {
                    console.error('Database fetch error.')
                });
                        
            });

        });

    }

    resize(width: number, height: number): void {
		super.resize(width, height);
        css2D.setSize(width, height);
        resizePopups();
		this.vfx.resize(width, height);
	}

    onDataLoaded() {
        console.log('Data Loaded');
        popupsLoaded();

        // const globals = getEntryById('globals').data;
        // this.updateMeshSettings(globals['demo'] as DemoType);

        // --------------------------------------------- Launch        
        this.launch();
    }

    createPlanets(d:Array<OrbitDataElements>) {

        // Overwrite name so we can create fake items
		for(const el of d) {

            el.tperi = JD2MJD(el.tperi);

			const mel = mapOrbitElements(el);
            mel.category = 'planets-moons';

			const planet = new Planet(el.id as PlanetId, mel);

            linkPlanetToPopup(planet, el);
            
			this.planets.add(planet);
			this.planetPaths.add(planet.orbitPath.ellipse);
            orbitPaths.push(planet.orbitPath);

            // this.scene.add(planet.sunLine);

            updateRaycasterWatch([planet]);

		}
	}

	createDwarfPlanets(d:Array<OrbitDataElements>) {
		for(const el of d) {
            
            el.tperi = JD2MJD(el.tperi);

			const mel = mapOrbitElements(el);
            mel.category = 'planets-moons';
			const planet = new SolarElement(el.id, mel, {
                color: 0xFA6868
            });

            linkPlanetToPopup(planet, el);

			this.SolarElements.add(planet);
			this.dwarfPlanetPaths.add(planet.orbitPath.ellipse);
            orbitPaths.push(planet.orbitPath);

            updateRaycasterWatch([planet]);
		}

	}

	playPause() {
		if(this.solarClock.playing) {
			this.solarClock.pause();
		} else {
			this.solarClock.resume();
		}
	}

	importData(d:Array<OrbitDataElements>) {
		buildSimWithData(d);
	}

	resetClock() {
		this.solarClock.stop();
		this.solarClock.start();
	}

    launch() {
        this.camera.position.copy(DEFAULT_CAM_POS);
        this.camera.lookAt(this.scene.position);

        // Init controls
        CameraManager.init(this.camera as PerspectiveCamera, this.domElement);

        window.addEventListener('keydown', (evt) =>{
            if(evt.key == ' ') this.playPause();
        });

        if(DEV) {
            const stats = new Stats();
            document.body.appendChild(stats.domElement);
            stats.domElement.style.left = '100px';

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

        hideLoader();

        if(LOCATION.current.id != 'orbit-viewer') {
            this.lock();
            CameraManager.goToTarget(this.sun, true);
        }

        this.launched = true;
    }

    goToIntroView () {
        if(!this.launched) return;
        this.lock();
        CameraManager.goToTarget(this.sun, true);
    }

    goToDefaultView () {
        if(!this.launched) return;
        this.unlock();
        CameraManager.reset();
    }

    lock() {
        if(!this.launched) return;
        particles.highlighted = false;
        this.sun.highlight = true;

        for(let i=0; i<orbitPaths.length; i++) {
            const path = orbitPaths[i];
            path.hidden = true;
        }
    }

    unlock() {
        if(!this.launched) return;
        particles.highlighted = true;
        this.sun.highlight = false;
        
        for(let i=0; i<orbitPaths.length; i++) {
            const path = orbitPaths[i];
            path.hidden = false;
        }
    }

    set planetsVisibility(value:boolean) {
        this.planets.visible = value;
        this.planetPaths.visible = value;
        this.SolarElements.visible = value;
        this.dwarfPlanetPaths.visible = value;
    }

    clockChanged():boolean {
        return (CLOCK_SETTINGS.speed !== this.solarClock.secsPerHour);
    }

    update() {
		super.update();

        updateRaycaster(this.camera);

		CameraManager.update();

        if(this.clockChanged())this.solarClock.secsPerHour = CLOCK_SETTINGS.speed;
		const d = this.solarClock.update();
		
		particles.update(d, this.camera as PerspectiveCamera);
		
		for(const c of this.planets.children) {
			const p = c as Planet;
			p.update(d);
		}

		for(const c of this.SolarElements.children) {
			const p = c as Planet;
			p.update(d);
		}

        this.sun.update(solarClock.time);
	}

    render(): void {
        css2D.render(this.camera as PerspectiveCamera);	
		this.vfx.render(this.scene, this.camera as PerspectiveCamera);
        // particles.sim.drawFbo();
	}
}
