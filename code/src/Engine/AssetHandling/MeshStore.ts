import Triangle from "../Physics/Shapes/Triangle";
import { geometryPass } from "../Rendering/ShaderPrograms/DeferredRendering/GeometryPass";
import Heightmap from "../Objects/GraphicsObjects/Heightmap";
import Mesh from "../Objects/GraphicsObjects/Mesh";
import Octree from "../Objects/Octree";
import { WebUtils } from "../Utils/WebUtils";
import Texture from "../Rendering/Textures/Texture";
import TextureStore from "./TextureStore";
import { vec2, vec3 } from "gl-matrix";

export default class MeshStore {
	private meshMap: Map<string, Mesh>;
	private heightmapMap: Map<string, Heightmap>;
	private octreeMap: Map<
		string,
		{ octree: Octree; triangles: Array<Triangle> }
	>;
	private textureStore: TextureStore;

	constructor(textureStore: TextureStore) {
		this.meshMap = new Map<string, Mesh>();
		this.heightmapMap = new Map<string, Heightmap>();
		this.octreeMap = new Map<
			string,
			{ octree: Octree; triangles: Array<Triangle> }
		>();
		this.textureStore = textureStore;
	}

	getMesh(path: string, printWarnings: boolean = true): Mesh {
		let mesh = this.meshMap.get(path);
		if (mesh) {
			return mesh;
		}

		if (printWarnings) {
			console.warn("Trying to get mesh " + path + " before loading it");
		}
		return null;
	}

	async loadMesh(path: string): Promise<Mesh> {
		let mesh = this.meshMap.get(path);
		if (mesh) {
			return mesh;
		}

		let newVertices = await this.parseObjContent(path);
		this.meshMap.set(path, new Mesh(geometryPass, newVertices));

		return this.meshMap.get(path);
	}

	getHeightmap(path: string, printWarnings: boolean = true): Heightmap {
		let heightmap = this.heightmapMap.get(path);
		if (heightmap) {
			return heightmap;
		}

		if (printWarnings) {
			console.warn("Trying to get heightmap " + path + " before loading it");
		}
		return null;
	}

	async loadHeightmap(
		path: string,
		useTextureSizeForResolution: boolean = true,
		x: number = 2,
		y: number = 2,
		sizePerX: number = 1.0,
		sizePerY: number = 1.0
	): Promise<Heightmap> {
		let heightmap = this.heightmapMap.get(path);
		if (heightmap) {
			return heightmap;
		}

		let newHeightmap = new Heightmap(geometryPass);
		if (!useTextureSizeForResolution) {
			newHeightmap.createPlane(x, y, sizePerX, sizePerY);
		}
		await newHeightmap.readHeightDataFromTexture(
			path,
			useTextureSizeForResolution
		);
		this.heightmapMap.set(path, newHeightmap);

		return newHeightmap;
	}

	getOctree(path: string, printWarnings: boolean = true): Octree {
		let octree = this.octreeMap.get(path);
		if (octree && octree.triangles.length == 0) {
			return octree.octree;
		}

		if (printWarnings) {
			console.warn("Trying to get octree " + path + " before loading it");
		}
		return null;
	}

