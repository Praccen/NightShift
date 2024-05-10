import { vec3 } from "gl-matrix";
import { gl } from "../../../main";
import ShaderProgram from "../ShaderPrograms/ShaderProgram";
import CubeMap from "../Textures/CubeMap";
import Framebuffer from "../Framebuffers/Framebuffer";

export default class PointLight {
	position: vec3;
	colour: vec3;

	constant: number;
	linear: number;
	quadratic: number;
	castShadow: boolean;
	// depthMapGenerated: boolean;
	// private radius: number; // TODO: implement light volumes

	pointShadowBuffer: Framebuffer;
	pointShadowDepthMap: CubeMap;

	constructor() {
		this.position = vec3.fromValues(0.0, 0.0, 0.0);
		this.colour = vec3.fromValues(1.0, 1.0, 1.0);

		this.constant = 1.0;
		this.linear = 0.07;
		this.quadratic = 0.017;
		this.castShadow = false;
		// this.depthMapGenerated = false;
		// this.radius = (-this.linear + Math.sqrt(this.linear * this.linear - 4.0 * this.quadratic * (this.constant - (256.0 / 5.0)))) / (2.0 * this.quadratic);

		this.pointShadowDepthMap = new CubeMap(false, gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT);
		this.pointShadowDepthMap.setTextureData(null, 1024, 1024);

		this.pointShadowBuffer = new Framebuffer(
            1024,
            1024,
            [],
            this.pointShadowDepthMap
        );
	}

	bind(lightIndex: number, depthMapIndex: number, shaderProgram: ShaderProgram) {
		let ul = shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].position"
		);
		if (ul[1]) {
			gl.uniform3fv(ul[0], this.position);
		}
		ul = shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].colour"
		);
		if (ul[1]) {
			gl.uniform3fv(ul[0], this.colour);
		}

		ul = shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].constant"
		);
		if (ul[1]) {
			gl.uniform1f(ul[0], this.constant);
		}
		ul = shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].linear"
		);
		if (ul[1]) {
			gl.uniform1f(ul[0], this.linear);
		}
		ul = shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].quadratic"
		);
		if (ul[1]) {
			gl.uniform1f(ul[0], this.quadratic);
		}

		ul = shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].pointDepthMapIndex"
		);
		if (ul[1]) {
			gl.uniform1i(ul[0], this.castShadow? depthMapIndex: -1);
		}
	}
}
