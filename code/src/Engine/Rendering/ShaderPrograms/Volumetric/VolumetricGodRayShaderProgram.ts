import { gl } from "../../../../main";
import { pointLightsToAllocate, pointShadowsToAllocate } from "../DeferredRendering/LightingPass";
import ShaderProgram from "../ShaderProgram";

const volumetricGodRayVertexShaderSrc: string = `#version 300 es

layout (location = 0) in vec2 inVertexPosition;

uniform mat4 viewProjMatrix;
uniform vec3 cameraPos;
uniform float fogMaxDistance;
uniform float numPlanes;
uniform float fov;

out vec3 fragPos;
flat out float numberPlanes;
flat out float fogMD;
flat out int instanceID;
flat out vec3 camPos;

void main() {
	float recalculatedMaxDepth = fogMaxDistance * cos(fov/2.0); // Get the length along hypothenuse when closest is fogMaxDistance and angle is fov/2
	float currDepth = (recalculatedMaxDepth - (recalculatedMaxDepth / numPlanes) * float(gl_InstanceID));
	currDepth = (1.0/recalculatedMaxDepth) * pow(currDepth, 2.0);
	
	vec4 clipSpacePos = inverse(viewProjMatrix) * vec4(inVertexPosition.xy, 1.0, 1.0);
	vec3 worldPos = vec3(clipSpacePos.xyz / clipSpacePos.w);
	worldPos = cameraPos + normalize(worldPos - cameraPos) * currDepth;

	numberPlanes = numPlanes;
	fogMD = fogMaxDistance;
	instanceID = gl_InstanceID;
	camPos = cameraPos;
	
    fragPos = worldPos;
    gl_Position = viewProjMatrix * vec4(worldPos, 1.0);
}`;

let volumetricGodRayFragmentShaderSrc: string;

class VolumetricGodRaysShaderProgram extends ShaderProgram {
	constructor() {
		super(
			"VolumetricGodRaysShaderProgram",
			volumetricGodRayVertexShaderSrc,
			volumetricGodRayFragmentShaderSrc,
			false
		);

		this.use();

		this.setUniformLocation("viewProjMatrix");
		this.setUniformLocation("cameraPos");
		this.setUniformLocation("fogMaxDistance");
		this.setUniformLocation("numPlanes");
		this.setUniformLocation("fov");
		this.setUniformLocation("depthMap");

		gl.uniform1i(this.getUniformLocation("depthMap")[0], 0);
		

		this.setUniformLocation("nrOfPointLights");

		for (let i = 0; i < pointShadowsToAllocate; i++) {
			this.setUniformLocation("pointDepthMaps[" + i + "]");
			gl.uniform1i(this.getUniformLocation("pointDepthMaps[" + i + "]")[0], i + 1);
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
		this.setUniformLocation("lightSpaceMatrix");
	}

	setupVertexAttributePointers(): void {
		// Change if input layout changes in shaders
		const stride = 2 * 4;
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(0);
	}
}

export let volumetricGodRayShaderProgram: VolumetricGodRaysShaderProgram = null;

export let createVolumetricGodRayShaderProgram = function () {
	volumetricGodRayFragmentShaderSrc =
		`#version 300 es
precision highp float;

#define NR_POINT_LIGHTS ` +
		pointLightsToAllocate +
		`
#define NR_POINT_SHADOWS ` +
		pointShadowsToAllocate +
		`
in vec3 fragPos;
flat in float numberPlanes;
flat in float fogMD;
flat in int instanceID;
flat in vec3 camPos;

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
uniform mat4 lightSpaceMatrix;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform int nrOfPointLights;

out vec4 FragColor;
const float far_plane = 100.0;

float CalcPointShadow(PointLight light, vec3 fragmentPos) {
	// get vector between fragment position and light position
    vec3 fragToLight = fragmentPos - light.position;
	fragToLight.y *= -1.0;
	fragToLight.z *= -1.0;
    // use the light to fragment vector to sample from the depth map
    float closestDepth = 1.0;`;
	// Below is ugly, but I have to unroll the loop to be able to acces the pointDepthMaps array with a compile time index, as run-time index is not allowed to access a sampler
	for (let i = 0; i < pointShadowsToAllocate; i++) {
		if (i == 0) {
			volumetricGodRayFragmentShaderSrc +=
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
			volumetricGodRayFragmentShaderSrc +=
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

	volumetricGodRayFragmentShaderSrc += `
    // it is currently in linear range between [0,1]. Re-transform back to original value
    closestDepth *= far_plane;
    // now get current linear depth as the length between the fragment and light position
    float currentDepth = length(fragToLight);
    // now test for shadows
    float shadow = currentDepth > closestDepth ? 1.0 : 0.0;

    return shadow;
}

// Calculates the colour when using a point light.
vec4 CalcPointLight(PointLight light, vec3 fragmentPos) {
	if (light.pointDepthMapIndex >= 0 && light.pointDepthMapIndex < NR_POINT_SHADOWS && CalcPointShadow(light, fragmentPos) == 0.0) {
		float distance = max(length(light.position - fragmentPos), 20.0);
		float attenuation = 1.0f / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

		// attenuation = attenuation * abs(((numberPlanes / 2.0) - float(instanceID))) * 0.05;

		return vec4(light.colour * attenuation, 0.03);
	} 
	return vec4(0.0, 0.0, 0.0, 0.0);
}

float CalcShadow(vec4 lightSpaceFragPos) {
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
	float shadow = 0.0;
	ivec2 textureSize = textureSize(depthMap, 0);
	vec2 texelSize = vec2(1.0 / float(textureSize.x), 1.0 / float(textureSize.y));
	for(int x = -1; x <= 1; ++x)
	{
		for(int y = -1; y <= 1; ++y)
		{
			float pcfDepth = texture(depthMap, projCoords.xy + vec2(x, y) * texelSize).r; 
			shadow += currentDepth > pcfDepth ? 1.0 : 0.0;
		}    
	}
	shadow = shadow / 9.0;

    return shadow;
}

vec4 CalcDirectionalLight(DirectionalLight light, vec4 lightSpaceFragPos) {
	float shadow = CalcShadow(lightSpaceFragPos);
	float strength = 0.015 * (1.0 - shadow);
	return vec4(light.colour, strength);
}

void main()
{
    vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
	int effectedCounter = 0;
	
	vec4 lightSpaceFragPos = (lightSpaceMatrix * vec4(fragPos, 1.0f));
	vec4 dirLightResult = CalcDirectionalLight(directionalLight, lightSpaceFragPos);
	if (dirLightResult.a > 0.0) {
		effectedCounter++;
		result += dirLightResult;
	}

	for (int i = 0; i < nrOfPointLights; i++) {
		vec4 lightResult = CalcPointLight(pointLights[i], fragPos);
		if (lightResult.a > 0.0) {
			effectedCounter++;
			result += lightResult;
		}
	}
	result.a /= float(effectedCounter);

    FragColor = result;
}
`;

	volumetricGodRayShaderProgram = new VolumetricGodRaysShaderProgram();
};
