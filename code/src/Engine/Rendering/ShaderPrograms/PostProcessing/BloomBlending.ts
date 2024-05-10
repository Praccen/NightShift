import ShaderProgram from "../ShaderProgram";
import { screenQuadVertexSrc } from "../ScreenQuadShaderProgram";
import { gl } from "../../../../main";

const bloomBlendingFragmentSrc: string = `#version 300 es
precision highp float;

out vec4 fragColor;
  
in vec2 texCoords;

uniform sampler2D scene;
uniform sampler2D bloomBlur0;
uniform sampler2D bloomBlur1;
uniform sampler2D bloomBlur2;
uniform sampler2D bloomBlur3;
uniform sampler2D bloomBlur4;

void main()
{
    // const float gamma = 2.2;
    // const float exposure = 1.0;
    // vec3 hdrColor = texture(scene, texCoords).rgb;      
    // vec3 bloomColor = texture(bloomBlur, texCoords).rgb;
    // hdrColor += bloomColor; // additive blending
    // // tone mapping
    // vec3 result = vec3(1.0) - exp(-hdrColor * exposure);
    // // also gamma correct while we're at it       
    // result = pow(result, vec3(1.0 / gamma));
    // fragColor = vec4(result, 1.0);

    vec3 result = texture(scene, texCoords).rgb;
	
	vec3 bloomColor = vec3(0.0, 0.0, 0.0);
	bloomColor += (texture(bloomBlur0, texCoords).rgb * 0.3);
	bloomColor += (texture(bloomBlur1, texCoords).rgb * 0.25);
	bloomColor += (texture(bloomBlur2, texCoords).rgb * 0.2);
	bloomColor += (texture(bloomBlur3, texCoords).rgb * 0.15);
	bloomColor += (texture(bloomBlur4, texCoords).rgb * 0.1);

    result += bloomColor; // additive blending
    fragColor = vec4(result, 1.0);
}`;

class BloomBlending extends ShaderProgram {
	constructor() {
		super("BloomBlending", screenQuadVertexSrc, bloomBlendingFragmentSrc);

		this.use();

		this.setUniformLocation("scene");
		this.setUniformLocation("bloomBlur0");
		this.setUniformLocation("bloomBlur1");
		this.setUniformLocation("bloomBlur2");
		this.setUniformLocation("bloomBlur3");
		this.setUniformLocation("bloomBlur4");

		gl.uniform1i(this.getUniformLocation("scene")[0], 0);
		gl.uniform1i(this.getUniformLocation("bloomBlur0")[0], 1);
		gl.uniform1i(this.getUniformLocation("bloomBlur1")[0], 2);
		gl.uniform1i(this.getUniformLocation("bloomBlur2")[0], 3);
		gl.uniform1i(this.getUniformLocation("bloomBlur3")[0], 4);
		gl.uniform1i(this.getUniformLocation("bloomBlur4")[0], 5);

		this.setUniformLocation("horizontal");
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

export let bloomBlending = null;

export let createBloomBlending = function () {
	bloomBlending = new BloomBlending();
};
