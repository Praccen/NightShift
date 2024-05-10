import ShaderProgram from "../ShaderProgram";
import { screenQuadVertexSrc } from "../ScreenQuadShaderProgram";
import { gl } from "../../../../main";

export const pointLightsToAllocate: number = 8;
export let pointShadowsToAllocate: number = 2;

let lightingFragmentShaderSrc: string;

class LightingPass extends ShaderProgram {
	constructor() {
		super("LightingPass", screenQuadVertexSrc, lightingFragmentShaderSrc);

		this.use();

		this.setUniformLocation("gPosition");
		this.setUniformLocation("gNormal");
		this.setUniformLocation("gColourSpec");
		this.setUniformLocation("gEmission");
		this.setUniformLocation("depthMap");

		gl.uniform1i(this.getUniformLocation("gPosition")[0], 0);
		gl.uniform1i(this.getUniformLocation("gNormal")[0], 1);
		gl.uniform1i(this.getUniformLocation("gColourSpec")[0], 2);
		gl.uniform1i(this.getUniformLocation("gEmission")[0], 3);
		gl.uniform1i(this.getUniformLocation("depthMap")[0], 4);

		for (let i = 0; i < pointShadowsToAllocate; i++) {
			this.setUniformLocation("pointDepthMaps[" + i + "]");
			gl.uniform1i(
				this.getUniformLocation("pointDepthMaps[" + i + "]")[0],
				5 + i
			);
		}

		for (let i = 0; i < pointLightsToAllocate; i++) {
			this.setUniformLocation("pointLights[" + i + "].position");
			this.setUniformLocation("pointLights[" + i + "].colour");

			this.setUniformLocation("pointLights[" + i + "].constant");
			this.setUniformLocation("pointLights[" + i + "].linear");
			this.setUniformLocation("pointLights[" + i + "].quadratic");

			this.setUniformLocation("pointLights[" + i + "].pointDepthMapIndex");
		}

		this.setUniformLocation("directionalLight.direction");
		this.setUniformLocation("directionalLight.colour");
		this.setUniformLocation("directionalLight.ambientMultiplier");
		this.setUniformLocation("nrOfPointLights");
		this.setUniformLocation("camPos");
		this.setUniformLocation("lightSpaceMatrix");
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

export let lightingPass = null;

export let createLightingPass = function () {
	pointShadowsToAllocate = Math.min(
		pointShadowsToAllocate,
		gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - 5
	);

	lightingFragmentShaderSrc =
		`#version 300 es
precision highp float;

#define NR_POINT_LIGHTS ` +
		pointLightsToAllocate +
		`
#define NR_POINT_SHADOWS ` +
		pointShadowsToAllocate +
		`

in vec2 texCoords;

layout (location = 0) out vec4 final_colour;
layout (location = 1) out float FragOpacity;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gColourSpec;
uniform sampler2D gEmission;
uniform sampler2D depthMap;
uniform samplerCube pointDepthMaps[NR_POINT_SHADOWS];

struct PointLight {
	vec3 position;
	vec3 colour;

	float constant;
	float linear;
	float quadratic;

	int pointDepthMapIndex;
};

struct DirectionalLight {
	vec3 direction;
	vec3 colour;
	float ambientMultiplier;
};

uniform DirectionalLight directionalLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform int nrOfPointLights;
uniform vec3 camPos; //Used for specular lighting
uniform mat4 lightSpaceMatrix; // Used for shadow fragment position

vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 cameraDir, vec3 diffuse, float specular, float shininess, vec4 lightSpaceFragPos);
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 cameraDir, vec3 diffuse, float specular, float shininess);
float CalcShadow(vec4 lightSpaceFragPos, vec3 normal);
float CalcPointShadow(vec3 fragPos, PointLight light);

void main() {
	// Discard fragment if normal alpha is 0
	vec4 fragNormalWithAlpha = texture(gNormal, texCoords);
	if (fragNormalWithAlpha.a <= 0.0001) {
		discard;
	}
	
	vec3 fragPos = texture(gPosition, texCoords).rgb;
	vec3 fragNormal = fragNormalWithAlpha.rgb;
	float shininess = 32.0f;
	vec3 diffuse = texture(gColourSpec, texCoords).rgb;
	float specular = texture(gColourSpec, texCoords).a;
	vec3 emission = texture(gEmission, texCoords).rgb;
	vec4 lightSpaceFragPos = (lightSpaceMatrix * vec4(fragPos, 1.0f));
	
	vec3 cameraDir = normalize(camPos - fragPos); //Direction vector from fragment to camera
	
	// vec3 result = fragNormal;
	// vec3 result = diffuse;
	// vec3 result = vec3(specular, specular, specular);
    vec3 result = vec3(0.0f);
	result += CalcDirectionalLight(directionalLight, fragNormal, cameraDir, diffuse, specular, shininess, lightSpaceFragPos);

	for (int i = 0; i < nrOfPointLights; i++) {
		result += CalcPointLight(pointLights[i], fragNormal, fragPos, cameraDir, diffuse, specular, shininess);
	}

	final_colour = vec4(result + emission, 1.0f); // Set colour of fragment. Since we use screen door transparency, do not use alpha value
	FragOpacity = 0.0;
}

// Calculates the colour when using a directional light
vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 cameraDir, vec3 diffuse, float specular, float shininess, vec4 lightSpaceFragPos) {
	vec3 lightDir = normalize(-light.direction); //light direction from the fragment position

	// Diffuse shading
	float diff = max(dot(normal, lightDir), 0.0);
	float oppositeDiff = min(dot(normal, lightDir), 0.0);
	oppositeDiff += 1.0;
	oppositeDiff *= 0.2;

	// Specular shading
	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(cameraDir, reflectDir), 0.0), shininess);

	// Combine results	
	vec3 ambient = diffuse * light.ambientMultiplier; //Ambient lighting
	vec3 finalDiffuse = light.colour * diff * diffuse;
	vec3 finalSpecular = light.colour * spec * specular;
	
	float shadow = CalcShadow(lightSpaceFragPos, normal);
	vec3 lighting = (ambient + (1.1f - shadow) * (finalDiffuse + finalSpecular));
	lighting += oppositeDiff * ambient;
	return lighting;
}

float CalcShadow(vec4 lightSpaceFragPos, vec3 normal) {
	// perform perspective divide
    vec3 projCoords = lightSpaceFragPos.xyz / lightSpaceFragPos.w;

    // transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;

	if (projCoords.z > 1.0) {
		return 0.0;
	}

    // get closest depth value from light's perspective (using [0,1] range fragPosLight as coords)
    float closestDepth = texture(depthMap, projCoords.xy).r; 

    // get depth of current fragment from light's perspective
    float currentDepth = projCoords.z;

    // check whether current frag pos is in shadow
	// float bias = 0.001;
	float bias = max(0.005 * (1.0 - dot(normal, directionalLight.direction)), 0.005);
	// float bias = 0.0;
	
	float shadow = 0.0;
	ivec2 textureSize = textureSize(depthMap, 0);
	vec2 texelSize = vec2(1.0 / float(textureSize.x), 1.0 / float(textureSize.y));
	for(int x = -1; x <= 1; ++x)
	{
		for(int y = -1; y <= 1; ++y)
		{
			float pcfDepth = texture(depthMap, projCoords.xy + vec2(x, y) * texelSize).r; 
			shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;
		}    
	}
	shadow = shadow / 9.0;

    return shadow;
}

// Calculates the colour when using a point light.
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 cameraDir, vec3 diffuse, float specular, float shininess) {
	if (light.pointDepthMapIndex >= 0 && light.pointDepthMapIndex < NR_POINT_SHADOWS && CalcPointShadow(fragPos, light) == 1.0) {
		return vec3(0.0, 0.0, 0.0);
	} 

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
	return finalDiffuse + finalSpecular;
}

const float far_plane = 100.0;

float CalcPointShadow(vec3 fragPos, PointLight light) {
	// get vector between fragment position and light position
    vec3 fragToLight = fragPos - light.position;
	fragToLight.y *= -1.0;
	fragToLight.z *= -1.0;
    // use the light to fragment vector to sample from the depth map
    float closestDepth = 1.0;`;
	// Below is ugly, but I have to unroll the loop to be able to acces the pointDepthMaps array with a compile time index, as run-time index is not allowed to access a sampler
	for (let i = 0; i < pointShadowsToAllocate; i++) {
		if (i == 0) {
			lightingFragmentShaderSrc +=
				`
	if (light.pointDepthMapIndex == ` +
				i +
				`) {
		closestDepth = texture(pointDepthMaps[` +
				i +
				`], fragToLight).r;
	}
	`;
		} else {
			lightingFragmentShaderSrc +=
				`
	else if (light.pointDepthMapIndex == ` +
				i +
				`) {
		closestDepth = texture(pointDepthMaps[` +
				i +
				`], fragToLight).r;
	}
	`;
		}
	}

	lightingFragmentShaderSrc += `
    // it is currently in linear range between [0,1]. Re-transform back to original value
    closestDepth *= far_plane;
    // now get current linear depth as the length between the fragment and light position
    float currentDepth = length(fragToLight);
    // now test for shadows
    float bias = 0.0;
    float shadow = currentDepth -  bias > closestDepth ? 1.0 : 0.0;

    return shadow;
}
`;

	lightingPass = new LightingPass();
};
