import { mat3, mat4, vec3 } from "gl-matrix";
import { gl } from "../../main";
import Texture from "../Rendering/Textures/Texture";
import GraphicsObject from "./GraphicsObjects/GraphicsObject";

export default class GraphicsBundle {
	modelMatrix: mat4;
	textureMatrix: mat4;
	normalMatrix: mat3;

	diffuse: Texture;
	specular: Texture;
	emission: Texture;

	emissionColor: vec3;

	graphicsObject: GraphicsObject;
	enabled: boolean;

	constructor(
		diffuse: Texture,
		specular: Texture,
		graphicsObject: GraphicsObject,
		emissionMap?: Texture
	) {
		this.diffuse = diffuse;
		this.specular = specular;

		if (emissionMap != undefined) {
			this.emission = emissionMap;
		} else {
			this.emission = new Texture();
			this.emission.setTextureData(new Uint8Array([0.0, 0.0, 0.0, 0.0]), 1, 1);
		}
		this.emissionColor = vec3.fromValues(0.0, 0.0, 0.0);

		this.modelMatrix = mat4.create();
		this.textureMatrix = mat4.create();
		this.normalMatrix = mat3.create();

		this.graphicsObject = graphicsObject;
		this.enabled = true;
	}

	draw(bindSpecialTextures: boolean = true) {
		if (this.enabled) {
			this.diffuse.bind(0);

			if (bindSpecialTextures) {
				this.specular.bind(1);
				this.emission.bind(2);
			}

			let emissionColorU: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("emissionColor");
			if (emissionColorU[1]) {
				gl.uniform3fv(emissionColorU[0], this.emissionColor);
			}
			let modelReturn: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("modelMatrix");
			if (modelReturn[1]) {
				gl.uniformMatrix4fv(modelReturn[0], false, this.modelMatrix);
			}
			let textureReturn: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("textureMatrix");
			if (textureReturn[1]) {
				gl.uniformMatrix4fv(textureReturn[0], false, this.textureMatrix);
			}
			let normalReturn: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("normailMatrix");
			if (normalReturn[1]) {
				gl.uniformMatrix3fv(normalReturn[0], false, this.normalMatrix);
			}

			this.graphicsObject.draw();
		}
	}
}
