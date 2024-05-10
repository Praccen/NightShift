import { Component, ComponentTypeEnum } from "./Component";
import Triangle from "../../Physics/Shapes/Triangle";
import GraphicsObject from "../../Objects/GraphicsObjects/GraphicsObject";
import Octree from "../../Objects/Octree";
import { vec3 } from "gl-matrix";

export default class MeshCollisionComponent extends Component {
	octree: Octree;

	constructor(octree: Octree, graphicsObject?: GraphicsObject) {
		super(ComponentTypeEnum.MESHCOLLISION);
		this.octree = octree;

		if (graphicsObject) {
			this.setup(graphicsObject, 0.1, 100);
		}
	}

	/**
	 * Sets up the triangles based on the vertices in a graphics object
	 * @param graphicsObj The graphics object
	 */
	private setup(
		graphicsObj: GraphicsObject,
		smallestNodeSizeMultiplicator: number,
		maxShapesPerNode: number
	) {
		let triangles = new Array<Triangle>();
		graphicsObj.setupTriangles(triangles);

		let minVec = vec3.fromValues(Infinity, Infinity, Infinity);
		let maxVec = vec3.fromValues(-Infinity, -Infinity, -Infinity);
		for (let tri of triangles) {
			for (let vertex of tri.getTransformedVertices()) {
				vec3.max(maxVec, maxVec, vertex);
				vec3.min(minVec, minVec, vertex);
			}
		}
		this.octree = new Octree(
			minVec,
			maxVec,
			smallestNodeSizeMultiplicator,
			maxShapesPerNode
		);

		this.octree.addShapes(triangles);
		this.octree.prune();
	}
}
