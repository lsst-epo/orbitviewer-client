import { WebGLSketch } from "@jocabola/gfx";
import { io } from "@jocabola/io";
import { AmbientLight, Clock, PerspectiveCamera, PointLight, TextureLoader } from "three";
import { css2D } from "../../production/ui/popups/Css2D";
import { enablePopup, initPopups, linkSolarElementToPopup, popupsLoaded, resizePopups } from "../../production/ui/popups/PopupsManager";
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
import { categories, getMinMaxAByCategory, getMinMaxPlanetsA } from "../data/Categories";
import { fetchSolarElements } from "../data/FetchSolarElements";
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
            near: 0.01,
            far: 100000
        }, false);

        console.log('%cSite developed by Fil Studio', "color:white;font-family:system-ui;font-size:1rem;font-weight:bold");

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

        if(DEV) console.log('Core App init');
        

        // background
        new TextureLoader().load('/assets/textures/8k_stars.jpg', (t) => {
            this.vfx.bg = t;
            this.vfx.needsBGUpdate = true;
        });
        
        if(DEV) console.log('Loading Planets...');
        io.load(window.location.origin + `/assets/data/${PLANETS}`, (res) => {
            const planetsData = JSON.parse(res)
            
            getMinMaxPlanetsA(planetsData);
            
            this.createPlanets(planetsData);

            if(DEV) console.log('Loading A values...');
            getMinMaxAByCategory().then(() => {                
      
                if(DEV) console.log('Loading Dwarf Planets...');
                io.load(window.location.origin + `/assets/data/${DWARF_PLANETS}`, (res) => {
                    const dwarfData = JSON.parse(res);
                    this.createDwarfPlanets(dwarfData);

                    if(DEV) console.log('Loading Solar Elements...');                
                    getSolarSystemElements().then((res) => {
                        
                        const d = res.mpcorb;       
                                        
                        buildSimWithData(d);

                        if(DEV) console.log('Loading Interactive Solar Elements...');
                        fetchSolarElements(solarItems).then((res) => {

                            const d = res;                            
                            this.createSolarItems(d)

                            loadData(()=> {
                                this.onDataLoaded();
                            });

                        })
            
                    }).catch((err) => {
                        console.log(err);
                        
                        console.error('Database fetch error.')
                    });
                            
                });

            
            })

        });

    }

    resize(width: number, height: number): void {
		super.resize(width, height);
        css2D.setSize(width, height);
        resizePopups();
		this.vfx.resize(width, height);

	}

    onDataLoaded() {
        
        if(DEV) console.log('Data Loaded');

        popupsLoaded();

        // --------------------------------------------- Launch      
        document.querySelector('.site__wrapper').classList.remove('loading');  
        document.querySelector('.site__wrapper').classList.add('loaded');  

        this.launch();
    }

    createPlanets(d:Array<OrbitDataElements>) {

        // Overwrite name so we can create fake items
		for(const el of d) {

            el.tperi = JD2MJD(el.tperi);

			const mel = mapOrbitElements(el);
            mel.category = 'planets-moons';

			const planet = new Planet(el.id as PlanetId, mel);

            linkSolarElementToPopup(planet, el);
            // Remove planets form solar items
            solarItems = solarItems.filter(e => e.elementID !== el.id)
            
			this.solarElements.push(planet);
            this.scene.add(planet);
            this.scene.add(planet.orbitPath.ellipse);

            // this.scene.add(planet.sunLine);
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

            linkSolarElementToPopup(planet, el);
            // Remove dwarfs form solar items
            solarItems = solarItems.filter(e => e.elementID !== el.id)

            this.solarElements.push(planet);
            this.scene.add(planet);
            this.scene.add(planet.orbitPath.ellipse);

		}

	}

    createSolarItems(d:Array<OrbitDataElements>){

        for(const el of d) {

            el.tperi = JD2MJD(el.tperi);            
            const mel = mapOrbitElements(el);
            
            const category = categories.find(x => x.slug === mel.category);
            
            const solarElement = new SolarElement(el.id, mel, {
                color: category.mainColor
            });
            
            linkSolarElementToPopup(solarElement, el);

            this.solarElements.push(solarElement);
            this.scene.add(solarElement);
            this.scene.add(solarElement.orbitPath.ellipse);

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

            const stats = Stats();
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
        } else {
            const element = window['solarSystemSelectedElement'];

            if(element) {

                const url = window.location.pathname.split('/');
                const clean = url.filter(x => x !== '');           

                window.history.pushState('', '', `/${clean[0]}/${clean[1]}/`)

                setTimeout(() => {
                    enablePopup(element.elementID);
                }, 100);
      
            }
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

    set orbitsVisibility(value:boolean) {     

        for(let i = 0, len = this.solarElements.length; i < len; i++) {
            if(!this.solarElements[i].orbitPath) continue;
            this.solarElements[i].orbitPath.hidden = value;            
        }
    }

    set backgroundVisibility(value:boolean) {
        if(!this.started) return;
        this.vfx.enableBackground = value;
    }

    clockChanged():boolean {                
        return (CLOCK_SETTINGS.speed !== this.solarClock.secsPerHour);
    }

    update() {
		super.update();

		CameraManager.update();
        
        if(this.clockChanged()) this.solarClock.secsPerHour = CLOCK_SETTINGS.speed;
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
