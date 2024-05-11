import { mat4, vec3, vec4 } from "gl-matrix";
import { gl } from "../../../main";
import Triangle from "../../Physics/Shapes/Triangle";
import ShaderProgram from "../../Rendering/ShaderPrograms/ShaderProgram";
import Mesh from "./Mesh";

export default class Heightmap extends Mesh {
	imageData: Uint8ClampedArray;

	xResolution: number;
	zResolution: number;
	xQuadSize: number;
	zQuadSize: number;
	private indices: Int32Array;

	constructor(shaderProgram: ShaderProgram) {
		super(shaderProgram, null);
		this.xResolution = 0;
		this.zResolution = 0;
		this.createPlane(2, 2, 1, 1);
		this.imageData = null;
	}

	setupTriangles(triangles: Array<Triangle>) {
		triangles.length = 0; // Clear triangles
		for (let i = 0; i < this.indices.length; i += 3) {
			// Go through the vertices
			// Save the positions as shapes in the input array
			const length = triangles.push(new Triangle());
			triangles[length - 1].setVertices(
				vec3.fromValues(
					this.vertices[this.indices[i] * 8],
					this.vertices[this.indices[i] * 8 + 1],
					this.vertices[this.indices[i] * 8 + 2]
				),
				vec3.fromValues(
					this.vertices[this.indices[i + 1] * 8],
					this.vertices[this.indices[i + 1] * 8 + 1],
					this.vertices[this.indices[i + 1] * 8 + 2]
				),
				vec3.fromValues(
					this.vertices[this.indices[i + 2] * 8],
					this.vertices[this.indices[i + 2] * 8 + 1],
					this.vertices[this.indices[i + 2] * 8 + 2]
				)
			);
		}
	}

	private updateVertexData(x: number, z: number, values: number[]) {
		let offset = z * this.xResolution * 8 + x * 8;
		for (let i = 0; i < values.length; i++) {
			this.vertices[offset + i] = values[i];
		}
	}

	private updateVertexHeight(x: number, z: number, height: number) {
		this.vertices[z * this.xResolution * 8 + x * 8 + 1] = height;
	}

	private calculateVertexNormal(x: number, z: number) {
		if (x < 1 || x > this.xResolution - 2 || z < 1 || z > this.zResolution - 2) {
			return;
		}
		let resultingNormal = vec3.create();
		let middlePos = vec3.fromValues(0.0, this.vertices[z * this.xResolution * 8 + x * 8 + 1], 0.0);

		let offsets = [
			[-1, -1],
			[1, -1],
			[1, 1],
			[-1, 1],
		];

		let tempTriangle = new Triangle();

		for (let i = 0; i < 4; i++) {
			let first = i;
			let second = (i + 1) % 4;

			tempTriangle.setVertices(
				vec3.fromValues(
					offsets[first][0] * this.xQuadSize,
					this.vertices[
						(z + offsets[first][1]) * this.xResolution * 8 + (x + offsets[first][0]) * 8 + 1
					],
					offsets[first][1] * this.zQuadSize
				),
				middlePos,
				vec3.fromValues(
					offsets[second][0] * this.xQuadSize,
					this.vertices[
						(z + offsets[second][1]) * this.xResolution * 8 + (x + offsets[second][0]) * 8 + 1
					],
					offsets[second][1] * this.zQuadSize
				)
			);
			vec3.add(resultingNormal, resultingNormal, tempTriangle.getTransformedNormals()[0]);
		}

		vec3.normalize(resultingNormal, resultingNormal);
		for (let i = 0; i < 3; i++) {
			this.vertices[z * this.xResolution * 8 + x * 8 + 3 + i] = resultingNormal[i];
		}
	}

