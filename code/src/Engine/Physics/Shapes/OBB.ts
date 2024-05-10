import { mat3, mat4, vec3 } from "gl-matrix";
import Shape from "./Shape";

export default class OBB extends Shape {
	private originalVertices: Array<vec3>;
	private originalNormals: Array<vec3>;

	private transformedVertices: Array<vec3>;
	private transformedNormals: Array<vec3>;

	private transformMatrix: mat4;
	private inverseMatrix: mat4;
	private verticesNeedsUpdate: boolean;
	private normalsNeedsUpdate: boolean;

	constructor() {
		super();
		this.originalVertices = new Array<vec3>();
		this.originalNormals = new Array<vec3>();
		this.transformedVertices = new Array<vec3>();
		this.transformedNormals = new Array<vec3>();
		this.transformMatrix = mat4.create();
		this.inverseMatrix = mat4.create();
		this.verticesNeedsUpdate = false;
		this.normalsNeedsUpdate = false;
	}

	setVertices(vertices: Array<vec3>) {
		this.originalVertices.length = 0;
		for (let vert of vertices) {
			this.originalVertices.push(vert);
		}

		this.verticesNeedsUpdate = true;
	}

	setNormals(normals: Array<vec3>) {
		this.originalNormals.length = 0;
		for (let norm of normals) {
			this.originalNormals.push(norm);
		}

		this.normalsNeedsUpdate = true;
	}

	/**
	 * Creates an axis aligned bounding box (AABB).
	 * @param minVec Corner for the lower bound.
	 * @param maxVec Corner for the upper bound.
	 */
	setMinAndMaxVectors(minVec: vec3, maxVec: vec3) {
		this.originalNormals.length = 0;
		this.originalNormals.push(vec3.fromValues(1.0, 0.0, 0.0));
		this.originalNormals.push(vec3.fromValues(0.0, 1.0, 0.0));
		this.originalNormals.push(vec3.fromValues(0.0, 0.0, 1.0));

		this.originalVertices.length = 0;

		for (let i = 0; i < 8; i++) {
			this.originalVertices.push(vec3.create());
		}

		vec3.copy(this.originalVertices[0], minVec);
		vec3.set(this.originalVertices[1], minVec[0], minVec[1], maxVec[2]);
		vec3.set(this.originalVertices[2], minVec[0], maxVec[1], minVec[2]);
		vec3.set(this.originalVertices[3], minVec[0], maxVec[1], maxVec[2]);
		vec3.set(this.originalVertices[4], maxVec[0], minVec[1], minVec[2]);
		vec3.set(this.originalVertices[5], maxVec[0], minVec[1], maxVec[2]);
		vec3.set(this.originalVertices[6], maxVec[0], maxVec[1], minVec[2]);
		vec3.copy(this.originalVertices[7], maxVec);

		this.normalsNeedsUpdate = true;
		this.verticesNeedsUpdate = true;
	}

	setUpdateNeeded() {
		this.verticesNeedsUpdate = true;
		this.normalsNeedsUpdate = true;
	}

	setTransformMatrix(matrix: mat4) {
		this.transformMatrix = matrix;
		this.verticesNeedsUpdate = true;
		this.normalsNeedsUpdate = true;
	}

	setInverseMatrix(matrix: mat4): void {
		this.inverseMatrix = matrix;
		this.verticesNeedsUpdate = true;
		this.normalsNeedsUpdate = true;
	}

	getTransformedVertices(): Array<vec3> {
		if (this.verticesNeedsUpdate) {
			this.transformedVertices.length = 0;

			let resultingMatrix = mat4.mul(mat4.create(), this.inverseMatrix, this.transformMatrix);

			for (const originalVertex of this.originalVertices) {
				this.transformedVertices.push(vec3.transformMat4(vec3.create(), originalVertex, resultingMatrix));
			}
			this.verticesNeedsUpdate = false;
		}
		return this.transformedVertices;
	}

	getTransformedNormals(): Array<vec3> {
		if (this.normalsNeedsUpdate) {
			this.transformedNormals.length = 0;
			
			for (const originalNormal of this.originalNormals) {
				this.transformedNormals.push(
					vec3.normalize(vec3.create(), vec3.transformMat3(vec3.create(), originalNormal, mat3.normalFromMat4(mat3.create(), this.transformMatrix)))
				);
			}

			this.normalsNeedsUpdate = false;
		}
		return this.transformedNormals;
	}

	getTransformedEdges(): Array<vec3> {
		return this.getTransformedNormals();
	}

	getTransformedEdgeNormals(): Array<vec3> {
		return this.getTransformedNormals();
	}

	getTransformMatrix(): mat4 {
		return this.transformMatrix;
	}
}
