import MeshStore from "../Engine/AssetHandling/MeshStore";
import TextureStore from "../Engine/AssetHandling/TextureStore";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import MeshCollisionComponent from "../Engine/ECS/Components/MeshCollisionComponent";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import ECSManager from "../Engine/ECS/ECSManager";
import Entity from "../Engine/ECS/Entity";
import Ray from "../Engine/Physics/Shapes/Ray";
import Scene from "../Engine/Rendering/Scene";
import { WebUtils } from "../Engine/Utils/WebUtils";
import Game from "./States/Game";
import { ECSUtils } from "../Engine/Utils/ESCUtils";
import { quat, vec3 } from "gl-matrix";

class Placement {
	modelPath: string;
	diffuseTexturePath: string;
	specularTexturePath: string;
	emissionTexturePath: string;
	sizeMultiplier: number;
	addCollision: boolean;
	saveToTransforms: boolean;

	constructor(
		modelPath: string,
		diffuseTexturePath: string,
		specularTexturePath: string,
		emissionTexturePath: string,
		addCollision: boolean = true,
		saveToTransform: boolean = true
	) {
		this.modelPath = modelPath;
		this.diffuseTexturePath = diffuseTexturePath;
		this.specularTexturePath = specularTexturePath;
		this.emissionTexturePath = emissionTexturePath;
		this.addCollision = addCollision;
		this.saveToTransforms = saveToTransform;
	}
}

export default class ObjectPlacer {
	placements: Map<string, Placement>;
	private entityPlacements: Map<number, string>;
	private scene: Scene;
	private ecsManager: ECSManager;
	private meshStore: MeshStore;
	private textureStore: TextureStore;
	private lastSavedPlacements: string;
	private lastFileName: string;

	currentlyEditingEntityId: number;

	game: Game;

	constructor(meshStore: MeshStore, textureStore: TextureStore) {
		this.meshStore = meshStore;
		this.textureStore = textureStore;
		this.placements = new Map<string, Placement>();
		this.entityPlacements = new Map<number, string>();
		this.lastSavedPlacements = "";
		this.lastFileName = "";
	}

	async load(
		scene: Scene,
		ecsManager: ECSManager,
		placementsFile: string = "Assets/placements/Placements.txt"
	) {
		this.scene = scene;
		this.ecsManager = ecsManager;
		this.game = Game.getInstanceNoSa();

		await this.reload(placementsFile);
	}

	async reload(placementsFile: string = "Assets/placements/Placements.txt"): Promise<void> {
		this.downloadTransforms();

		if (this.ecsManager && this.game) {
			for (let ep of this.entityPlacements) {
				this.selectNewObjectFromEntityId(ep[0]);
				this.deleteCurrentObject(false);
			}
		}

		this.placements.clear();
		this.entityPlacements.clear();

		await this.loadFromFile(placementsFile);
	}

	private async loadFromFile(placementsFile: string) {
		// Execute the PlacementList code
		const placementsResponse = await fetch("Assets/placements/PlacementList.js");
		if (placementsResponse.ok) {
			const content = await placementsResponse.text();
			eval(content);
		}

		// Now read all transforms for the placements from Placements.txt
		const response = await fetch(placementsFile);
		if (response.ok) {
			const content = await response.text();
			this.lastSavedPlacements = content;

			if (content != "") {
				let currentPlacementType = "";
				for (let t of content.split("\n")) {
					t = t.trim();
					if (t == "") {
						break;
					}
					if (t.startsWith("Placement:")) {
						currentPlacementType = t.substring("Placement:".length);
					} else {
						let [p, s, r, o] = t.split("|");

						this.placeObject(
							currentPlacementType,
							vec3.fromValues.apply(
								null,
								p.split(",").map((n) => parseFloat(n))
							),
							vec3.fromValues.apply(
								null,
								s.split(",").map((n) => parseFloat(n))
							),
							quat.fromValues.apply(
								null,
								r.split(",").map((n) => parseFloat(n))
							),
							vec3.fromValues.apply(
								null,
								o.split(",").map((n) => parseFloat(n))
							)
						);
					}
				}
			}
			const pathParts = placementsFile.split("/");
			this.lastFileName = pathParts[pathParts.length - 1];
		}
	}

