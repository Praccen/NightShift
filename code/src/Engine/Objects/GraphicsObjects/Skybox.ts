import GraphicsObject from "./GraphicsObject";
import ShaderProgram from "../../Rendering/ShaderPrograms/ShaderProgram";
import { gl } from "../../../main";
import CubeMap from "../../Rendering/Textures/CubeMap";

export default class Skybox extends GraphicsObject {
	// Public
	texture: CubeMap;

	// Private
	private vertices: Float32Array;
	private indices: Int32Array;

	constructor(shaderProgram: ShaderProgram, texture: CubeMap) {
		super(shaderProgram);

		// prettier-ignore
		this.vertices = new Float32Array([ 
            // positions
            -0.5,  0.5, -0.5,	/*0*/
            -0.5, -0.5, -0.5,	/*1*/
             0.5, -0.5, -0.5,	/*2*/
             0.5,  0.5, -0.5,	/*3*/
            -0.5,  0.5,  0.5,	/*4*/
            -0.5, -0.5,  0.5,	/*5*/
             0.5, -0.5,  0.5,	/*6*/
             0.5,  0.5,  0.5,	/*7*/
        ]);

		// prettier-ignore
		this.indices = new Int32Array([
            0, 1, 2,
            0, 2, 3,
			
			3, 2, 6,
			3, 6, 7,

			7, 6, 5,
			7, 5, 4,

			4, 5, 1,
			4, 1, 0,

			4, 0, 3,
			4, 3, 7,

			1, 5, 6, 
			1, 6, 2,
        ]);
		this.setVertexData(this.vertices);
		this.setIndexData(this.indices);

		this.texture = texture;
	}

	draw() {
		this.bindVAO();

		this.texture.bind();

		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
	}
}
