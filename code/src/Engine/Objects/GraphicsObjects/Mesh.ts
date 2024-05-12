import GraphicsObject from "./GraphicsObject";
import ShaderProgram from "../../Rendering/ShaderPrograms/ShaderProgram";
import Triangle from "../../Physics/Shapes/Triangle";
import { gl } from "../../../main";
import { mat4, vec3 } from "gl-matrix";

export default class Mesh extends GraphicsObject {
	// Protected
	protected vertices: Float32Array;
	private instanceVBO: WebGLBuffer;
	currentIdx: number = 0;

	constructor(shaderProgram: ShaderProgram, vertices: Float32Array) {
		super(shaderProgram);

		this.bindVAO();
		this.instanceVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferData(gl.ARRAY_BUFFER, 342 * 16 * 4, gl.STATIC_DRAW);
		shaderProgram.setupInstancedVertexAttributePointers();
		this.unbindVAO();

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
				vec3.fromValues(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]),
				vec3.fromValues(this.vertices[i + 8], this.vertices[i + 8 + 1], this.vertices[i + 8 + 2]),
				vec3.fromValues(this.vertices[i + 16], this.vertices[i + 16 + 1], this.vertices[i + 16 + 2])
			);
		}
	}

	getVertexPositions(): Array<vec3> {
		let returnArr = new Array<vec3>();
		for (let i = 0; i < this.vertices.length; i += 8) {
			returnArr.push(vec3.fromValues(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]));
		}
		return returnArr;
	}

	setModelData(model: mat4): boolean {
		let modelArray = new Float32Array(model);
		this.bufferSubDataUpdate(this.currentIdx++ * 16, modelArray);
		return true;
	}
	bufferSubDataUpdate(start: number, data: Float32Array): boolean {
		if (start < 0 || start + data.length > 342 * 16) {
			return false;
		}
		this.bindVAO();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferSubData(gl.ARRAY_BUFFER, start * 4, data);
		this.unbindVAO();
		return true;
	}

	draw() {
		this.bindVAO();
		gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 8);
	}
	drawInstanced() {
		this.bindVAO();
		gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 342);
		this.unbindVAO();
		this.currentIdx = 0;
	}
}