	createPlane(xResolution: number, zResolution: number, xQuadSize: number, zQuadSize: number) {
		this.xResolution = Math.max(Math.ceil(xResolution), 2);
		this.zResolution = Math.max(Math.ceil(zResolution), 2);
		this.xQuadSize = xQuadSize;
		this.zQuadSize = zQuadSize;
		this.vertices = new Float32Array(this.xResolution * this.zResolution * 8).fill(0.0);
		for (let z = 0; z < this.zResolution; z++) {
			for (let x = 0; x < this.xResolution; x++) {
				this.updateVertexData(x, z, [
					x * xQuadSize,
					0.0,
					z * zQuadSize,
					0.0,
					1.0,
					0.0,
					x / (this.xResolution - 1),
					z / (this.zResolution - 1),
				]);
			}
		}

		this.setVertexData(this.vertices);

		this.indices = new Int32Array((this.xResolution - 1) * (this.zResolution - 1) * 6).fill(0);

		for (let z = 0; z < this.zResolution - 1; z++) {
			for (let x = 0; x < this.xResolution - 1; x++) {
				let indicesOffset = z * (this.xResolution - 1) * 6 + x * 6;
				let topLeftIndex = z * this.xResolution + x;
				let bottomLeftIndex = topLeftIndex + this.xResolution;

				// Make the diagonals go zig zag to hide repeating patterns along the diagonals
				if ((z + x) % 2 == 0) {
					this.indices[indicesOffset + 0] = topLeftIndex;
					this.indices[indicesOffset + 1] = bottomLeftIndex;
					this.indices[indicesOffset + 2] = bottomLeftIndex + 1;
					this.indices[indicesOffset + 3] = topLeftIndex;
					this.indices[indicesOffset + 4] = bottomLeftIndex + 1;
					this.indices[indicesOffset + 5] = topLeftIndex + 1;
				} else {
					this.indices[indicesOffset + 0] = topLeftIndex;
					this.indices[indicesOffset + 1] = bottomLeftIndex;
					this.indices[indicesOffset + 2] = topLeftIndex + 1;
					this.indices[indicesOffset + 3] = topLeftIndex + 1;
					this.indices[indicesOffset + 4] = bottomLeftIndex;
					this.indices[indicesOffset + 5] = bottomLeftIndex + 1;
				}
			}
		}

		this.setIndexData(this.indices);
	}

	/**
	 *
	 * @param texturePath - texture path / URL
	 * @param createResolutionFromPixels - if the plane should be recreated using the resolution of the picture
	 */
	async readHeightDataFromTexture(texturePath: string, createResolutionFromPixels: boolean = true) {
		let loadImage = function (src: string): Promise<HTMLImageElement> {
			return new Promise((resolve, reject) => {
				let img = new Image();
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = src;
			});
		};

		let resizeImage = function (
			image: HTMLImageElement,
			newWidth: number,
			newHeight: number
		): Uint8ClampedArray {
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");
			canvas.width = newWidth;
			canvas.height = newHeight;
			ctx.drawImage(image, 0, 0, newWidth, newHeight);
			return ctx.getImageData(0, 0, newWidth, newHeight).data;
		};

		let texture = await loadImage(texturePath);

		if (createResolutionFromPixels) {
			this.createPlane(texture.width, texture.height, 1.0, 1.0);
		}

		// Resize the image to the same resolution as our hightmap
		this.imageData = resizeImage(texture, this.xResolution, this.zResolution);

		// Go through the heightmap and set the height to the corrsponding pixel in the (resized) image
		for (let z = 0; z < this.zResolution; z++) {
			for (let x = 0; x < this.xResolution; x++) {
				this.updateVertexHeight(x, z, this.imageData[x * 4 + z * this.xResolution * 4] / 255.0);
			}
		}

		// Calculate normals
		for (let z = 0; z < this.zResolution; z++) {
			for (let x = 0; x < this.xResolution; x++) {
				this.calculateVertexNormal(x, z);
			}
		}

		this.setVertexData(this.vertices);
	}

	getNormalFromWorldPosition(
		heightmapTransformMatrix: mat4,
		worldPosition: vec3,
		invertedTransformMatrix?: mat4
	) {
		// Invert the transform matrix used for the heightmap
		let invertedMatrix: mat4;
		if (invertedTransformMatrix != undefined) {
			invertedMatrix = invertedTransformMatrix;
		} else {
			invertedMatrix = mat4.invert(mat4.create(), heightmapTransformMatrix);
		}

		// Take the world position and transform it into heightmap local coordinates
		let transformedPos = vec3.transformMat4(
			vec3.create(),
			vec3.fromValues(worldPosition[0], worldPosition[1], worldPosition[2]),
			invertedMatrix
		);

		return this.getNormal(transformedPos[0], transformedPos[2]);
	}

