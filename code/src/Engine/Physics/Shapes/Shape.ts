import { mat4, vec3 } from "gl-matrix";

export default class Shape {
	margin: number;

	constructor() {
		this.margin = 0.0;
	}

	setUpdateNeeded() {}

	setTransformMatrix(matrix: mat4) {}

	getOriginalVertices(): Array<vec3> {
		return null;
	}

	getTransformedVertices(): Array<vec3> {
		return null;
	}

	getTransformedNormals(): Array<vec3> {
		return null;
	}

	getTransformedEdges(): Array<vec3> {
		return null;
	}

	getTransformedEdgeNormals(): Array<vec3> {
		return null;
	}
}
