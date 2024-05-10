import { mat4, vec2, vec3 } from "gl-matrix";
import Camera from "../Engine/Objects/Camera";
import GraphicsBundle from "../Engine/Objects/GraphicsBundle";
import GrassSpawner from "../Engine/Objects/GraphicsObjects/GrassSpawner";
import Heightmap from "../Engine/Objects/GraphicsObjects/Heightmap";
import Scene from "../Engine/Rendering/Scene";
import { options } from "./GameMachine";

export default class GrassHandler {
	private grassSpawners: Array<{
		spawner: GrassSpawner;
		offset: vec2;
		grassStrawsPlaced: number;
	}>;
	private grassStrawsPerSpawner: number;
	private grassSpawnerSide: number;
	private grassElevationCutoff: number;

	private grassSpawningDeadline: number; // In milliseconds

	private scene: Scene;
	private mapBundle: GraphicsBundle;
	private camera: Camera;

	constructor(scene: Scene, mapBundle: GraphicsBundle, camera: Camera) {
		this.scene = scene;
		this.mapBundle = mapBundle;
		this.camera = camera;

		this.grassSpawners = new Array();
		this.grassStrawsPerSpawner = options.grassDensity;
		this.grassSpawnerSide = 25;
		this.grassElevationCutoff = -3.7;

		this.grassSpawningDeadline = 5;

		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				this.createGrass(
					-10.0 + i * this.grassSpawnerSide,
					-10.0 + j * this.grassSpawnerSide
				);
			}
		}
	}

	createGrass(offsetX, offsetY) {
		let texturePathColour = "Assets/textures/GrassStraw.png";
		let texturePathSpec = "Assets/textures/GrassStraw_Spec.png";

		let bundle = this.scene.getNewGrassSpawner(
			texturePathColour,
			texturePathSpec,
			this.grassStrawsPerSpawner
		);
		// if (Math.random() > 0.5) {
		// 	bundle.emission = this.stateAccessible.textureStore.getTexture(
		// 		"Assets/textures/GrassStraw_Spec.png"
		// 	);
		// }

		this.grassSpawners.push({
			spawner: bundle.graphicsObject as GrassSpawner,
			offset: vec2.fromValues(offsetX, offsetY),
			grassStrawsPlaced: 0,
		});
	}

	/**
	 * Spawn as much grass as possible within deadline or until all grass straws have been spawned
	 */
	fillGrass() {
		let startTime = Date.now();

		let sqrt = Math.pow(this.grassStrawsPerSpawner, 0.5);
		let strawDist = this.grassSpawnerSide / sqrt;

		let invertedMatrix = mat4.invert(mat4.create(), this.mapBundle.modelMatrix); // Invert the transform matrix used for the heightmap

		let data = new Array<number>();

		const cameraPos = this.camera.getPosition();

		// Spawn as much grass as possible within deadline every frame until all grass straws have been spawned
		for (let spawner of this.grassSpawners) {
			// First check if we have to move the spawner
			let middleOffset = vec2.clone(spawner.offset);
			vec2.add(
				middleOffset,
				middleOffset,
				vec2.fromValues(
					this.grassSpawnerSide * 0.5,
					this.grassSpawnerSide * 0.5
				)
			);
			if (
				cameraPos != undefined &&
				Math.abs(middleOffset[0] - cameraPos[0]) > this.grassSpawnerSide * 2
			) {
				spawner.offset[0] =
					spawner.offset[0] -
					Math.ceil(
						Math.abs(middleOffset[0] - cameraPos[0]) /
							(this.grassSpawnerSide * 4)
					) *
						Math.sign(middleOffset[0] - cameraPos[0]) *
						this.grassSpawnerSide *
						4;
				spawner.grassStrawsPlaced = 0;
			}

			if (
				cameraPos != undefined &&
				Math.abs(middleOffset[1] - cameraPos[2]) > this.grassSpawnerSide * 2
			) {
				spawner.offset[1] =
					spawner.offset[1] -
					Math.ceil(
						Math.abs(middleOffset[1] - cameraPos[2]) /
							(this.grassSpawnerSide * 4)
					) *
						Math.sign(middleOffset[1] - cameraPos[2]) *
						this.grassSpawnerSide *
						4;
				spawner.grassStrawsPlaced = 0;
			}

			data.length = 0;
			let startIndex = spawner.grassStrawsPlaced;
			for (
				spawner.grassStrawsPlaced;
				spawner.grassStrawsPlaced < this.grassStrawsPerSpawner;
				spawner.grassStrawsPlaced++
			) {
				if (Date.now() - startTime >= this.grassSpawningDeadline) {
					break;
				}

				let grassStrawPosition = vec3.fromValues(
					// Grass position (x and z)
					spawner.offset[0] +
						(spawner.grassStrawsPlaced % sqrt) * strawDist +
						strawDist * (Math.random() - 0.5),
					0.0,
					spawner.offset[1] +
						Math.floor(spawner.grassStrawsPlaced / sqrt) * strawDist +
						strawDist * (Math.random() - 0.5)
				);

				// Get the height of the heightmap at the corresponding position
				let height = (<Heightmap>(
					this.mapBundle.graphicsObject
				)).getHeightFromWorldPosition(
					this.mapBundle.modelMatrix,
					grassStrawPosition,
					invertedMatrix
				);

				let size = 0.0;

				if (height != null) {
					let normal = (<Heightmap>(
						this.mapBundle.graphicsObject
					)).getNormalFromWorldPosition(
						this.mapBundle.modelMatrix,
						grassStrawPosition,
						invertedMatrix
					);

					if (normal != null) {
						if (normal[1] < 0.999999999 || height < this.grassElevationCutoff) {
							// Given that the x and z coords of the position are on the heightmap
							grassStrawPosition[1] = height;
							size = Math.random() * 0.4 + 0.1;
						}
					}
				}

				data.push(...grassStrawPosition); // Position of straw
				data.push(size); // Size of straw
				data.push(
					...[
						(Math.random() - 0.5) * 0.1,
						(Math.random() - 0.5) * 0.1,
						(Math.random() - 0.5) * 0.1,
					]
				); // TipOffset
			}

			spawner.spawner.bufferSubDataUpdate(
				startIndex * 7,
				new Float32Array(data)
			);

			if (Date.now() - startTime >= this.grassSpawningDeadline) {
				break;
			}
		}
	}

	updateGrass() {
		const doggoPosition = vec3.create();
		const doggoVelocity = vec3.create();

		let sqrt = Math.pow(this.grassStrawsPerSpawner, 0.5);
		let strawDist = this.grassSpawnerSide / sqrt;

		let invertedMatrix = mat4.invert(mat4.create(), this.mapBundle.modelMatrix); // Invert the transform matrix used for the heightmap

		for (let grassSpawner of this.grassSpawners) {
			if (
				grassSpawner.offset[0] > doggoPosition[0] - this.grassSpawnerSide &&
				grassSpawner.offset[0] < doggoPosition[0] &&
				grassSpawner.offset[1] > doggoPosition[2] - this.grassSpawnerSide &&
				grassSpawner.offset[1] < doggoPosition[2]
			) {
				if (
					doggoPosition[1] -
						(<Heightmap>(
							this.mapBundle.graphicsObject
						)).getHeightFromWorldPosition(
							this.mapBundle.modelMatrix,
							doggoPosition,
							invertedMatrix
						) <
					1.0
				) {
					let diffX = doggoPosition[0] - grassSpawner.offset[0];
					let diffY = doggoPosition[2] - grassSpawner.offset[1];

					let middleX = Math.floor(diffX / strawDist);
					let middleY = Math.floor(diffY / strawDist);

					for (let x = middleX - 10; x < middleX + 11; x++) {
						for (let y = middleY - 10; y < middleY + 11; y++) {
							let dist = vec2.fromValues(
								x * strawDist - diffX,
								y * strawDist - diffY
							);
							if (vec2.length(dist) < 0.3) {
								let index = Math.floor(x + y * sqrt);
								if (index > 0 && index < this.grassStrawsPerSpawner) {
									let offset = vec3.fromValues(
										doggoVelocity[0],
										0.0,
										doggoVelocity[2]
									);
									vec3.normalize(offset, offset);
									vec3.scale(offset, offset, 0.2);
									offset[1] = -0.2;
									grassSpawner.spawner.setGrassTipOffset(index, offset);
								}
							}
						}
					}
				}
			}
		}
	}

	update(dt: number) {
		this.fillGrass();

		if (options.foldableGrass) {
			this.updateGrass();
		}
	}
}
