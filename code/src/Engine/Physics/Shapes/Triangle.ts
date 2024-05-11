import { mat3, mat4, vec3 } from "gl-matrix";
import Shape from "./Shape";

export default class Triangle extends Shape {
	private originalVertices: Array<vec3>;
	private originalNormal: vec3;

	private transformedVertices: Array<vec3>;
	private transformedNormals: Array<vec3>;
	private transformedEdges: Array<vec3>;
	private transformedEdgeNormals: Array<vec3>;

	private transformMatrix: mat4;
	private verticesNeedsUpdate: boolean;
	private normalNeedsUpdate: boolean;
	private edgesNeedsUpdate: boolean;
	private edgeNormalsNeedsUpdate: boolean;

	constructor() {
		super();
		this.originalVertices = new Array<vec3>();
		this.originalNormal = vec3.create();
		this.transformedVertices = new Array<vec3>();
		this.transformedNormals = new Array<vec3>(1);
		this.transformedEdges = new Array<vec3>();
		this.transformedEdgeNormals = new Array<vec3>();
		this.transformMatrix = mat4.create();
		this.verticesNeedsUpdate = false;
		this.normalNeedsUpdate = false;
		this.edgesNeedsUpdate = false;
		this.edgeNormalsNeedsUpdate = false;
	}

	setVertices(vertex1: vec3, vertex2: vec3, vertex3: vec3) {
		this.originalVertices.length = 0;
		this.transformedEdges.length = 0;
		this.originalVertices.push(vertex1);
		this.originalVertices.push(vertex2);
		this.originalVertices.push(vertex3);
		vec3.normalize(
			this.originalNormal,
			vec3.cross(
				this.originalNormal,
				vec3.subtract(vec3.create(), vertex2, vertex1),
				vec3.subtract(vec3.create(), vertex3, vertex2)
			)
		);

		this.verticesNeedsUpdate = true;
		this.normalNeedsUpdate = true;
		this.edgesNeedsUpdate = true;
		this.edgeNormalsNeedsUpdate = true;
	}

	setUpdateNeeded() {
		this.verticesNeedsUpdate = true;
		this.normalNeedsUpdate = true;
		this.edgesNeedsUpdate = true;
		this.edgeNormalsNeedsUpdate = true;
	}

	setTransformMatrix(matrix: mat4) {
		this.transformMatrix = matrix;
		this.verticesNeedsUpdate = true;
		this.normalNeedsUpdate = true;
		this.edgesNeedsUpdate = true;
		this.edgeNormalsNeedsUpdate = true;
	}

	getOriginalVertices(): Array<vec3> {
		return this.originalVertices;
	}

	getTransformedVertices(): Array<vec3> {
		if (this.verticesNeedsUpdate) {
			this.transformedVertices.length = 0;

			for (const originalVertex of this.originalVertices) {
				let transformedVertex = vec3.transformMat4(
					vec3.create(),
					vec3.fromValues(originalVertex[0], originalVertex[1], originalVertex[2]),
					this.transformMatrix
				);
				this.transformedVertices.push(transformedVertex);
			}
			this.verticesNeedsUpdate = false;
		}
		return this.transformedVertices;
	}

	getTransformedNormals(): Array<vec3> {
		if (this.normalNeedsUpdate) {
			this.transformedNormals.length = 0;
			this.transformedNormals.push(
				vec3.normalize(
					vec3.create(),
					vec3.transformMat3(
						vec3.create(),
						this.originalNormal,
						mat3.normalFromMat4(mat3.create(), this.transformMatrix)
					)
				)
			);

			this.normalNeedsUpdate = false;
		}
		return this.transformedNormals;
	}

	getTransformedEdges(): Array<vec3> {
		if (this.edgesNeedsUpdate) {
			this.getTransformedVertices(); // Force update of vertices
			this.transformedEdges.length = 0;

			this.transformedEdges.push(
				vec3.normalize(
					vec3.create(),
					vec3.subtract(vec3.create(), this.transformedVertices[1], this.transformedVertices[0])
				)
			);
			this.transformedEdges.push(
				vec3.normalize(
					vec3.create(),
					vec3.subtract(vec3.create(), this.transformedVertices[2], this.transformedVertices[1])
				)
			);
			this.transformedEdges.push(
				vec3.normalize(
					vec3.create(),
					vec3.subtract(vec3.create(), this.transformedVertices[0], this.transformedVertices[2])
				)
			);

			this.edgesNeedsUpdate = false;
		}
		return this.transformedEdges;
	}

	getTransformedEdgeNormals(): Array<vec3> {
		if (this.edgeNormalsNeedsUpdate) {
			this.getTransformedEdges(); // Force update of edges
			this.getTransformedNormals(); // Force update of normal
			this.transformedEdgeNormals.length = 0;

			this.transformedEdgeNormals.push(
				vec3.normalize(
					vec3.create(),
					vec3.cross(vec3.create(), this.transformedEdges[0], this.transformedNormals[0])
				)
			);
			this.transformedEdgeNormals.push(
				vec3.normalize(
					vec3.create(),
					vec3.cross(vec3.create(), this.transformedEdges[1], this.transformedNormals[0])
				)
			);
			this.transformedEdgeNormals.push(
				vec3.normalize(
					vec3.create(),
					vec3.cross(vec3.create(), this.transformedEdges[2], this.transformedNormals[0])
				)
			);

			this.edgeNormalsNeedsUpdate = false;
		}
		return this.transformedEdgeNormals;
	}
}
