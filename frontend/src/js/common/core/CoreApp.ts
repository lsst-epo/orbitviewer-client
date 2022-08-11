import { WebGLSketch } from "@jocabola/gfx";
import { CircleBufferGeometry, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import { DemoType, ShapeType } from "../../editor/ui/sets/GlobalSettings";
import { getEntryById } from "../data/DataManager";
import { loadData } from "../data/DataMap";

const CIRCLE_GEO = new CircleBufferGeometry(.5, 64);
const RECT_GEO = new PlaneBufferGeometry(1, 1);
const TRI_GEO = new CircleBufferGeometry(.5, 3);

export class CoreApp extends WebGLSketch {
    mesh:Mesh;

    constructor() {
        super(window.innerWidth, window.innerHeight, {
            alpha: false,
            antialias: true
        }, false);

        document.body.appendChild(this.domElement);
        this.domElement.classList.add('view');

        this.mesh = new Mesh(
            RECT_GEO,
            new MeshBasicMaterial({
                color: 0xff0000
            })
        );

        this.scene.add(this.mesh);

        this.camera.position.z = 5;

        window.addEventListener('resize', () =>{
            this.resize(window.innerWidth, window.innerHeight);
        });

        console.log('Core App init');
        
        loadData(()=> {
            this.onDataLoaded();
        });
    }

    updateMeshSettings(data:DemoType) {
        this.mesh.material['color'].set(data.color);

        const pos = data.position;
        this.mesh.position.set(pos.x, pos.y, pos.z);

        const scl = data.scale;
        this.mesh.scale.set(scl.x, scl.y, 1);

        switch(data.type) {
            case ShapeType.TRIANGLE:
                this.mesh.geometry = TRI_GEO;
                break;
            case ShapeType.RECTANGLE:
                this.mesh.geometry = RECT_GEO;
                break;
            case ShapeType.CIRCLE:
                this.mesh.geometry = CIRCLE_GEO;
                break;
        }
    }

    onDataLoaded() {
        console.log('LOADED');

        const globals = getEntryById('globals').data;
        this.updateMeshSettings(globals['demo'] as DemoType);
        
        // --------------------------------------------- Hide loader
        document.body.classList.remove('loader__in-progress');
        document.querySelector('.site__loader')?.remove();
        // --------------------------------------------- Launch
        
        this.launch();
    }

    launch() {
        this.start();
    }
}