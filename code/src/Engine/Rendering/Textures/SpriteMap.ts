import { mat4, vec3 } from "gl-matrix";

export default class SpriteMap {
	nrOfSprites: { x: number; y: number };
	currentSprite: { x: number; y: number };

	constructor() {
		this.nrOfSprites = { x: 1.0, y: 1.0 };
		this.currentSprite = { x: 0.0, y: 0.0 };
	}

	updateTextureMatrix(matrix: mat4) {
		mat4.identity(matrix);
		let spriteSizeX = 1.0 / Math.max(this.nrOfSprites.x, 0.000001);
		let spriteSizeY = 1.0 / Math.max(this.nrOfSprites.y, 0.000001);
		mat4.translate(
			matrix,
			matrix,
			vec3.fromValues(
				this.currentSprite.x * spriteSizeX,
				this.currentSprite.y * spriteSizeY,
				0.0
			)
		);
		mat4.scale(matrix, matrix, vec3.fromValues(spriteSizeX, spriteSizeY, 1.0));
	}

	setNrOfSprites(x: number, y: number) {
		this.nrOfSprites.x = x;
		this.nrOfSprites.y = y;
	}

	setCurrentSprite(x: number, y: number) {
		this.currentSprite.x = x;
		this.currentSprite.y = y;
	}

	advanceSpriteBy(x: number, y: number) {
		this.currentSprite.x += x;
		this.currentSprite.y += y;
	}
}
