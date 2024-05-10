import ShaderProgram from "../ShaderProgram";
import { screenQuadVertexSrc } from "../ScreenQuadShaderProgram";
import { gl } from "../../../../main";

const gaussianBlurFragmentSrc: string = `#version 300 es
precision highp float;

out vec4 fragColor;
  
in vec2 texCoords;

uniform sampler2D image;
  
uniform bool horizontal;
float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main()
{             
    vec2 texOffset = vec2(1.0 / float(textureSize(image, 0).x), 1.0 / float(textureSize(image, 0).y)); // gets size of single texel
    vec3 result = texture(image, texCoords).rgb * weight[0]; // current fragment's contribution
    if(horizontal)
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture(image, texCoords + vec2(texOffset.x * float(i), 0.0)).rgb * weight[i];
            result += texture(image, texCoords - vec2(texOffset.x * float(i), 0.0)).rgb * weight[i];
        }
    }
    else
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture(image, texCoords + vec2(0.0, texOffset.y * float(i))).rgb * weight[i];
            result += texture(image, texCoords - vec2(0.0, texOffset.y * float(i))).rgb * weight[i];
        }
    }
    fragColor = vec4(result, 1.0);
}`;

class GaussianBlur extends ShaderProgram {
	constructor() {
		super("GaussianBlur", screenQuadVertexSrc, gaussianBlurFragmentSrc);

		this.use();

		this.setUniformLocation("image");

		gl.uniform1i(this.getUniformLocation("image")[0], 0);

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

export let gaussianBlur = null;

export let createGaussianBlur = function () {
	gaussianBlur = new GaussianBlur();
};