	async loadOctree(
		path: string,
		smallestOctreeNodeSizeMultiplicator: number,
		maxShapesPerOctreeNode: number,
		timeLimit: number = Infinity
	): Promise<{ octree: Octree; doneLoading: boolean }> {
		let startTime = Date.now();

		let octree = this.octreeMap.get(path);
		if (octree && octree.triangles.length == 0) {
			return { octree: octree.octree, doneLoading: true };
		}

		if (octree == undefined) {
			// Immediately make it defined, but with no content, to only do the initialization once
			this.octreeMap.set(path, {
				octree: null,
				triangles: null,
			});

			octree = this.octreeMap.get(path);

			let triangles = new Array<Triangle>();
			if (path.endsWith(".obj")) {
				let mesh = this.getMesh(path, false);
				if (!mesh) {
					console.warn(
						"Trying to get octree for " + path + " before loading " + path
					);
					return null;
				}

				mesh.setupTriangles(triangles);
			} else {
				let heightmap = this.getHeightmap(path, false);
				if (!heightmap) {
					console.warn(
						"Trying to get octree for " + path + " before loading " + path
					);
					return null;
				}

				heightmap.setupTriangles(triangles);
			}

			octree.triangles = triangles;

			let octPath =
				"Assets/octrees/" + path.split("/").pop().split(".")[0] + ".oct";
			let fetched = false;
			try {
				const response = await fetch(octPath);
				if (response.ok) {
					fetched = true;
					console.log("Loaded octree from " + octPath);
					const octContent = await response.text();

					octree.octree = new Octree(
						vec3.create(),
						vec3.create(),
						smallestOctreeNodeSizeMultiplicator,
						maxShapesPerOctreeNode
					);
					octree.octree.parseOct(octContent);
					octree.triangles.length = 0;
				}
			} catch (e) {}

			if (!fetched) {
				console.log(
					"Did not find an octree to load from " +
						octPath +
						". Generating it from scratch."
				);
				let minVec = vec3.fromValues(Infinity, Infinity, Infinity);
				let maxVec = vec3.fromValues(-Infinity, -Infinity, -Infinity);
				for (let tri of triangles) {
					for (let vertex of tri.getTransformedVertices()) {
						vec3.max(maxVec, maxVec, vertex);
						vec3.min(minVec, minVec, vertex);
					}
				}

				octree.octree = new Octree(
					minVec,
					maxVec,
					smallestOctreeNodeSizeMultiplicator,
					maxShapesPerOctreeNode
				);
			}
		}

		while (
			octree.octree != undefined &&
			octree.triangles != undefined &&
			octree.triangles.length > 0 &&
			Date.now() - startTime < timeLimit
		) {
			octree.octree.addShape(octree.triangles.pop());
		}

		if (octree.triangles != undefined && octree.triangles.length == 0) {
			octree.octree.prune();

			// console.groupCollapsed("octree for " + path);
			// octree.octree.print();
			// console.groupEnd();
		}

		return {
			octree: octree.octree,
			doneLoading:
				octree.triangles != undefined && octree.triangles.length == 0,
		};
	}

	downloadOctrees() {
		for (let octree of this.octreeMap) {
			let data = octree[1].octree.getDataString();
			WebUtils.DownloadFile(
				octree[0].split("/").pop().split(".")[0] + ".oct",
				data
			);
		}
	}

