import ShaderProgram from "../ShaderProgram";
import { screenQuadVertexSrc } from "../ScreenQuadShaderProgram";
import { gl } from "../../../../main";

const blurTransparencyFragmentSrc: string = `#version 300 es
precision highp float;

out vec4 fragColor;
  
in vec2 texCoords;

uniform sampler2D image;
uniform sampler2D mask;

void main()
{             
    vec2 texOffset = vec2(1.0 / float(textureSize(image, 0).x), 1.0 / float(textureSize(image, 0).y)); // gets size of single texel
    vec3 noBlurResult = texture(image, texCoords).rgb;
    int useBlur = 0;
    const int kernel = 3;

    vec3 weightsum = vec3(0);
    vec3 accumulation = vec3(0);

    for(int x = -kernel; x <= kernel; ++x)
    {
        for(int y = -kernel; y <= kernel; ++y)
        {
            vec2 coord = texCoords + vec2(texOffset.x * float(x), texOffset.y * float(y));

            if (texture(mask, coord).r > 0.0) {
                useBlur = 1;
            }

            accumulation += texture(image, coord).rgb;
            weightsum += 1.0;
        }
    }

    vec3 result;
    if (useBlur == 1) {
        result = accumulation / weightsum;
    } else {
        result = noBlurResult;
    }
    
    fragColor = vec4(result, 1.0);
}`;

class BlurTransparency extends ShaderProgram {
	constructor() {
		super("BlurTransparency", screenQuadVertexSrc, blurTransparencyFragmentSrc);

		this.use();

		this.setUniformLocation("image");
		this.setUniformLocation("mask");

		gl.uniform1i(this.getUniformLocation("image")[0], 0);
		gl.uniform1i(this.getUniformLocation("mask")[0], 1);
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

export let blurTransparency = null;

export let createBlurTransparency = function () {
	blurTransparency = new BlurTransparency();
};
