import {
  Color,
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  UniformsUtils,
  Vector3,
  WebGLRenderTarget,
  type Camera,
  type Material,
  type Object3D,
  type WebGLRenderer,
} from "three";
import { HorizontalBlurShader, VerticalBlurShader } from "three-stdlib";
import { composeShader } from "@/lib/shaders";
import vertex from "./shaders/comp.vert";
import fragment from "./shaders/comp.frag";

/** Replace @fils render-target and blur helpers with owned Three resources.
 * Original composition GLSL consumes a scene, selective glow, and solar fire.
 */
export function createPipeline() {
  const makeTarget = () =>
    new WebGLRenderTarget(1, 1, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      colorSpace: SRGBColorSpace,
    });
  const sceneTarget = makeTarget();
  sceneTarget.samples = 2;
  const glowTarget = makeTarget();
  const fireTarget = makeTarget();
  const glowBlur = [makeTarget(), makeTarget()];
  const fireBlur = [makeTarget(), makeTarget()];
  const targets = [
    sceneTarget,
    glowTarget,
    fireTarget,
    ...glowBlur,
    ...fireBlur,
  ];
  const black = new DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  black.needsUpdate = true;
  const block = new MeshBasicMaterial({ color: new Color(0) });
  const horizontal = new ShaderMaterial({
    ...HorizontalBlurShader,
    uniforms: UniformsUtils.clone(HorizontalBlurShader.uniforms),
    depthTest: false,
    depthWrite: false,
  });
  const vertical = new ShaderMaterial({
    ...VerticalBlurShader,
    uniforms: UniformsUtils.clone(VerticalBlurShader.uniforms),
    depthTest: false,
    depthWrite: false,
  });
  const composite = new ShaderMaterial({
    vertexShader: composeShader(vertex),
    fragmentShader: composeShader(fragment),
    uniforms: {
      scene: { value: sceneTarget.texture },
      glow: { value: black },
      glowBlurred: { value: black },
      fire: { value: fireBlur[1].texture },
      camPos: { value: new Vector3() },
    },
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new PlaneGeometry(2, 2);
  const quad = new Mesh(geometry, composite);
  const screen = new Scene();
  screen.add(quad);
  const screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
  screenCamera.position.z = 1;
  let width = 1;
  let height = 1;
  function blur(
    renderer: WebGLRenderer,
    source: WebGLRenderTarget,
    pair: WebGLRenderTarget[],
  ) {
    quad.material = horizontal;
    horizontal.uniforms.tDiffuse.value = source.texture;
    horizontal.uniforms.h.value = 1.5 / width;
    renderer.setRenderTarget(pair[0]);
    renderer.render(screen, screenCamera);
    quad.material = vertical;
    vertical.uniforms.tDiffuse.value = pair[0].texture;
    vertical.uniforms.v.value = 1.5 / height;
    renderer.setRenderTarget(pair[1]);
    renderer.render(screen, screenCamera);
  }
  type Drawable = Object3D & { material: Material | Material[] };
  return {
    resize(w: number, h: number) {
      width = w;
      height = h;
      targets.forEach((target) => target.setSize(w, h));
    },
    render(
      renderer: WebGLRenderer,
      scene: Scene,
      camera: Camera,
      glowEnabled: boolean,
    ) {
      const previousTarget = renderer.getRenderTarget();
      const drawables: {
        object: Drawable;
        visible: boolean;
        material: Material | Material[];
      }[] = [];
      scene.traverse((object) => {
        if ("material" in object) {
          const drawable = object as Drawable;
          drawables.push({
            object: drawable,
            visible: object.visible,
            material: drawable.material,
          });
        }
      });
      const restore = () =>
        drawables.forEach(({ object, visible, material }) => {
          object.visible = visible;
          object.material = material;
          for (const mat of Array.isArray(material) ? material : [material]) {
            if (mat instanceof ShaderMaterial && mat.uniforms.isGlow)
              mat.uniforms.isGlow.value = false;
          }
        });
      try {
        drawables.forEach(({ object }) => {
          if (object.userData.firePass) object.visible = false;
        });
        renderer.setRenderTarget(sceneTarget);
        renderer.render(scene, camera);
        if (glowEnabled) {
          drawables.forEach(({ object }) => {
            const material = object.material;
            if (material instanceof ShaderMaterial && material.uniforms.isGlow)
              material.uniforms.isGlow.value = true;
            else object.visible = false;
          });
          renderer.setRenderTarget(glowTarget);
          renderer.render(scene, camera);
          blur(renderer, glowTarget, glowBlur);
        }
        restore();
        drawables.forEach(({ object, visible }) => {
          object.visible =
            visible &&
            Boolean(object.userData.firePass || object.userData.isSun);
          if (object.userData.isSun) object.material = block;
        });
        renderer.setRenderTarget(fireTarget);
        renderer.render(scene, camera);
        blur(renderer, fireTarget, fireBlur);
        restore();
        composite.uniforms.glow.value = glowEnabled
          ? glowTarget.texture
          : black;
        composite.uniforms.glowBlurred.value = glowEnabled
          ? glowBlur[1].texture
          : black;
        // Normalize the falloff to the enlarged display Sun (legacy radius 4.65 units).
        composite.uniforms.camPos.value
          .copy(camera.position)
          .multiplyScalar(4.65 / 0.12);
        quad.material = composite;
        renderer.setRenderTarget(previousTarget);
        renderer.render(screen, screenCamera);
      } finally {
        restore();
        renderer.setRenderTarget(previousTarget);
      }
    },
    dispose() {
      targets.forEach((target) => target.dispose());
      black.dispose();
      block.dispose();
      horizontal.dispose();
      vertical.dispose();
      composite.dispose();
      geometry.dispose();
    },
  };
}
