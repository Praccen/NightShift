import { gl } from "../../../../main";
import ShaderProgram from "../ShaderProgram";

const pointShadowVertexShaderSrc: string = `#version 300 es
// If inputs change, also update PointShadowPass::setupVertexAttributePointers to match
layout (location = 0) in vec3 inPosition;
layout (location = 1) in vec3 inNormal;
layout (location = 2) in vec2 inTexCoords;

uniform mat4 lightSpaceMatrix;
uniform mat4 modelMatrix;
uniform mat4 textureMatrix;

out vec2 texCoords;
out vec3 fragPos;

void main()
{
    gl_Position = lightSpaceMatrix * modelMatrix * vec4(inPosition, 1.0);
    fragPos = vec3(modelMatrix * vec4(inPosition, 1.0));
	texCoords = vec2(textureMatrix * vec4(inTexCoords, 0.0, 1.0));
}`;

const pointShadowFragmentShaderSrc: string = `#version 300 es
precision highp float;

in vec2 texCoords;
in vec3 fragPos;

uniform sampler2D diffuse;
uniform vec3 cameraPos;

mat4 thresholdMatrix = mat4(
	1.0, 9.0, 3.0, 11.0,
	13.0, 5.0, 15.0, 7.0,
	4.0, 12.0, 2.0, 10.0,
	16.0, 8.0, 14.0, 6.0
);


const float far_plane = 100.0;

void main()
{
    float opacity = texture(diffuse, texCoords).a;

	float threshold = thresholdMatrix[int(floor(mod(gl_FragCoord.x, 4.0)))][int(floor(mod(gl_FragCoord.y, 4.0)))] / 17.0;
    if (threshold >= opacity) {
        discard;
    }

    // get distance between fragment and light source
    float lightDistance = length(fragPos - cameraPos);
    
    // map to [0;1] range by dividing by far_plane
    lightDistance = lightDistance / far_plane;
    
    // write this as modified depth
    gl_FragDepth = lightDistance;
}`;

class PointShadowPass extends ShaderProgram {
	constructor() {
		super("PointShadowPass", pointShadowVertexShaderSrc, pointShadowFragmentShaderSrc);

		this.use();

		this.setUniformLocation("lightSpaceMatrix");
		this.setUniformLocation("modelMatrix");
		this.setUniformLocation("textureMatrix");
		this.setUniformLocation("cameraPos");
	}

	setupVertexAttributePointers(): void {
		// Change if input layout changes in shaders
		const stride = 8 * 4;
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * 4);
		gl.enableVertexAttribArray(1);

		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 6 * 4);
		gl.enableVertexAttribArray(2);
	}
}

export let pointShadowPass = null;

export let createPointShadowPass = function () {
	pointShadowPass = new PointShadowPass();
};
