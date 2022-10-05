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
import { fetchSolarElements } from "../data/FetchSolarElements";
import { EllipticalPath } from "../solar/EllipticalPath";
import { SolarElement } from "../solar/SolarElement";
import { JD2MJD } from "../solar/SolarTime";
import { Sun } from "../solar/Sun";
import { CameraManager, DEFAULT_CAM_POS } from "./CameraManager";

const PLANETS = "planet_elems.json";
const DWARF_PLANETS = "dwarf_planet_elems.json";

export const solarClock = new SolarClock(new Clock());

export type SingletonApp = {
    instance:CoreApp;
}

export const CoreAppSingleton:SingletonApp = {
    instance: null
}

export const SUN = {
    instance: null
}

let solarItems = data.solarItems;
const categories = data.categories;

export class CoreApp extends WebGLSketch {
    solarClock:SolarClock = solarClock;

    solarElements:Array<SolarElement> = []

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
        
        console.log('Loading Planets...');
        io.load(window.location.origin + `/assets/data/${PLANETS}`, (res) => {
            const planetsData = JSON.parse(res)
            
            getMinMaxPlanetsA(planetsData);

            this.createPlanets(planetsData);

            console.log('Loading Dwarf Planets...');
            io.load(window.location.origin + `/assets/data/${DWARF_PLANETS}`, (res) => {
                const dwarfData = JSON.parse(res);
                this.createDwarfPlanets(dwarfData);

                console.log('Loading Solar Elements...');                
                getSolarSystemElements().then((res) => {
                    
                    const d = res.mpcorb;       
                                       
                    buildSimWithData(d);

                    console.log('Loading Interactive Solar Elements...');
                    fetchSolarElements(solarItems).then((res) => {

                        const d = res;
                        this.createSolarItems(d)

                        loadData(()=> {
                            this.onDataLoaded();
                        });

                    })
        
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
            // Remove planets form solar items
            solarItems = solarItems.filter(e => e.elementID !== el.id)
            
			this.solarElements.push(planet);
            this.scene.add(planet);
            this.scene.add(planet.orbitPath.ellipse);

            // this.scene.add(planet.sunLine);

            updateRaycasterWatch([planet]);

		}
	}

	createDwarfPlanets(d:Array<OrbitDataElements>) {
        
        const category = categories.find(x => x.slug === 'planets-moons');

		for(const el of d) {
            
            el.tperi = JD2MJD(el.tperi);

			const mel = mapOrbitElements(el);
            mel.category = category.slug;
            
			const planet = new SolarElement(el.id, mel, {
                color: 0xFA6868
            });

            linkPlanetToPopup(planet, el);
            // Remove dwarfs form solar items
            solarItems = solarItems.filter(e => e.elementID !== el.id)

            this.solarElements.push(planet);
            this.scene.add(planet);
            this.scene.add(planet.orbitPath.ellipse);

            updateRaycasterWatch([planet]);
		}

	}

    createSolarItems(d:Array<OrbitDataElements>){

        for(const el of d) {

            el.tperi = JD2MJD(el.tperi);

            const mel = mapOrbitElements(el);
            const category = categories.find(x => x.slug === mel.category);
            const planet = new SolarElement(el.id, mel, {
                color: category.mainColor
            });

            linkPlanetToPopup(planet, el);

            this.solarElements.push(planet);
            this.scene.add(planet);
            this.scene.add(planet.orbitPath.ellipse);

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

        } else this.start();

        this.solarClock = solarClock;
        this.solarClock.start();

        hideLoader();

        this.launched = true;

        if(LOCATION.current.id != 'orbit-viewer') {
            this.lock();
            CameraManager.goToTarget(this.sun, true);
        }
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

        for(let i=0; i<this.solarElements.length; i++) {
            const path = this.solarElements[i].orbitPath;
            path.hidden = true;
        }
    }

    unlock() {
        if(!this.launched) return;
        particles.highlighted = true;
        this.sun.highlight = false;
        
        for(let i=0; i<this.solarElements.length; i++) {
            const path = this.solarElements[i].orbitPath;
            path.hidden = false;
        }
    }

    set planetsVisibility(value:boolean) {

        for(let i = 0, len = this.solarElements.length; i < len; i++) {
            this.solarElements[i].visible = value;
        }
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
		
		for(let i = 0, len = this.solarElements.length; i < len; i++) {
			this.solarElements[i].update(d);
		}

        this.sun.update(solarClock.time);
	}

    render(): void {
        css2D.render(this.camera as PerspectiveCamera);	
		this.vfx.render(this.scene, this.camera as PerspectiveCamera);
        // particles.sim.drawFbo();
	}
}
