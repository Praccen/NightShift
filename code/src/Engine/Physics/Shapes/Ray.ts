import Shape from "./Shape";
import {ReadonlyVec3, mat3, mat4, vec3} from "gl-matrix";

export default class Ray extends Shape {
	private start: vec3;
	private dir: vec3;
	private inverseMatrix: mat4;

	constructor() {
		super();
		this.start = vec3.create();
		this.dir = vec3.fromValues(0.0, 0.0, 1.0);
		this.inverseMatrix = mat4.create();
	}

	setStart(start: vec3) {
		this.start = start;
	}

	setDir(dir: vec3) {
		vec3.normalize(this.dir, dir);
	}

	getDir(): vec3 {
		return this.getTransformedNormals()[0];
	}

	setStartAndDir(start: ReadonlyVec3, dir: ReadonlyVec3) {
		vec3.copy(this.start, start);
		vec3.normalize(this.dir, dir);
	}

	setInverseMatrix(matrix: mat4) {
		this.inverseMatrix = matrix;
	}

	getTransformedVertices(): Array<vec3> {
		return [vec3.transformMat4(vec3.create(), this.start, this.inverseMatrix)];
	}

	getTransformedNormals(): Array<vec3> {
		let start = this.getTransformedVertices()[0];
		let end = vec3.transformMat4(vec3.create(), vec3.add(vec3.create(), this.start, this.dir), this.inverseMatrix)

		return [vec3.subtract(vec3.create(), end, start)]; // Not normalized because we want to keep distances
	}

	getTransformedEdges(): Array<vec3> {
		return [];	
	} 
	
	getTransformedEdgeNormals(): Array<vec3> {
		return [];
	};
}
