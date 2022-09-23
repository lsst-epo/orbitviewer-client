import { PerspectiveCamera } from "three";
import { Object3D } from "three";
import { WebGLRenderer } from "three";
import { BackSide, Mesh, MeshBasicMaterial, Scene, SphereGeometry } from "three";
import { initMaterial } from "./ShaderLib";

export class Skybox {
    scene:Scene = new Scene();
    skyMat:MeshBasicMaterial = initMaterial(new MeshBasicMaterial({
        side: BackSide,
        color: 0x999999
    })) as MeshBasicMaterial;
    sky:Mesh;

    constructor() {
        this.sky = new Mesh(new SphereGeometry(1, 64, 64), this.skyMat);
        this.scene.add(this.sky);
    }

    render(renderer:WebGLRenderer, camera:PerspectiveCamera) {
        this.sky.position.copy(camera.position);
        renderer.render(this.scene, camera);
    }
}