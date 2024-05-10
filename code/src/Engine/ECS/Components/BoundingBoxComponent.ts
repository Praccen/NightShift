import { mat4, vec3 } from "gl-matrix";
import GraphicsObject from "../../Objects/GraphicsObjects/GraphicsObject";
import OBB from "../../Physics/Shapes/OBB";
import { Component, ComponentTypeEnum } from "./Component";

export default class BoundingBoxComponent extends Component {
	boundingBox: OBB;

	constructor(matrix: mat4) {
		super(ComponentTypeEnum.BOUNDINGBOX);

		this.boundingBox = new OBB();
		this.updateTransformMatrix(matrix);
	}

	/**
	 * Sets up the bounding box based on the vertices in a graphics object
	 * @param graphicsObj The graphics object
	 */
	setup(graphicsObj: GraphicsObject) {
		let minVec = vec3.fromValues(Infinity, Infinity, Infinity);
		let maxVec = vec3.fromValues(-Infinity, -Infinity, -Infinity);

		let vertices = graphicsObj.getVertexPositions();

		for (let vertex of vertices) {
			vec3.max(maxVec, maxVec, vertex);
			vec3.min(minVec, minVec, vertex);
		}

		this.boundingBox.setMinAndMaxVectors(minVec, maxVec);
	}

	/**
	 * Update the transform matrix used for the bounding box
	 * @param matrix Optional: Will set a new matrix to use for the bounding box. If no matrix is sent, it will use the previously set matrix but mark the box to be updated.
	 */
	updateTransformMatrix(matrix?: mat4) {
		if (matrix) {
			this.boundingBox.setTransformMatrix(matrix);
		} else {
			this.boundingBox.setUpdateNeeded();
		}
	}
}
