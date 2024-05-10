import { gl } from "../../../../main";
import Scene from "../../Scene";
import Camera from "../../../Objects/Camera";
import { vec3 } from "gl-matrix";
import { pointShadowPass } from "../../ShaderPrograms/ShadowMapping/PointShadowPass";
import { pointShadowsToAllocate } from "../../ShaderPrograms/DeferredRendering/LightingPass";

export default class PointShadowRenderPass {
	private shadowResolution: number;

	constructor() {
		this.shadowResolution = 1023;
	}

	setShadowMappingResolution(res: number) {
		this.shadowResolution = res;
	}

	draw(scene: Scene) {
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        
        let pointLightCamera = new Camera();
        pointLightCamera.setFOV(90);
        pointLightCamera.setAspectRatio(1);
        pointLightCamera.setFarPlaneDistance(100.0);

        const directions = [vec3.fromValues(1.0, 0.0, 0.0), vec3.fromValues(-1.0, 0.0, 0.0), vec3.fromValues(0.0, -1.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0), vec3.fromValues(0.0, 0.0, -1.0), vec3.fromValues(0.0, 0.0, 1.0)];
        const ups = [vec3.fromValues(0.0, 1.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0), vec3.fromValues(0.0, 0.0, -1.0), vec3.fromValues(0.0, 0.0, 1.0), vec3.fromValues(0.0, 1.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0)];

        let counter = 0;
        for (let pointLight of scene.pointLights) {
            if (counter >= pointShadowsToAllocate) {
                break;
            }
			if (pointLight.castShadow /*&& !pointLight.depthMapGenerated*/) {
                counter++;
                // pointLight.depthMapGenerated = true;
                
                pointLightCamera.setPosition(pointLight.position);
        
                pointLight.pointShadowBuffer.bind(gl.FRAMEBUFFER);
                pointLight.pointShadowDepthMap.setTextureData(null, this.shadowResolution, this.shadowResolution); // Make sure the textures are correct size. TOOD: Is this super slow?
                
                for (let i = 0; i < directions.length; i++) {
                    pointLightCamera.setDir(directions[i]);
                    pointLightCamera.setUp(ups[i]);
                    gl.framebufferTexture2D(
                        gl.FRAMEBUFFER,
                        gl.DEPTH_ATTACHMENT,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                        pointLight.pointShadowDepthMap.texture,
                        0
                    );	
        
                    // ---- Shadow pass ----
                    pointShadowPass.use();
                    gl.viewport(0, 0, this.shadowResolution, this.shadowResolution);
                    gl.clear(gl.DEPTH_BUFFER_BIT);
        
                    //Set uniforms          
                    pointLightCamera.bindViewProjMatrix(pointShadowPass.getUniformLocation("lightSpaceMatrix")[0]);
                    gl.uniform3fv(
                        pointShadowPass.getUniformLocation("cameraPos")[0],
                        pointLightCamera.getPosition()
                    );
        
                    //Render shadow pass
                    scene.renderScene(pointShadowPass, false);
                }
			}
		}


        gl.disable(gl.CULL_FACE);
	}
}
