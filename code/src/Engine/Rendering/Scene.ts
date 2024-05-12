import { gl } from "../../main";
import MeshStore from "../AssetHandling/MeshStore";
import TextureStore from "../AssetHandling/TextureStore";
import DirectionalLight from "./Lighting/DirectionalLight";
import PointLight from "./Lighting/PointLight";
import GraphicsBundle from "../Objects/GraphicsBundle";
import GrassSpawner from "../Objects/GraphicsObjects/GrassSpawner";
import ParticleSpawner from "../Objects/GraphicsObjects/ParticleSpawner";
import PhongQuad from "../Objects/GraphicsObjects/PhongQuad";
import Skybox from "../Objects/GraphicsObjects/Skybox";
import { geometryPass } from "./ShaderPrograms/DeferredRendering/GeometryPass";
import { lightingPass } from "./ShaderPrograms/DeferredRendering/LightingPass";
import { grassShaderProgram } from "./ShaderPrograms/GrassShaderProgram";
import { particleShaderProgram } from "./ShaderPrograms/ParticleShaderProgram";
import ShaderProgram from "./ShaderPrograms/ShaderProgram";
import InstancedMesh from "../Objects/GraphicsObjects/InstancedMesh";

export default class Scene {
	// ---- Graphics objects ----
	private graphicBundles: Array<GraphicsBundle>;
	private grassSpawners: Array<GraphicsBundle>;
	// --------------------------

	// ---- Lights ----
	directionalLight: DirectionalLight;
	pointLights: Array<PointLight>;
	// ----------------

	// ---- Particles ----
	particleSpawners: Array<ParticleSpawner>;
	// -------------------

	// ---- Skybox ----
	skybox: Skybox;
	// ----------------

	instancedIdx: number = -1;

	private textureStore: TextureStore;
	private meshStore: MeshStore;

	constructor(textureStore: TextureStore, meshStore: MeshStore) {
		this.textureStore = textureStore;
		this.meshStore = meshStore;

		// ---- Graphics objects ----
		this.graphicBundles = new Array<GraphicsBundle>();
		this.grassSpawners = new Array<GraphicsBundle>();
		// --------------------------

		// ---- Lighting ----
		this.directionalLight = new DirectionalLight();
		this.pointLights = new Array<PointLight>();
		// ------------------

		// ---- Particles ----
		this.particleSpawners = new Array<ParticleSpawner>();
		// -------------------
	}

	getNewPhongQuad(diffusePath: string, specularPath: string, emissionMap?: string): GraphicsBundle {
		if (emissionMap != undefined) {
			const length = this.graphicBundles.push(
				new GraphicsBundle(
					this.textureStore.getTexture(diffusePath),
					this.textureStore.getTexture(specularPath),
					new PhongQuad(geometryPass),
					false,
					this.textureStore.getTexture(emissionMap)
				)
			);
			return this.graphicBundles[length - 1];
		} else {
			const length = this.graphicBundles.push(
				new GraphicsBundle(
					this.textureStore.getTexture(diffusePath),
					this.textureStore.getTexture(specularPath),
					new PhongQuad(geometryPass)
				)
			);
			return this.graphicBundles[length - 1];
		}
	}

	getNewMesh(
		meshPath: string,
		diffusePath: string,
		specularPath: string,
		indexed: boolean = false
	): GraphicsBundle {
		if (!indexed) {
			const length = this.graphicBundles.push(
				new GraphicsBundle(
					this.textureStore.getTexture(diffusePath),
					this.textureStore.getTexture(specularPath),
					this.meshStore.getMesh(meshPath)
				)
			);
			return this.graphicBundles[length - 1];
		} else {
			if (this.instancedIdx != -1) {
				return this.graphicBundles[this.instancedIdx];
			} else {
				const length = this.graphicBundles.push(
					new GraphicsBundle(
						this.textureStore.getTexture(diffusePath),
						this.textureStore.getTexture(specularPath),
						this.meshStore.getMesh(meshPath),
						indexed
					)
				);
				this.instancedIdx = length - 1;
				return this.graphicBundles[length - 1];
			}
		}
	}

	getNewHeightMap(
		heightmapPath: string,
		diffusePath: string,
		specularPath: string
	): GraphicsBundle {
		const length = this.graphicBundles.push(
			new GraphicsBundle(
				this.textureStore.getTexture(diffusePath),
				this.textureStore.getTexture(specularPath),
				this.meshStore.getHeightmap(heightmapPath)
			)
		);

		return this.graphicBundles[length - 1];
	}

	getNewParticleSpawner(
		texturePath: string,
		numberOfStartingParticles: number = 0
	): ParticleSpawner {
		let length = this.particleSpawners.push(
			new ParticleSpawner(
				particleShaderProgram,
				this.textureStore.getTexture(texturePath),
				numberOfStartingParticles
			)
		);
		return this.particleSpawners[length - 1];
	}

	getNewGrassSpawner(
		diffuseTexturePath: string,
		specularTexturePath: string,
		numberOfStartingParticles: number = 0
	): GraphicsBundle {
		let length = this.grassSpawners.push(
			new GraphicsBundle(
				this.textureStore.getTexture(diffuseTexturePath),
				this.textureStore.getTexture(specularTexturePath),
				new GrassSpawner(grassShaderProgram, numberOfStartingParticles)
			)
		);

		return this.grassSpawners[length - 1];
	}

	getNewPointLight(): PointLight {
		const length = this.pointLights.push(new PointLight());
		return this.pointLights[length - 1];
	}

	getDirectionalLight(): DirectionalLight {
		return this.directionalLight;
	}

	deleteGraphicsBundle(object: GraphicsBundle) {
		this.graphicBundles = this.graphicBundles.filter((o) => object !== o);
	}

	deletePointLight(light: PointLight) {
		this.pointLights = this.pointLights.filter((l) => light !== l);
	}

	deleteParticleSpawner(particleSpawner: ParticleSpawner) {
		this.particleSpawners = this.particleSpawners.filter((ps) => particleSpawner !== ps);
	}

	renderScene(shaderProgram: ShaderProgram, bindSpecialTextures: boolean = true) {
		for (let bundle of this.graphicBundles) {
			bundle.graphicsObject.shaderProgram = shaderProgram;
			bundle.draw(bindSpecialTextures);
		}
	}

	renderGrass(shaderProgram: ShaderProgram, bindSpecialTextures: boolean = true) {
		for (let bundle of this.grassSpawners) {
			bundle.graphicsObject.shaderProgram = shaderProgram;
			bundle.draw(bindSpecialTextures);
		}
	}
}
