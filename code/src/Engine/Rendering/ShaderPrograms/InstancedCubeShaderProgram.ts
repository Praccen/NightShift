import { gl } from "../../../main";
import ShaderProgram from "./ShaderProgram";

const cubeVertexShaderSrc: string = `#version 300 es
layout (location = 0) in vec2 inVertexPosition;
layout (location = 1) in vec2 inTexCoords;
layout (location = 1) in vec3 inNormal;

// Instanced attributes starts here
layout (location = 3) in mat4 modelMatrix;

uniform mat4 viewProjMatrix;

out vec3 fragPos;
out vec3 fragNormal;
out vec2 texCoords;

void main() {
    vec4 worldPos = modelMatrix * vec4(inPosition, 1.0);
    texCoords = vec2(textureMatrix * vec4(inTexCoords, 0.0, 1.0));

    // Calculate normal matrix, should be done on CPU but I can't be bothered with implementing inverse of a matrix and don't want to find a good lib atm. Have found a lib now TODO: Move this to CPU
    mat3 normalMatrix = mat3(modelMatrix);
    normalMatrix = inverse(normalMatrix);
    normalMatrix = transpose(normalMatrix);

    fragNormal = normalize(normalMatrix * inNormal);
    fragPos = worldPos.xyz;

    gl_Position = viewProjMatrix * worldPos;
}`;
const cubeFragmentShaderSrc: string = `#version 300 es
precision highp float;

in vec3 fragPos;
in vec3 fragNormal;
in vec2 texCoords;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gColourSpec;
layout (location = 3) out vec4 gEmission;

struct Material {
	sampler2D diffuse;
	sampler2D specular;
	sampler2D emission;
};

uniform Material material;
uniform vec3 emissionColor;

mat4 thresholdMatrix = mat4(
	1.0, 9.0, 3.0, 11.0,
	13.0, 5.0, 15.0, 7.0,
	4.0, 12.0, 2.0, 10.0,
	16.0, 8.0, 14.0, 6.0
	);

void main() {
	float opacity = texture(material.diffuse, texCoords).a;

	float threshold = thresholdMatrix[int(floor(mod(gl_FragCoord.x, 4.0)))][int(floor(mod(gl_FragCoord.y, 4.0)))] / 17.0;
    if (threshold >= opacity) {
        discard;
    }

	vec3 emissionMapValues = texture(material.emission, texCoords).rgb;
	float emissionValue = (emissionMapValues.r + emissionMapValues.g + emissionMapValues.b) / 3.0;

	gColourSpec.rgb = texture(material.diffuse, texCoords).rgb;
	if ((emissionColor.r > 0.0 || emissionColor.g > 0.0 || emissionColor.b > 0.0) && emissionValue > 0.0) {
		gEmission.r = emissionColor.r * emissionMapValues.r;
		gEmission.g = emissionColor.g * emissionMapValues.g;
		gEmission.b = emissionColor.b * emissionMapValues.b;
	}
	else if (emissionValue > 0.0) {
		gEmission.rgb = emissionMapValues;
	}
    gColourSpec.a = texture(material.specular, texCoords).r;

	gPosition.rgb = fragPos;
	gNormal = vec4(fragNormal, 1.0);
}`;
class InstancedCubeShaderProgram extends ShaderProgram {
	constructor() {
		super("InstancedCubeShaderProgram", cubeVertexShaderSrc, cubeFragmentShaderSrc, false);

		this.use();

		this.setUniformLocation("texture0");
		gl.uniform1i(this.getUniformLocation("texture0")[0], 0);

		this.setUniformLocation("viewProjMatrix");
		this.setUniformLocation("cameraPos");
	}

	setupVertexAttributePointers(): void {
		// Change if input layout changes in shaders
		const stride = 4 * 4;
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * 4);
		gl.enableVertexAttribArray(1);
	}

	setupInstancedVertexAttributePointers(): void {
		const stride = 11 * 4;
		gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(2);
		gl.vertexAttribDivisor(2, 1);

		gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 3 * 4);
		gl.enableVertexAttribArray(3);
		gl.vertexAttribDivisor(3, 1);

		gl.vertexAttribPointer(4, 3, gl.FLOAT, false, stride, 4 * 4);
		gl.enableVertexAttribArray(4);
		gl.vertexAttribDivisor(4, 1);

		gl.vertexAttribPointer(5, 1, gl.FLOAT, false, stride, 7 * 4);
		gl.enableVertexAttribArray(5);
		gl.vertexAttribDivisor(5, 1);

		gl.vertexAttribPointer(6, 3, gl.FLOAT, false, stride, 8 * 4);
		gl.enableVertexAttribArray(6);
		gl.vertexAttribDivisor(6, 1);
	}
}
