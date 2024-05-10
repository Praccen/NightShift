import GraphicsObject from "./GraphicsObject";
import ShaderProgram from "../../Rendering/ShaderPrograms/ShaderProgram";
import Triangle from "../../Physics/Shapes/Triangle";
import { gl } from "../../../main";
import { vec3 } from "gl-matrix";

export default class Mesh extends GraphicsObject {
	// Protected
	protected vertices: Float32Array;

	constructor(shaderProgram: ShaderProgram, vertices: Float32Array) {
		super(shaderProgram);

		this.vertices = vertices;
		this.setVertexData(this.vertices);
	}

	setupTriangles(triangles: Array<Triangle>) {
		triangles.length = 0; // Clear triangles
		for (let i = 0; i < this.vertices.length; i += 8 * 3) {
			// Go through the vertices
			// Save the positions as shapes in the input array
			const length = triangles.push(new Triangle());
			triangles[length - 1].setVertices(
				vec3.fromValues(
					this.vertices[i],
					this.vertices[i + 1],
					this.vertices[i + 2],
				),
				vec3.fromValues(
					this.vertices[i + 8],
					this.vertices[i + 8 + 1],
					this.vertices[i + 8 + 2],
				),
				vec3.fromValues(
					this.vertices[i + 16],
					this.vertices[i + 16 + 1],
					this.vertices[i + 16 + 2],
				)
			);
		}
	}

	getVertexPositions(): Array<vec3> {
		let returnArr = new Array<vec3>();
		for (let i = 0; i < this.vertices.length; i += 8) {
			returnArr.push(
				vec3.fromValues(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2])
			);
		}
		return returnArr;
	}

	draw() {
		this.bindVAO();
		gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 8);
	}
}
