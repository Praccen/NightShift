import GraphicsObject from "./GraphicsObject";
import Texture from "../../Rendering/Textures/Texture";
import ShaderProgram from "../../Rendering/ShaderPrograms/ShaderProgram";
import { gl } from "../../../main";

export default class ScreenQuad extends GraphicsObject {
	textures: Array<Texture>;

	// Private
	private vertices: Float32Array;
	private indices: Int32Array;

	constructor(shaderProgram: ShaderProgram, textures: Array<Texture>) {
		super(shaderProgram);

		// prettier-ignore
		this.vertices = new Float32Array([ 
            // positions        // uv
            -1.0,  1.0,     0.0, 1.0,
            -1.0, -1.0,     0.0, 0.0,
             1.0, -1.0,     1.0, 0.0,
             1.0,  1.0,     1.0, 1.0,
        ]);

		// prettier-ignore
		this.indices = new Int32Array([
            0, 1, 2,
            0, 2, 3,
        ]);

		this.setVertexData(this.vertices);
		this.setIndexData(this.indices);

		this.textures = textures;

		for (let texture of this.textures) {
			texture.setTexParameterI(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			texture.setTexParameterI(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}
	}

	draw(bindTextures: boolean = true) {
		this.bindVAO();

		if (bindTextures) {
			for (let i = 0; i < this.textures.length; i++) {
				this.textures[i].bind(i);
			}
		}

		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
	}
}
