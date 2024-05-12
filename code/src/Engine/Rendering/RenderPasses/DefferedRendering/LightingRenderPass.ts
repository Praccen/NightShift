import { gl } from "../../../../main";
import Camera from "../../../Objects/Camera";
import Framebuffer from "../../Framebuffers/Framebuffer";
import ScreenQuad from "../../../Objects/GraphicsObjects/ScreenQuad";
import {
	lightingPass,
	pointShadowsToAllocate,
} from "../../ShaderPrograms/DeferredRendering/LightingPass";
import Texture from "../../Textures/Texture";
import Scene from "../../Scene";
import { vec3 } from "gl-matrix";

export default class LightingRenderPass {
	private screenQuad: ScreenQuad;

	outputFramebuffer: Framebuffer;

	constructor(inputTextures: Texture[]) {
		this.screenQuad = new ScreenQuad(lightingPass, inputTextures);
	}

	setResolution(x: number, y: number) {
		this.outputFramebuffer.setProportions(x, y);
	}

	draw(scene: Scene, camera: Camera) {
		// Disable depth testing for screen quad(s) rendering
		gl.disable(gl.DEPTH_TEST);

		// ---- Lighting pass ----
		lightingPass.use();

		gl.uniform3fv(lightingPass.getUniformLocation("camPos")[0], camera.getPosition());
		scene.directionalLight.bind(lightingPass);
		scene.directionalLight.calcAndSendLightSpaceMatrix(
			vec3.zero(vec3.create()),
			40.0,
			lightingPass.getUniformLocation("lightSpaceMatrix")[0]
		);
		// Point lights
		gl.uniform1i(lightingPass.getUniformLocation("nrOfPointLights")[0], scene.pointLights.length);

		// Bind pointLights, with counter as depthMapIndex
		let counter = 0;
		for (let i = 0; i < scene.pointLights.length; i++) {
			scene.pointLights[i].bind(i, counter, lightingPass);
			if (scene.pointLights[i].castShadow) {
				counter++;
			}
		}

		// Bind all textures except the point light depth maps
		for (let i = 0; i < this.screenQuad.textures.length; i++) {
			this.screenQuad.textures[i].bind(i);
		}

		// Then bind the point light depth maps
		counter = this.screenQuad.textures.length;
		for (const pointLight of scene.pointLights) {
			if (counter - this.screenQuad.textures.length >= pointShadowsToAllocate) {
				break;
			}
			if (pointLight.castShadow) {
				pointLight.pointShadowDepthMap.bind(counter++);
			}
		}

		this.screenQuad.draw(false);
		// -----------------------

		// Enable depth test again
		gl.enable(gl.DEPTH_TEST);
	}
}
