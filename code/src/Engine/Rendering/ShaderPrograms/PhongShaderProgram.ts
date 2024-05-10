import ShaderProgram from "./ShaderProgram";
import { pointLightsToAllocate } from "./DeferredRendering/LightingPass";
import { gl } from "../../../main";

const phongVertexShaderSrc: string = `#version 300 es
// If inputs change, also update PhongShaderProgram::setupVertexAttributePointers to match
layout (location = 0) in vec3 inPosition;
layout (location = 1) in vec3 inNormal;
layout (location = 2) in vec2 inTexCoords;

// If uniforms change, also update PhongShaderProgram to match
uniform mat4 modelMatrix;
uniform mat4 viewProjMatrix;
uniform mat4 textureMatrix;

out vec3 fragPos;
out vec3 fragNormal;
out vec2 texCoords;

void main() {
    vec4 worldPos = modelMatrix * vec4(inPosition, 1.0);
	texCoords = vec2(textureMatrix * vec4(inTexCoords, 0.0, 1.0));
	fragPos = worldPos.xyz;

	// Calculate normal matrix, should be done on CPU but I can't be bothered with implementing inverse of a matrix and don't want to find a good lib atm
	mat3 normalMatrix = mat3(modelMatrix);
	normalMatrix = inverse(normalMatrix);
	normalMatrix = transpose(normalMatrix);

	fragNormal = normalize(normalMatrix * inNormal);
	
    gl_Position = viewProjMatrix * worldPos;
}`;

// let pointLightsToAllocate: number = 100;

const phongFragmentShaderSrc: string =
	`#version 300 es
precision highp float;

in vec3 fragPos;
in vec3 fragNormal;
in vec2 texCoords;

out vec4 final_colour;

struct Material {
	sampler2D diffuse;
	sampler2D specular;
};

uniform Material material;

struct PointLight {
	vec3 position;
	vec3 colour;

	float constant;
	float linear;
	float quadratic;
};

struct DirectionalLight {
	vec3 direction;
	vec3 colour;
	float ambientMultiplier;
};

#define NR_POINT_LIGHTS ` +
	pointLightsToAllocate +
	`

uniform DirectionalLight directionalLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform int nrOfPointLights;
uniform vec3 camPos; //Used for specular lighting

vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 cameraDir, vec3 diffuse, float specular, float shininess);
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 cameraDir, vec3 diffuse, float specular, float shininess);

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

	vec3 result = vec3(0.0f, 0.0f, 0.0f);

	float shininess = 32.0f;
	vec3 diffuse = texture(material.diffuse, texCoords).xyz;
	float specular = texture(material.specular, texCoords).r;
	
	vec3 cameraDir = normalize(camPos - fragPos); //Direction vector from fragment to camera
	
	result += CalcDirectionalLight(directionalLight, fragNormal, cameraDir, diffuse, specular, shininess);
	
	for (int i = 0; i < nrOfPointLights; i++) {
		result += CalcPointLight(pointLights[i], fragNormal, fragPos, cameraDir, diffuse, specular, shininess);	
	}

	final_colour = vec4(result, 1.0f); // Set colour of fragment. Since we use screen door transparency, do not use alpha value
}

// Calculates the colour when using a directional light
vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 cameraDir, vec3 diffuse, float specular, float shininess) {
	vec3 ambient = diffuse * light.ambientMultiplier; //Ambient lighting
	vec3 lightDir = normalize(-light.direction); //light direction from the fragment position

	// Diffuse shading
	float diff = max(dot(normal, lightDir), 0.0);

	// Specular shading
	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(cameraDir, reflectDir), 0.0), shininess);

	// Combine results
	vec3 finalDiffuse = light.colour * diff * diffuse;
	vec3 finalSpecular = light.colour * spec * specular;
	
	vec3 lighting = (ambient + finalDiffuse + finalSpecular);
	return lighting;
}

// Calculates the colour when using a point light.
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 cameraDir, vec3 diffuse, float specular, float shininess) {
	vec3 lighting;
	vec3 lightDir = normalize(light.position - fragPos); //light direction from the fragment position

	// Diffuse shading
	float diff = max(dot(normal, lightDir), 0.0);

	// Specular shading
	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(cameraDir, reflectDir), 0.0), shininess);

	// Attenuation
	float distance = length(light.position - fragPos);
	float attenuation = 1.0f / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
	
	// Combine results
	vec3 finalDiffuse = light.colour * diff * diffuse;
	vec3 finalSpecular = light.colour * spec * specular;
	finalDiffuse *= attenuation;
	finalSpecular *= attenuation;
	lighting = finalDiffuse + finalSpecular;
	//lighting = finalSpecular;
	return lighting;
}`;

class PhongShaderProgram extends ShaderProgram {
	constructor() {
		super("PhongShaderProgram", phongVertexShaderSrc, phongFragmentShaderSrc);

		this.use();

		this.setUniformLocation("modelMatrix");
		this.setUniformLocation("viewProjMatrix");
		this.setUniformLocation("textureMatrix");

		this.setUniformLocation("material.diffuse");
		this.setUniformLocation("material.specular");

		gl.uniform1i(this.getUniformLocation("material.diffuse")[0], 0);
		gl.uniform1i(this.getUniformLocation("material.specular")[0], 1);

		for (let i = 0; i < pointLightsToAllocate; i++) {
			this.setUniformLocation("pointLights[" + i + "].position");
			this.setUniformLocation("pointLights[" + i + "].colour");

			this.setUniformLocation("pointLights[" + i + "].constant");
			this.setUniformLocation("pointLights[" + i + "].linear");
			this.setUniformLocation("pointLights[" + i + "].quadratic");
		}

		this.setUniformLocation("directionalLight.direction");
		this.setUniformLocation("directionalLight.colour");
		this.setUniformLocation("directionalLight.ambientMultiplier");
		this.setUniformLocation("nrOfPointLights");
		this.setUniformLocation("camPos");
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

export let phongShaderProgram = null;

export let createPhongShaderProgram = function () {
	phongShaderProgram = new PhongShaderProgram();
};
