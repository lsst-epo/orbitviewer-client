import { FboUtils, Size } from "@jocabola/gfx";
import { BufferAttribute, BufferGeometry, FloatType, NearestFilter, OrthographicCamera, Points, PointsMaterial, Scene, Texture, WebGLRenderer, WebGLRenderTarget } from "three";
import { GPU_SIM_SIZES, VISUAL_SETTINGS } from "../core/Globals";
import { OrbitElements } from "./SolarSystem";

export type SimQuality = 'low'|'medium'|'high'|'ultra';

export class GPUSim {
    private quality:SimQuality = VISUAL_SETTINGS.current as SimQuality;
    private fbo:WebGLRenderTarget;
    private totalItems:number;
    private points:Points;
    private scene:Scene = new Scene();
    private camera:OrthographicCamera;
    rnd:WebGLRenderer

    constructor(renderer:WebGLRenderer) {
        this.rnd = renderer;
        this.createBuffers(true);
    }

    private createBuffers(firstTime:boolean=false) {
        const siz = GPU_SIM_SIZES[this.quality] as Size;
        this.totalItems = siz.width * siz.height;

        const w = siz.width;
        const h = siz.height;

        if(firstTime) {
            this.camera = new OrthographicCamera(-w/2, w/2, h/2, -h/2, 1, 100);
            this.camera.position.z = 10;
            this.scene.add(this.camera);
            this.fbo = new WebGLRenderTarget(w, h);
            this.fbo.texture.minFilter = NearestFilter;
            this.fbo.texture.magFilter = NearestFilter;
            this.fbo.texture.type = FloatType;
            this.points = new Points(
                this.createPoints(),
                new PointsMaterial({
                    color: 0xff0000,
                    size: 1,
                    sizeAttenuation: false
                })
            );
            this.scene.add(this.points);
        } else {
            this.fbo.setSize(w, h);
            this.points.geometry.dispose();
            this.points.geometry = this.createPoints();
            this.camera.left = -w/2;
            this.camera.right = w/2;
            this.camera.top = h/2;
            this.camera.bottom = -h/2;
            this.camera.updateProjectionMatrix();
        }

        this.points.position.x = -w/2;
        this.points.position.y = -h/2;
    }

    private createPoints(): BufferGeometry {
        const siz = GPU_SIM_SIZES[this.quality] as Size;
        const count = this.totalItems;
        const geo = new BufferGeometry();

        // attrs
        const pos = [];
        const active = new Float32Array(count); // 0 dead 1 active
        const N = new Float32Array(count);
        const a = new Float32Array(count);
        const e = new Float32Array(count);
        const i = new Float32Array(count);
        const w = new Float32Array(count);
        const M = new Float32Array(count);
        const n = new Float32Array(count);
        const type = new Float32Array(count);

        for(let i=0; i<siz.width; i++) {
            for(let j=0; j<siz.height; j++) {
                pos.push(i,j,0);
            }
        }

        geo.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(pos), 3
            )
        );

        geo.setAttribute(
            'active', 
            new BufferAttribute(active, 1)
        );

        geo.setAttribute(
            'N', 
            new BufferAttribute(N, 1)
        );

        geo.setAttribute(
            'a', 
            new BufferAttribute(a, 1)
        );

        geo.setAttribute(
            'e', 
            new BufferAttribute(e, 1)
        );

        geo.setAttribute(
            'i', 
            new BufferAttribute(i, 1)
        );

        geo.setAttribute(
            'w', 
            new BufferAttribute(w, 1)
        );

        geo.setAttribute(
            'M', 
            new BufferAttribute(M, 1)
        );

        geo.setAttribute(
            'n',
            new BufferAttribute(n, 1)
        );

        geo.setAttribute(
            'type', 
            new BufferAttribute(type, 1)
        );

        return geo;
    }

    get texture():Texture {
        return this.fbo.texture;
    }

    private updateDataBuffer(id:string, data:Array<OrbitElements>) {
        const geo = this.points.geometry;
        const attr = geo.attributes[id];
        if(!attr) {
            return console.warn(`Couldn't find attribute ${id}!!`);
        }

        const arr = attr.array as Float32Array;

        for(let i=0; i<Math.min(this.totalItems, data.length); i++) {
            arr[i] = data[i][id];
            // console.log(data[i][id]);
        }

        attr.needsUpdate = true;
    }

    set data(value:Array<OrbitElements>) {
        const geo = this.points.geometry;
        const active = geo.attributes.active;
        const arr = active.array as Float32Array;
        
        for(let i=0; i<Math.min(this.totalItems, value.length); i++) {
            arr[i] = 1;
        }

        for(let i=value.length; i<this.totalItems; i++) {
            arr[i] = 0;
        }

        this.updateDataBuffer('N', value);
        this.updateDataBuffer('a', value);
        this.updateDataBuffer('e', value);
        this.updateDataBuffer('i', value);
        this.updateDataBuffer('w', value);
        this.updateDataBuffer('M', value);
        this.updateDataBuffer('n', value);
        this.updateDataBuffer('type', value);

        active.needsUpdate = true;
        // N.needsUpdate = true;
    }

    render() {
        this.rnd.setRenderTarget(this.fbo);
        this.rnd.render(this.scene, this.camera);
        this.rnd.setRenderTarget(null);
    }

    drawFbo() {
        this.rnd.autoClear = false;
        this.rnd.clearDepth();
        FboUtils.drawFbo(this.fbo, this.rnd, 100, 100);
    }
}