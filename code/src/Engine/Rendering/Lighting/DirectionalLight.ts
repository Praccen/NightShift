import { mat4, vec3 } from "gl-matrix";
import { gl } from "../../../main";
import ShaderProgram from "../ShaderPrograms/ShaderProgram";

export default class DirectionalLight {
	direction: vec3;
	colour: vec3;
	ambientMultiplier: number;

	lightProjectionBoxSideLength: number;

	private gl: WebGL2RenderingContext;
	private shaderProgram: ShaderProgram;

	constructor(gl: WebGL2RenderingContext, shaderProgram: ShaderProgram) {
		gl = gl;
		this.shaderProgram = shaderProgram;

		this.direction = vec3.fromValues(0.0, -1.0, -0.5);
		this.colour = vec3.fromValues(0.2, 0.2, 0.2);
		this.ambientMultiplier = 0.1;
		this.lightProjectionBoxSideLength = 60.0;
	}

	bind() {
		gl.uniform3fv(
			this.shaderProgram.getUniformLocation("directionalLight.direction")[0],
			vec3.normalize(this.direction, this.direction)
		);
		gl.uniform3fv(this.shaderProgram.getUniformLocation("directionalLight.colour")[0], this.colour);
		gl.uniform1f(
			this.shaderProgram.getUniformLocation("directionalLight.ambientMultiplier")[0],
			this.ambientMultiplier
		);
	}

	calcAndSendLightSpaceMatrix(
		focusPos: vec3,
		offset: number,
		uniformLocation: WebGLUniformLocation
	) {
		let cameraPos = vec3.clone(focusPos);
		let offsetVec = vec3.scale(
			vec3.create(),
			vec3.normalize(vec3.create(), this.direction),
			offset
		);
		let lightSpaceMatrix = mat4.ortho(
			mat4.create(),
			-this.lightProjectionBoxSideLength,
			this.lightProjectionBoxSideLength,
			-this.lightProjectionBoxSideLength,
			this.lightProjectionBoxSideLength,
			0.1,
			offset * 2.0
		); // Start by setting it to projection
		vec3.subtract(cameraPos, cameraPos, offsetVec);
		let lightView = mat4.lookAt(mat4.create(), cameraPos, focusPos, vec3.fromValues(0.0, 1.0, 0.0)); // This will make it impossible to have exactly straight down shadows, but I'm fine with that
		mat4.mul(lightSpaceMatrix, lightSpaceMatrix, lightView);
		gl.uniformMatrix4fv(uniformLocation, false, lightSpaceMatrix);
	}
}
