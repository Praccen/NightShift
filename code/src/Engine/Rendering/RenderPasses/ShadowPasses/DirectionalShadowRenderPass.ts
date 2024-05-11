import { applicationStartTime, gl } from "../../../../main";
import Framebuffer from "../../Framebuffers/Framebuffer";
import { grassShadowPass } from "../../ShaderPrograms/ShadowMapping/GrassShadowPass";
import { shadowPass } from "../../ShaderPrograms/ShadowMapping/ShadowPass";
import Texture from "../../Textures/Texture";
import Scene from "../../Scene";
import Camera from "../../../Objects/Camera";
import { vec3 } from "gl-matrix";

export default class DirectionalShadowRenderPass {
	// ---- Shadow mapping ----
	private shadowResolution: number;
	private shadowOffset: number;
	shadowBuffer: Framebuffer;
	// ------------------------

	constructor() {
		// ---- Shadow mapping ----
		this.shadowResolution = 4096;
		this.shadowOffset = 20.0;
		this.shadowBuffer = new Framebuffer(
			this.shadowResolution,
			this.shadowResolution,
			[],
			new Texture(false, gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT)
		);
		// ------------------------
	}

	setShadowMappingResolution(res: number) {
		this.shadowResolution = res;
		this.shadowBuffer.setProportions(res, res);
	}

	draw(scene: Scene, camera: Camera) {
		this.shadowBuffer.bind(gl.FRAMEBUFFER);

		gl.enable(gl.DEPTH_TEST);

		// ---- Shadow pass ----
		shadowPass.use();
		gl.viewport(0, 0, this.shadowResolution, this.shadowResolution);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// gl.enable(gl.CULL_FACE);
		// gl.cullFace(gl.FRONT);

		//Set uniforms
		scene
			.getDirectionalLight()
			.calcAndSendLightSpaceMatrix(
				vec3.clone(camera.getPosition()),
				this.shadowOffset,
				shadowPass.getUniformLocation("lightSpaceMatrix")[0]
			);

		//Render shadow pass
		scene.renderScene(shadowPass, false);

		// Grass
		grassShadowPass.use();
		//Set uniforms
		scene
			.getDirectionalLight()
			.calcAndSendLightSpaceMatrix(
				vec3.clone(camera.getPosition()),
				this.shadowOffset,
				grassShadowPass.getUniformLocation("lightSpaceMatrix")[0]
			);

		gl.uniform3fv(grassShadowPass.getUniformLocation("cameraPos")[0], camera.getPosition());
		gl.uniform1f(
			grassShadowPass.getUniformLocation("currentTime")[0],
			(Date.now() - applicationStartTime) * 0.001
		);

		scene.renderGrass(grassShadowPass, false);

		// gl.disable(gl.CULL_FACE);
		// ---------------------
	}
}
