import { applicationStartTime, gl, windowInfo } from "../../../../main";
import Camera from "../../../Objects/Camera";
import Framebuffer from "../../Framebuffers/Framebuffer";
import { geometryPass } from "../../ShaderPrograms/DeferredRendering/GeometryPass";
import { grassShaderProgram } from "../../ShaderPrograms/GrassShaderProgram";
import Texture from "../../Textures/Texture";
import Scene from "../../Scene";
import { instancedCubeShaderProgram } from "../../ShaderPrograms/InstancedCubeShaderProgram";

export default class GeometryRenderPass {
	outputFramebuffer: Framebuffer;

	constructor() {
		this.outputFramebuffer = new Framebuffer(
			windowInfo.resolutionWidth,
			windowInfo.resolutionHeight,
			[
				new Texture(false, gl.RGBA32F, gl.RGBA, gl.FLOAT),
				new Texture(false, gl.RGBA32F, gl.RGBA, gl.FLOAT),
				new Texture(false),
				new Texture(false),
			],
			null
		);
	}

	setResolution(x: number, y: number) {
		this.outputFramebuffer.setProportions(x, y);
	}

	draw(scene: Scene, camera: Camera) {
		gl.viewport(0.0, 0.0, windowInfo.resolutionWidth, windowInfo.resolutionHeight);

		// Bind gbuffer and clear that with 0,0,0,0 (the alpha = 0 is important to be able to identify fragments in the lighting pass that have not been written with geometry)
		this.outputFramebuffer.bind(gl.FRAMEBUFFER);
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

		geometryPass.use();

		camera.bindViewProjMatrix(geometryPass.getUniformLocation("viewProjMatrix")[0]);

		scene.renderScene(geometryPass, true);

		grassShaderProgram.use();
		camera.bindViewProjMatrix(grassShaderProgram.getUniformLocation("viewProjMatrix")[0]);

		gl.uniform3fv(grassShaderProgram.getUniformLocation("cameraPos")[0], camera.getPosition());
		gl.uniform1f(
			grassShaderProgram.getUniformLocation("currentTime")[0],
			(Date.now() - applicationStartTime) * 0.001
		);

		scene.renderGrass(instancedCubeShaderProgram, true);

		instancedCubeShaderProgram.use();
		camera.bindViewProjMatrix(instancedCubeShaderProgram.getUniformLocation("viewProjMatrix")[0]);
		scene.renderInstanced(instancedCubeShaderProgram, true);
	}
}
