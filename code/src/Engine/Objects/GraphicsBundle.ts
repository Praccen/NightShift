import { mat4, vec3 } from "gl-matrix";
import { gl } from "../../main";
import Texture from "../Rendering/Textures/Texture";
import GraphicsObject from "./GraphicsObjects/GraphicsObject";

export default class GraphicsBundle {
	modelMatrix: mat4;
	textureMatrix: mat4;

	diffuse: Texture;
	specular: Texture;
	emission: Texture;

	emissionColor: vec3;

	graphicsObject: GraphicsObject;
	enabled: boolean;
	indexed: boolean = false;
	indexedIdx = 0;

	constructor(
		diffuse: Texture,
		specular: Texture,
		graphicsObject: GraphicsObject,
		indexed: boolean = false,
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
		this.indexed = indexed;

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
			if (!this.indexed) {
				let modelReturn: [WebGLUniformLocation, boolean] =
					this.graphicsObject.shaderProgram.getUniformLocation("modelMatrix");
				if (modelReturn[1]) {
					gl.uniformMatrix4fv(modelReturn[0], false, this.modelMatrix);
				}
			}
			let textureReturn: [WebGLUniformLocation, boolean] =
				this.graphicsObject.shaderProgram.getUniformLocation("textureMatrix");
			if (textureReturn[1]) {
				gl.uniformMatrix4fv(textureReturn[0], false, this.textureMatrix);
			}

			if (!this.indexed) {
				this.graphicsObject.draw();
			} else {
				this.graphicsObject.drawInstanced();
			}
		}
	}
}
