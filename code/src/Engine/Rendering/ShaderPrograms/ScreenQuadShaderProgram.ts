import { gl } from "../../../main";
import ShaderProgram from "./ShaderProgram";

export const screenQuadVertexSrc: string = `#version 300 es

layout (location = 0) in vec2 inPos;
layout (location = 1) in vec2 inTexCoords;

out vec2 texCoords;

void main()
{
    texCoords = inTexCoords;
    gl_Position = vec4(inPos, 0.0, 1.0); 
}  
`;

const screenQuadFragmentSrc: string = `#version 300 es
precision highp float;

out vec4 FragColor;
in vec2 texCoords;

uniform sampler2D screenTexture;

void main() {
	// Linearization of depth texture.
	// float depth = texture(screenTexture, texCoords).r;
	// depth = (2.0 * 0.01 ) / (100.0 + 0.01 - depth*(100.0 - 0.01));
	// FragColor = vec4(depth, depth, depth, 1.0);
    FragColor = texture(screenTexture, texCoords).rgba;
}
`;

class ScreenQuadShaderProgram extends ShaderProgram {
	constructor() {
		super("ScreenQuadShaderProgram", screenQuadVertexSrc, screenQuadFragmentSrc);

		this.setUniformLocation("screenTexture");

		gl.uniform1i(this.uniformBindings["screenTexture"], 0);
	}

	setupVertexAttributePointers() {
		// Change if input layout changes in shaders
		const stride = 4 * 4;
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * 4);
		gl.enableVertexAttribArray(1);
	}
}

export let screenQuadShaderProgram = null;

export let createScreenQuadShaderProgram = function () {
	screenQuadShaderProgram = new ScreenQuadShaderProgram();
};