	getHeightFromWorldPosition(
		heightmapTransformMatrix: mat4,
		worldPosition: vec3,
		invertedTransformMatrix?: mat4
	): number {
		// Invert the transform matrix used for the heightmap
		let invertedMatrix;
		if (invertedTransformMatrix != undefined) {
			invertedMatrix = invertedTransformMatrix;
		} else {
			invertedMatrix = mat4.invert(mat4.create(), heightmapTransformMatrix);
		}

		// Take the world position and transform it into heightmap local coordinates
		let transformedPos = vec4.transformMat4(
			vec4.create(),
			vec4.fromValues(worldPosition[0], worldPosition[1], worldPosition[2], 1.0),
			invertedTransformMatrix
		);

		// Get the height of the heightmap at the corresponding position
		let height = this.getHeight(transformedPos[0], transformedPos[2]);

		if (height == null) {
			return null;
		}

		transformedPos[1] = height; // set the y coord to the heightmap height
		transformedPos[3] = 1.0; // set the w to 1 to be able to transform the position back into world space

		vec4.transformMat4(transformedPos, transformedPos, heightmapTransformMatrix); // To world space! :D

		return transformedPos[1];
	}

	getHeight(x: number, z: number): number {
		if (
			x < 0 ||
			x > this.xResolution * this.xQuadSize ||
			z < 0 ||
			z > this.zResolution * this.zQuadSize
		) {
			return null;
		}

		// Find out what triangle to get the height from
		let baseX = Math.floor(x / this.xQuadSize);
		let baseZ = Math.floor(z / this.zQuadSize);
		let diffX = x - baseX * this.xQuadSize;
		let diffZ = z - baseZ * this.zQuadSize;

		let topRightHeight =
			this.imageData[(baseX + 1) * 4 + (baseZ + 0) * this.xResolution * 4] / 255.0;
		let bottomLeftHeight =
			this.imageData[(baseX + 0) * 4 + (baseZ + 1) * this.xResolution * 4] / 255.0;
		let topLeftHeight =
			this.imageData[(baseX + 0) * 4 + (baseZ + 0) * this.xResolution * 4] / 255.0;
		let bottomRightHeight =
			this.imageData[(baseX + 1) * 4 + (baseZ + 1) * this.xResolution * 4] / 255.0;

		if ((baseZ + baseX) % 2 == 0) {
			// Because of the zig-zagging mentioned in the createPlane indices set up
			/*
            Base
            |
            v
            +--------+ x
            |\    A  |
            |   \    |
            | B    \ |
            +--------+
            z
            */
			if (diffX > diffZ) {
				// A
				let kx = topLeftHeight - topRightHeight;
				let kz = bottomRightHeight - topRightHeight;
				diffX = 1 - diffX;
				return topRightHeight + kx * diffX + kz * diffZ;
			} else {
				// B
				let kx = bottomRightHeight - bottomLeftHeight;
				let kz = topLeftHeight - bottomLeftHeight;
				diffZ = 1 - diffZ;
				return bottomLeftHeight + kx * diffX + kz * diffZ;
			}
		} else {
			/*
            Base
            |
            v
            +--------+ x
            |  A    /|
            |    /   |
            | /    B |
            +--------+
            z
            */
			if (diffX < 1 - diffZ) {
				// A
				let kx = topRightHeight - topLeftHeight;
				let kz = bottomLeftHeight - topLeftHeight;
				return topLeftHeight + kx * diffX + kz * diffZ;
			} else {
				// B
				let kx = bottomLeftHeight - bottomRightHeight;
				let kz = topRightHeight - bottomRightHeight;
				diffX = 1 - diffX;
				diffZ = 1 - diffZ;
				return bottomRightHeight + kx * diffX + kz * diffZ;
			}
		}
	}

	getNormal(x: number, z: number): vec3 {
		let xCoord = Math.round(x / this.xQuadSize);
		let zCoord = Math.round(z / this.zQuadSize);
		if (
			xCoord < 0 ||
			xCoord > this.xResolution - 1 ||
			zCoord < 0 ||
			zCoord > this.zResolution - 1
		) {
			return null;
		}

		let normal = vec3.fromValues(
			this.vertices[zCoord * this.xResolution * 8 + xCoord * 8 + 3],
			this.vertices[zCoord * this.xResolution * 8 + xCoord * 8 + 4],
			this.vertices[zCoord * this.xResolution * 8 + xCoord * 8 + 5]
		);

		return normal;
	}

	getVertices() {
		return this.vertices;
	}

	draw() {
		this.bindVAO();
		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
	}
}