	makeCheckpoint() {}

	undo() {}

	getEntitiesOfType(type: string): Array<Entity> {
		let types = type.split("||").map((value) => {
			return value.trim();
		});

		let entities = new Array<Entity>();
		for (let e of this.entityPlacements) {
			if (this.placements.has(e[1])) {
				if (types.includes(e[1])) {
					entities.push(this.ecsManager.getEntity(e[0]));
				}
			}
		}
		return entities;
	}

	getTypeOfEntity(entityId: number) {
		let ep = this.entityPlacements.get(entityId);
		if (ep != undefined) {
			return ep;
		} else {
			return "";
		}
	}

	getCurrentObjectType(): string {
		if (this.currentlyEditingEntityId == undefined) {
			return "nothing";
		}

		let objectName = this.entityPlacements.get(this.currentlyEditingEntityId);

		if (objectName == undefined) {
			return "unknown";
		}

		return objectName;
	}

	placeObject(type: string, position: vec3, size: vec3, rotation: quat, origin: vec3): Entity {
		let placement = this.placements.get(type);
		if (placement == undefined) {
			return null;
		}

		let entity = this.ecsManager.createEntity();
		this.currentlyEditingEntityId = entity.id;
		this.entityPlacements.set(entity.id, type);

		let mesh = this.scene.getNewMesh(
			placement.modelPath,
			placement.diffuseTexturePath,
			placement.specularTexturePath
		);

		let graComp = new GraphicsComponent(mesh);
		this.ecsManager.addComponent(entity, graComp);
		let posComp = new PositionComponent();
		vec3.copy(posComp.position, position);
		vec3.copy(posComp.scale, size);
		quat.copy(posComp.rotation, rotation);
		vec3.copy(posComp.origin, origin);
		this.ecsManager.addComponent(entity, posComp);

		let boundingBoxComp = new BoundingBoxComponent(posComp.matrix);
		boundingBoxComp.setup(mesh.graphicsObject);
		this.ecsManager.addComponent(entity, boundingBoxComp);

		if (!placement.addCollision) {
			return entity;
		}

		// Collision stuff
		let collisionComp = new CollisionComponent();
		collisionComp.isStatic = true;
		this.ecsManager.addComponent(entity, collisionComp);
		collisionComp.frictionCoefficient = 0.0;

		let octree = this.meshStore.getOctree(placement.modelPath, false);
		if (octree == undefined) {
			return entity;
		}
		let meshColComp = new MeshCollisionComponent(octree);
		this.ecsManager.addComponent(entity, meshColComp);
		return entity;
	}

	rayCastToNonSelectedObjects(ray: Ray): number {
		let testEntities = new Array<Entity>();

		for (let e of this.ecsManager.entities) {
			if (e.id == this.currentlyEditingEntityId) {
				continue;
			}

			testEntities.push(e);
		}

		return ECSUtils.RayCastAgainstEntityList(ray, testEntities).distance;
	}

	rayCastToSelectNewObject(ray: Ray, ignoreEntityId?: number) {
		let testEntities = new Array<Entity>();
		for (let e of this.ecsManager.entities) {
			if (e.id == ignoreEntityId) {
				continue;
			}

			testEntities.push(e);
		}

		let rayCastResult = ECSUtils.RayCastAgainstEntityList(ray, testEntities);
		if (rayCastResult.eId >= 0) {
			this.currentlyEditingEntityId = rayCastResult.eId;
		} else {
			this.currentlyEditingEntityId = null;
		}
	}

	selectNewObjectFromEntityId(id: number) {
		this.currentlyEditingEntityId = id;
	}

