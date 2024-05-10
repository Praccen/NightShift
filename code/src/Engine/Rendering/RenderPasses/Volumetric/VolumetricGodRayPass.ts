import { gl } from "../../../../main";
import Camera from "../../../Objects/Camera";
import GodRayPlanes from "../../../Objects/GraphicsObjects/GodRayPlanes";
import Framebuffer from "../../Framebuffers/Framebuffer";
import Scene from "../../Scene";
import { pointShadowsToAllocate } from "../../ShaderPrograms/DeferredRendering/LightingPass";
import { volumetricGodRayShaderProgram } from "../../ShaderPrograms/Volumetric/VolumetricGodRayShaderProgram";

export default class VolumetricGodRayPass {
	outputBuffer: Framebuffer;

	private godRayPlanes: GodRayPlanes;
	constructor() {
		this.outputBuffer = null;
		this.godRayPlanes = new GodRayPlanes(volumetricGodRayShaderProgram);
	}

	private bindFramebuffers() {
		// Render result to screen or to crt framebuffer if doing crt effect after this.
		if (this.outputBuffer == undefined) {
			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); // Render directly to screen
		} else {
			this.outputBuffer.bind(gl.DRAW_FRAMEBUFFER);
		}
	}

	draw(scene: Scene, camera: Camera) {
		// this.bindFramebuffers();
		volumetricGodRayShaderProgram.use();
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		camera.bindViewProjMatrix(
			volumetricGodRayShaderProgram.getUniformLocation("viewProjMatrix")[0]
		);
		gl.uniform3fv(
			volumetricGodRayShaderProgram.getUniformLocation("cameraPos")[0],
			camera.getPosition()
		);
		gl.uniform1f(
			volumetricGodRayShaderProgram.getUniformLocation("fov")[0],
			camera.getFov()
		);
		// Point lights
		gl.uniform1i(
			volumetricGodRayShaderProgram.getUniformLocation("nrOfPointLights")[0],
			scene.pointLights.length
		);

		// Bind pointLights, with counter as depthMapIndex
		let counter = 0;
		for (let i = 0; i < scene.pointLights.length; i++) {
			scene.pointLights[i].bind(i, counter, volumetricGodRayShaderProgram);
			if (scene.pointLights[i].castShadow) {
				counter++;
			}
		}

		// Then bind the point light depth maps
		counter = 0;
		for (const pointLight of scene.pointLights) {
			if (counter >= pointShadowsToAllocate) {
				break;
			}
			if (pointLight.castShadow) {
				pointLight.pointShadowDepthMap.bind(counter++);
			}
		}

		this.godRayPlanes.draw();
		gl.disable(gl.BLEND);
	}
}