	private async parseObjContent(meshPath: string): Promise<Float32Array> {
		/*
		https://webglfundamentals.org/webgl/lessons/webgl-load-obj.html
		*/

		const response = await fetch(meshPath);
		const objContent = await response.text();

		const lines = objContent.split("\n");
		let vertexPositions = new Array<vec3>();
		let vertexTexCoords = new Array<vec2>();
		let vertexNormals = new Array<vec3>();
		let vertices = new Array<{
			posIndex: number;
			texCoordIndex: number;
			normalIndex: number;
			mtlIndex: number;
		}>();
		let mtls = new Map<
			string,
			{
				diffuseColor: vec3;
				specularColor: vec3;
				emissionColor: vec3;
				dissolve: number;
				spriteIndex: number;
			}
		>();
		let usingMtl: string = "";

		for (let line of lines) {
			line = line.trim();

			if (line.startsWith("mtllib")) {
				const mtlName = line.split(/\s+/).filter((element) => {
					return element != "mtllib";
				});
				if (mtlName.length == 1) {
					let mtlPath =
						meshPath.substring(0, meshPath.lastIndexOf("/") + 1) + mtlName;
					try {
						const mtlResponse = await fetch(mtlPath);

						if (mtlResponse.ok) {
							const mtlContent = await mtlResponse.text();
							let lastMtl: string = "";
							let index = 0;

							for (const row of mtlContent.split("\n")) {
								if (row.startsWith("newmtl")) {
									let splitRow = row.split(/\s+/);
									if (splitRow.length > 1) {
										lastMtl = splitRow[1];
										mtls.set(lastMtl, {
											diffuseColor: vec3.create(),
											specularColor: vec3.create(),
											emissionColor: vec3.create(),
											dissolve: 1.0,
											spriteIndex: index,
										});
										index++;
									}
								} else if (row.startsWith("Kd") && lastMtl != "") {
									const colorValues = row.split(/\s+/).filter((element) => {
										return element != "Kd";
									});
									if (colorValues.length > 2) {
										vec3.set(
											mtls.get(lastMtl).diffuseColor,
											parseFloat(colorValues[0]),
											parseFloat(colorValues[1]),
											parseFloat(colorValues[2])
										);
									}
								} else if (row.startsWith("Ks") && lastMtl != "") {
									const colorValues = row.split(/\s+/).filter((element) => {
										return element != "Ks";
									});
									if (colorValues.length > 2) {
										vec3.set(
											mtls.get(lastMtl).specularColor,
											parseFloat(colorValues[0]),
											parseFloat(colorValues[1]),
											parseFloat(colorValues[2])
										);
									}
								} else if (row.startsWith("Ke") && lastMtl != "") {
									const colorValues = row.split(/\s+/).filter((element) => {
										return element != "Ke";
									});
									if (colorValues.length > 2) {
										vec3.set(
											mtls.get(lastMtl).emissionColor,
											parseFloat(colorValues[0]),
											parseFloat(colorValues[1]),
											parseFloat(colorValues[2])
										);
									}
								} else if (row.startsWith("d") && lastMtl != "") {
									const colorValues = row.split(/\s+/).filter((element) => {
										return element != "d";
									});
									if (colorValues.length > 0) {
										mtls.get(lastMtl).dissolve = parseFloat(colorValues[0]);
									}
								}
							}

							let diffuseTextureData = new Uint8Array(index * 4);
							for (let mtl of mtls) {
								diffuseTextureData[mtl[1].spriteIndex * 4 + 0] =
									mtl[1].diffuseColor[0] * 255;
								diffuseTextureData[mtl[1].spriteIndex * 4 + 1] =
									mtl[1].diffuseColor[1] * 255;
								diffuseTextureData[mtl[1].spriteIndex * 4 + 2] =
									mtl[1].diffuseColor[2] * 255;
								diffuseTextureData[mtl[1].spriteIndex * 4 + 3] =
									mtl[1].dissolve * 255;
							}
							let tempTexture = new Texture(false);
							tempTexture.setTextureData(diffuseTextureData, index, 1);
							this.textureStore.setTexture(mtlPath, tempTexture);

							let specularTextureData = new Uint8Array(index * 4);
							for (let mtl of mtls) {
								specularTextureData[mtl[1].spriteIndex * 4 + 0] =
									mtl[1].specularColor[0] * 255;
								specularTextureData[mtl[1].spriteIndex * 4 + 1] =
									mtl[1].specularColor[1] * 255;
								specularTextureData[mtl[1].spriteIndex * 4 + 2] =
									mtl[1].specularColor[2] * 255;
								specularTextureData[mtl[1].spriteIndex * 4 + 3] = 255;
							}
							tempTexture = new Texture(false);
							tempTexture.setTextureData(specularTextureData, index, 1);
							this.textureStore.setTexture(
								mtlPath.substring(0, mtlPath.length - 4) + "_spec.mtl",
								tempTexture
							);

							let emissionTextureData = new Uint8Array(index * 4);
							for (let mtl of mtls) {
								emissionTextureData[mtl[1].spriteIndex * 4 + 0] =
									mtl[1].emissionColor[0] * 255;
								emissionTextureData[mtl[1].spriteIndex * 4 + 1] =
									mtl[1].emissionColor[1] * 255;
								emissionTextureData[mtl[1].spriteIndex * 4 + 2] =
									mtl[1].emissionColor[2] * 255;
								emissionTextureData[mtl[1].spriteIndex * 4 + 3] = 255;
							}
							tempTexture = new Texture(false);
							tempTexture.setTextureData(emissionTextureData, index, 1);
							this.textureStore.setTexture(
								mtlPath.substring(0, mtlPath.length - 4) + "_emission.mtl",
								tempTexture
							);
						}
					} catch (e) {}
				}
			} else if (line.startsWith("usemtl") && mtls.size > 0) {
				usingMtl = line.split(/\s+/)[1];
			} else if (line.startsWith("vt")) {
				// Texture coordinates
				const coords = line.split(/\s+/).filter((element) => {
					return element != "vt";
				});
				vertexTexCoords.push(
					vec2.fromValues(parseFloat(coords[0]), parseFloat(coords[1]))
				);
			} else if (line.startsWith("vn")) {
				// Normal
				const coords = line.split(/\s+/).filter((element) => {
					return element != "vn";
				});
				vertexNormals.push(
					vec3.fromValues(
						parseFloat(coords[0]),
						parseFloat(coords[1]),
						parseFloat(coords[2])
					)
				);
			} else if (line.startsWith("v")) {
				// Position
				const coords = line.split(/\s+/).filter((element) => {
					return element != "v";
				});
				vertexPositions.push(
					vec3.fromValues(
						parseFloat(coords[0]),
						parseFloat(coords[1]),
						parseFloat(coords[2])
					)
				);
			} else if (line.startsWith("f")) {
				// Faces
				const coords = line.split(/\s+/).filter((element) => {
					return element != "f";
				});
				for (let i = 0; i < coords.length - 2; i++) {
					for (let j = 0; j < 3; j++) {
						let index = j == 0 ? 0 : i + j; // 0 if j is zero, otherwize i +j
						const indices = coords[index].split("/");

						const last = vertices.push({
							posIndex: NaN,
							texCoordIndex: NaN,
							normalIndex: NaN,
							mtlIndex: NaN,
						});
						if (indices.length > 0) {
							vertices[last - 1].posIndex = parseInt(indices[0]) - 1;
						}

						if (indices.length > 1) {
							vertices[last - 1].texCoordIndex = parseInt(indices[1]) - 1; // Can be empty, texCoordIndex will then be NaN
						}

						if (indices.length > 2) {
							vertices[last - 1].normalIndex = parseInt(indices[2]) - 1;
						}

						if (usingMtl != "") {
							const mtl = mtls.get(usingMtl);
							if (mtl != undefined) {
								vertices[last - 1].mtlIndex = mtl.spriteIndex;
							} else {
								console.warn("usemtl " + usingMtl + ", there is no such mtl");
							}
						}
					}
				}
			} else if (line.startsWith("#")) {
				// A comment, ignore
			} else if (line.length > 0) {
				// Unhandled keywords
				// console.warn("OBJ loader: Unhandled keyword " + line.split(/\s+/)[0]);
			}
		}

		let returnArr = new Float32Array(vertices.length * 8); // 3 * pos + 3 * norm + 2 * tx

		for (let i = 0; i < vertices.length; i++) {
			if (!isNaN(vertices[i].posIndex)) {
				returnArr[i * 8] = vertexPositions[vertices[i].posIndex][0];
				returnArr[i * 8 + 1] = vertexPositions[vertices[i].posIndex][1];
				returnArr[i * 8 + 2] = vertexPositions[vertices[i].posIndex][2];
			} else {
				returnArr[i * 8] = 0.0;
				returnArr[i * 8 + 1] = 0.0;
				returnArr[i * 8 + 2] = 0.0;
			}

			if (!isNaN(vertices[i].normalIndex)) {
				returnArr[i * 8 + 3] = vertexNormals[vertices[i].normalIndex][0];
				returnArr[i * 8 + 4] = vertexNormals[vertices[i].normalIndex][1];
				returnArr[i * 8 + 5] = vertexNormals[vertices[i].normalIndex][2];
			} else {
				returnArr[i * 8 + 3] = 1.0;
				returnArr[i * 8 + 4] = 0.0;
				returnArr[i * 8 + 5] = 0.0;
			}

			if (!isNaN(vertices[i].mtlIndex)) {
				returnArr[i * 8 + 6] =
					vertices[i].mtlIndex / mtls.size + 0.5 / mtls.size;
				returnArr[i * 8 + 7] = 0.5;
			} else if (!isNaN(vertices[i].texCoordIndex)) {
				returnArr[i * 8 + 6] = vertexTexCoords[vertices[i].texCoordIndex][0];
				returnArr[i * 8 + 7] = vertexTexCoords[vertices[i].texCoordIndex][1];
			} else {
				returnArr[i * 8 + 6] = 0.0;
				returnArr[i * 8 + 7] = 0.0;
			}
		}
		return returnArr;
	}
}
