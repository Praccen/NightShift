import { vec3 } from "gl-matrix";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import Entity from "../Engine/ECS/Entity";
import { COLOR } from "./Card";
import Game from "./States/Game";

export default class Box {
	entity: Entity;
	game: Game;
	color: COLOR;
	posComp: PositionComponent;
	graphComp: GraphicsComponent;

	constructor(game: Game, color: COLOR, entity: Entity) {
		this.game = game;
		this.color = color;
		this.entity = entity;

		this.graphComp = entity.getComponent(ComponentTypeEnum.GRAPHICS) as GraphicsComponent;
		let setColor: string = "CSS:rgba(255,255,255, 0.5)";
		switch (this.color) {
			case COLOR.RED:
				setColor = "CSS:rgba(255,0,0,0.5)";
				break;
			case COLOR.GREEN:
				setColor = "CSS:rgba(0,255,0,0.5)";
				break;
			case COLOR.BLUE:
				setColor = "CSS:rgba(0,0,255,0.5)";

				break;
			case COLOR.ORANGE:
				setColor = "CSS:rgba(255,255,0,0.5)";

				break;
			case COLOR.PINK:
				setColor = "CSS:rgba(0,0,0,0.5)";

				break;
			case COLOR.PURPLE:
				setColor = "CSS:rgba(255,0,255,0.5)";
				break;
		}
		this.graphComp.bundle.diffuse = this.game.stateAccessible.textureStore.getTexture(setColor);
		this.posComp = entity.getComponent(ComponentTypeEnum.POSITION) as PositionComponent;
	}

	update(dt: number) {
		this.game.uncollectedBoxed.forEach((box) => {
			// Check if box is one of the three we currently want
			if (
				box.color == this.game.player.cards[0].boxes[0].color ||
				box.color == this.game.player.cards[1].boxes[0].color ||
				box.color == this.game.player.cards[2].boxes[0].color
			) {
				if (this.posComp != undefined) {
					if (vec3.dist(this.posComp.position, box.posComp.position) < 1.5) {
						if (vec3.length(box.moveComp.velocity) == 0.0) {
							box.collComp.isStatic = true;
							box.collected = true;
							vec3.set(box.moveComp.velocity, 0, 0, 0);
							vec3.set(box.moveComp.constantAcceleration, 0, 0, 0);
							this.game.boxesCollected += 1;
							this.game.uncollectedBoxed.delete(box.entity.id);
							console.log(this.game.boxesCollected);
						}
					}
				}
			}
		});
	}
}