	updateCurrentlyEditingObject(rotationChange: vec3, scaleChange: number, newPosition?: vec3) {
		if (this.currentlyEditingEntityId != null) {
			let entity = this.ecsManager.getEntity(this.currentlyEditingEntityId);
			if (entity != undefined) {
				let posComp = entity.getComponent(ComponentTypeEnum.POSITIONPARENT) as PositionComponent;
				if (posComp == undefined) {
					posComp = entity.getComponent(ComponentTypeEnum.POSITION) as PositionComponent;
				}

				if (posComp == undefined) {
					return;
				}

				quat.mul(
					posComp.rotation,
					posComp.rotation,
					quat.fromEuler(quat.create(), rotationChange[0], rotationChange[1], rotationChange[2])
				);
				vec3.add(
					posComp.scale,
					posComp.scale,
					vec3.fromValues(scaleChange, scaleChange, scaleChange)
				);
				if (scaleChange != 0) {
					posComp.scale[0] = Math.round(posComp.scale[0] * 10000) / 10000;
					posComp.scale[1] = Math.round(posComp.scale[1] * 10000) / 10000;
					posComp.scale[2] = Math.round(posComp.scale[2] * 10000) / 10000;
				}
				if (newPosition != undefined) {
					newPosition[0] = Math.round(newPosition[0] * 100) / 100;
					newPosition[1] = Math.round(newPosition[1] * 100) / 100;
					newPosition[2] = Math.round(newPosition[2] * 100) / 100;
					vec3.copy(posComp.position, newPosition);
				}
			}
		}
	}

	deleteCurrentObject(setDownloadNeeded: boolean = true) {
		if (this.currentlyEditingEntityId != undefined) {
			let entity = this.ecsManager.getEntity(this.currentlyEditingEntityId);

			if (entity != undefined) {
				// Remove graphics bundle from scene
				// TODO: Make this automatic when entity is removed
				let graphicsComponent = entity.getComponent(
					ComponentTypeEnum.GRAPHICS
				) as GraphicsComponent;
				if (graphicsComponent != undefined) {
					this.scene.deleteGraphicsBundle(graphicsComponent.bundle);
				}
			}

			this.ecsManager.removeEntity(this.currentlyEditingEntityId);
			this.entityPlacements.delete(this.currentlyEditingEntityId);
		}

		this.currentlyEditingEntityId = null;
	}

	duplicateCurrentObject() {
		if (this.currentlyEditingEntityId != undefined) {
			let entityPlacement = this.entityPlacements.get(this.currentlyEditingEntityId);
			if (entityPlacement == undefined) {
				return;
			}

			let entity = this.ecsManager.getEntity(this.currentlyEditingEntityId);

			if (entity == undefined) {
				return;
			}

			let posComp: PositionComponent = <PositionComponent>(
				entity.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);

			if (posComp == undefined) {
				posComp = <PositionComponent>entity.getComponent(ComponentTypeEnum.POSITION);
			}

			if (posComp == undefined) {
				return;
			}

			this.placeObject(
				entityPlacement,
				vec3.clone(posComp.position),
				vec3.clone(posComp.scale),
				quat.clone(posComp.rotation),
				vec3.clone(posComp.origin)
			);
		}
	}

	downloadTransforms(): boolean {
		let transformsData = "";

		for (let [placementString, placement] of this.placements) {
			let printedHeader = false;
			if (!placement.saveToTransforms) {
				continue;
			}

			for (let ep of this.entityPlacements) {
				if (ep[1] == placementString) {
					let entity = this.ecsManager.getEntity(ep[0]);
					if (entity != undefined) {
						let posComp: PositionComponent = <PositionComponent>(
							entity.getComponent(ComponentTypeEnum.POSITIONPARENT)
						);
						if (posComp == undefined) {
							posComp = <PositionComponent>entity.getComponent(ComponentTypeEnum.POSITION);
						}

						if (posComp != undefined) {
							if (!printedHeader) {
								transformsData += "Placement:" + placementString + "\n";
								printedHeader = true;
							}
							transformsData +=
								posComp.position +
								"|" +
								posComp.scale +
								"|" +
								posComp.rotation +
								"|" +
								posComp.origin +
								"\n";
						}
					}
				}
			}
		}

		if (this.lastSavedPlacements === transformsData) {
			return false;
		}

		WebUtils.DownloadFile(this.lastFileName, transformsData);
		this.lastSavedPlacements = transformsData;

		return true;
	}

	onExit(e: BeforeUnloadEvent) {
		if (this.downloadTransforms()) {
			e.preventDefault();
			e.returnValue = "";
			return;
		}

		delete e["returnValue"];
	}
}
