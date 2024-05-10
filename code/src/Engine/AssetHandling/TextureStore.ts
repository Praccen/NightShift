import CubeMap from "../Rendering/Textures/CubeMap";
import Texture from "../Rendering/Textures/Texture";

export default class TextureStore {
	private textures: Map<string, Texture>;
	private cubeMaps: Map<string, CubeMap>;

	constructor() {
		this.textures = new Map<string, Texture>();
		this.cubeMaps = new Map<string, CubeMap>();
	}

	setTexture(path: string, texture: Texture) {
		this.textures.set(path, texture);
	}

	getTexture(path: string): Texture {
		let tex = this.textures.get(path);
		if (tex) {
			return tex;
		}

		let newTexture = new Texture();
		const CSSPrefix = "CSS:";
		if (path.startsWith(CSSPrefix)) {
			// Hex value color
			newTexture.createFromCSSColorValue(path.substring(CSSPrefix.length));
		} else {
			newTexture.loadFromFile(path);
		}

		this.textures.set(path, newTexture);
		return newTexture;
	}

	getCubeMap(path: string): CubeMap {
		let cubeMap = this.cubeMaps.get(path);
		if (cubeMap) {
			return cubeMap;
		}

		let newCubeMap = new CubeMap();
		newCubeMap.loadCubemap([
			path + "/right.png",
			path + "/left.png",
			path + "/bottom.png",
			path + "/top.png",
			path + "/front.png",
			path + "/back.png",
		]);
		this.cubeMaps.set(path, newCubeMap);
		return newCubeMap;
	}
}
