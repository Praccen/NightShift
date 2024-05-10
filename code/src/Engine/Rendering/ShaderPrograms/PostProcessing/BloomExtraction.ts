import ShaderProgram from "../ShaderProgram";
import { screenQuadVertexSrc } from "../ScreenQuadShaderProgram";
import { gl } from "../../../../main";

const bloomExtractionFragmentSrc: string = `#version 300 es
precision highp float;

in vec2 texCoords;

layout (location = 0) out vec4 normalShaded;
layout (location = 1) out vec4 brightOnly;

uniform sampler2D inputTexture;

void main() {
	normalShaded = texture(inputTexture, texCoords);
    
    // check whether fragment output is higher than threshold, if so output as brightness color
    float brightness = normalShaded.r + normalShaded.g + normalShaded.b;
    if(brightness > 1.0) {
        brightOnly = normalShaded;
    }
    else {
        brightOnly = vec4(0.0, 0.0, 0.0, 1.0);
    }
}`;

class BloomExtraction extends ShaderProgram {
	constructor() {
		super("BloomExtraction", screenQuadVertexSrc, bloomExtractionFragmentSrc);

		this.use();

		this.setUniformLocation("inputTexture");

		gl.uniform1i(this.getUniformLocation("inputTexture")[0], 0);
	}

	setupVertexAttributePointers(): void {
		// Change if input layout changes in shaders
		const stride = 4 * 4;
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * 4);
		gl.enableVertexAttribArray(1);
	}
}

export let bloomExtraction = null;

export let createBloomExtraction = function () {
	bloomExtraction = new BloomExtraction();
};
