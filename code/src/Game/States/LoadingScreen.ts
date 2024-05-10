import Progress from "../../Engine/Rendering/GUI/Objects/Progress";
import State, { StatesEnum } from "../../Engine/States/State";
import TextObject2D from "../../Engine/Rendering/GUI/Objects/Text/TextObject2D";
import { StateAccessible } from "../GameMachine";
import Texture from "../../Engine/Rendering/Textures/Texture";
import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";

export default class LoadingScreen extends State {
	private overlayRendering: OverlayRendering;
	private sa: StateAccessible;

	private text: TextObject2D;
	private statusText: string;
	private progressBar: Progress;
	private progress: number;
	private timer: number;

	private texturesToLoad: Texture[];
	private meshesRequested: number;
	private meshesLoaded: number;
	private heightmapsRequested: number;
	private heightmapsLoaded: number;
	private octreesToLoad: Object[];
	private octreesRequested: number;
	private octreesLoaded: number;

	constructor(sa: StateAccessible) {
		super();
		this.overlayRendering = new OverlayRendering();
		this.sa = sa;

		// Crate GUI
		this.text = this.overlayRendering.getNew2DText();
		this.text.center = true;
		this.text.position[0] = 0.5;
		this.text.position[1] = 0.4;
		this.text.size = 50;
		this.statusText = "Loading assets ";

		this.progressBar = this.overlayRendering.getNewProgress();
		this.progressBar.center = true;
		this.progressBar.position[0] = 0.5;
		this.progressBar.position[1] = 0.5;
		this.progressBar.size = 50;
		this.progressBar.getProgressElement().style.borderRadius = "4px";
		this.progressBar.getProgressElement().max = 1.0;
		this.progressBar.getProgressElement().value = 0.0;
		this.progress = 0;
		this.timer = 0;
	}

	async init() {
		this.overlayRendering.show();
		this.overlayRendering.draw();

		// Load all textures to avoid loading mid game
		let textures = [];

		const texturesResponse = await fetch("Assets/textures/textures.txt");
		if (texturesResponse.ok) {
			const content = await texturesResponse.text();

			for (let row of content.split("\n")) {
				if (row.includes(".png") || row.includes(".jpg")) {
					row = row.replace("\r", "");
					textures.push("Assets/textures/" + row);
				}
			}
		}

		let cubeMaps = ["Assets/textures/skyboxes/NightSky"];

		// Meshes to load
		let meshes = [];

		const objsResponse = await fetch("Assets/objs/objs.txt");
		if (objsResponse.ok) {
			const content = await objsResponse.text();

			for (let row of content.split("\n")) {
				if (row.includes(".obj")) {
					row = row.replace("\r", "");
					meshes.push("Assets/objs/" + row);
				}
			}
		}

		this.meshesRequested = meshes.length;
		this.meshesLoaded = 0;

		// Heightmaps to load
		let heightmaps: (string | boolean | number)[][] = [
			// ["Assets/heightmaps/heightmap.png", false, 200, 200, 1.0, 1.0],
		];
		this.heightmapsRequested = heightmaps.length;
		this.heightmapsLoaded = 0;

		// Octrees to create
		this.octreesToLoad = [
			// ["Assets/heightmaps/heightmap.png", 0.01, 10],
			["Assets/objs/house.obj", 0.1, 20],
			["Assets/objs/police_car.obj", 0.1, 20],
			["Assets/objs/Diamond.obj", 0.1, 20],
			["Assets/objs/sphere.obj", 0.1, 20],
		];
		this.octreesRequested = this.octreesToLoad.length;
		this.octreesLoaded = 0;

		this.texturesToLoad = new Array<Texture>();
		for (const texFile of textures) {
			this.texturesToLoad.push(this.sa.textureStore.getTexture(texFile));
		}

		for (const cubeMapFile of cubeMaps) {
			this.texturesToLoad.push(this.sa.textureStore.getCubeMap(cubeMapFile));
		}

		// Load meshes
		for (const meshFile of meshes) {
			this.sa.meshStore.loadMesh(meshFile).then(() => {
				this.meshesLoaded++;
			});
		}

		// Load heightmaps
		for (const heightmapInfo of heightmaps) {
			this.sa.meshStore.loadHeightmap
				.apply(this.sa.meshStore, heightmapInfo)
				.then(() => {
					this.heightmapsLoaded++;
				});
		}
	}

	reset() {
		this.overlayRendering.hide();
	}

	update(dt: number) {
		let requestedAssets =
			this.texturesToLoad.length +
			this.meshesRequested +
			this.heightmapsRequested +
			this.octreesRequested;
		let texturesLoaded = 0;
		for (let tex of this.texturesToLoad) {
			if (tex.loadedFromFile) {
				texturesLoaded++;
			}
		}
		let loadedAssets =
			texturesLoaded +
			this.meshesLoaded +
			this.heightmapsLoaded +
			this.octreesLoaded;

		// When all meshes and heightmaps have been loaded, we can start processing octrees
		if (
			this.meshesLoaded == this.meshesRequested &&
			this.heightmapsLoaded == this.heightmapsRequested &&
			this.octreesToLoad.length > 0
		) {
			this.statusText = "Generating octrees ";
			let i = this.octreesToLoad.length - 1;
			let octreeToLoad = this.octreesToLoad[i];
			this.sa.meshStore
				.loadOctree(
					octreeToLoad[0],
					octreeToLoad[1],
					octreeToLoad[2],
					10 /*Give a 10 ms deadline*/
				)
				.then((value) => {
					if (value.doneLoading) {
						if (
							this.octreesToLoad[this.octreesToLoad.length - 1][0] ==
							octreeToLoad[0]
						) {
							this.octreesToLoad.pop(); // Done loading, remove it from the queue
							this.octreesLoaded++; // And increase the number of octrees loaded
						}
					}
				});
		}

		this.timer += dt;

		this.progress = loadedAssets / requestedAssets;
		this.progressBar.getProgressElement().value = this.progress;
		this.text.textString = this.statusText;
		for (let i = 4; i > 1; i--) {
			if (this.timer - Math.floor(this.timer) > 1.0 / i) {
				this.text.textString += "-";
			} else {
				this.text.textString += "_";
			}
		}
		this.text.textString += "  " + Math.ceil(this.progress * 100) + "%";

		if (this.progress >= 1.0 && this.timer >= 0.5) {
			this.gotoState = StatesEnum.MAINMENU;
		}
	}

	draw() {
		this.overlayRendering.draw();
	}
}
