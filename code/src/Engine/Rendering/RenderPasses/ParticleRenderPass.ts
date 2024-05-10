import { applicationStartTime, gl, windowInfo } from "../../../main";
import Camera from "../../Objects/Camera";
import Scene from "../Scene";
import { particleShaderProgram } from "../ShaderPrograms/ParticleShaderProgram";
import Framebuffer from "../Framebuffers/Framebuffer";
import Texture from "../Textures/Texture";
import ScreenQuad from "../../Objects/GraphicsObjects/ScreenQuad";
import { screenQuadShaderProgram } from "../ShaderPrograms/ScreenQuadShaderProgram";
import { blurTransparency } from "../ShaderPrograms/PostProcessing/BlurTransparency";

export default class ParticleRenderPass {
	outputBuffer: Framebuffer;

	private textures: Texture[];

	private screenQuad: ScreenQuad;
	constructor(inputTextures: Texture[]) {
		this.outputBuffer = null;
		this.textures = inputTextures;

		this.screenQuad = new ScreenQuad(screenQuadShaderProgram, inputTextures);
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
		gl.clearBufferfv(gl.COLOR, 1, [0.0, 0.0, 0.0, 1.0]);
		if (scene.particleSpawners.length > 0) {
			// only do this if there are any particle spawners
			particleShaderProgram.use();
			camera.bindViewProjMatrix(
				particleShaderProgram.getUniformLocation("viewProjMatrix")[0]
			);
			gl.uniform3fv(
				particleShaderProgram.getUniformLocation("cameraPos")[0],
				camera.getPosition()
			);
			gl.uniform1f(
				particleShaderProgram.getUniformLocation("currentTime")[0],
				(Date.now() - applicationStartTime) * 0.001
			);
			for (const particleSpawner of scene.particleSpawners.values()) {
				particleSpawner.draw();
			}
		}

		// this.bindFramebuffers();
		// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

		// // Blurred particles
		// blurTransparency.use();
		// this.screenQuad.draw(true);

		// Sharp particles
		// screenQuadShaderProgram.use();
		// this.textures[0].bind(0);
		// this.screenQuad.draw(false);
	}
}
