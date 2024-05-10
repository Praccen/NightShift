import { quat, vec3 } from "gl-matrix";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import Entity from "../Engine/ECS/Entity";
import PlayerController from "./PlayerController";
import Game from "./States/Game";

enum COLOR {
	RED,
	GREEN,
	BLUE,
	ORANGE,
	PINK,
	PURPLE,
}
class Box {
	color: COLOR;
	constructor() {
		this.color = Math.floor(Math.random() * 5 + 1);
	}
}

export default class Card {
	boxes: Array<Box>;
	shapes: Array<Entity>;
	position: vec3;
	player: PlayerController;
	game: Game;
	animationTime: number;

	constructor(player: PlayerController, game: Game, cardNr: number) {
		this.game = game;
		this.boxes = [new Box(), new Box(), new Box()];
		this.shapes = [
			this.createNewCardShape(this.boxes[0], cardNr),
			this.createNewCardShape(this.boxes[1], 1),
			this.createNewCardShape(this.boxes[2], 2),
		];
		this.player = player;
		this.animationTime = 0.0;
	}

	update(dt: number, cardNr: number) {
		let animationVec: vec3 = vec3.fromValues(1, 1, 1);
		if (this.player.showCards) {
			if (this.animationTime < 1.0) {
				this.animationTime += dt;
			}
		} else {
			if (this.animationTime > 0.0) {
				this.animationTime -= dt;
			}
		}
		vec3.lerp(
			animationVec,
			vec3.fromValues(1, 0.5, 0.5),
			vec3.fromValues(1, 1, 1),
			this.animationTime
		);

		let graphComp = this.shapes[0].getComponent(
			ComponentTypeEnum.GRAPHICS
		) as GraphicsComponent;
		if (graphComp != undefined) {
			if (this.animationTime < 0.9) {
				graphComp.bundle.graphicsObject.enabled = false;
				return;
			} else {
				graphComp.bundle.graphicsObject.enabled = true;
			}
		}

		let playerPos = this.player.positionComp.position;
		let forward = vec3.clone(this.game.rendering.camera.getDir());
		let right = vec3.clone(this.game.rendering.camera.getRight());
		forward[1] = 0.0;
		vec3.normalize(forward, forward);
		let posComp = this.shapes[0].getComponent(
			ComponentTypeEnum.POSITION
		) as PositionComponent;
		if (posComp != undefined) {
			let offsetY: number = 0.0;
			let offset: number = 0.0;
			let flush: number = 0.0;
			switch (cardNr) {
				case 0:
					flush = -30;
					offsetY = 0.001;
					offset = -0.05;
					break;
				case 2:
					flush = 30;
					offsetY = -0.001;
					offset = 0.05;
					break;
			}

			vec3.scaleAndAdd(
				posComp.position,
				playerPos,
				forward,
				0.1 + offsetY - (1.0 - this.animationTime)
			);
			quat.rotateY(
				posComp.rotation,
				quat.create(),
				(this.player.jawPitch[0] / 180) * Math.PI
			);
			quat.rotateZ(posComp.rotation, posComp.rotation, (flush / 180) * Math.PI);
			vec3.scale(right, right, offset);
			let posVec: vec3 = vec3.create();
			vec3.mul(posVec, vec3.fromValues(0.0, 1.7, 0), animationVec);
			vec3.add(
				posComp.position,
				posComp.position,
				vec3.add(vec3.create(), right, posVec)
			);
		}
	}

	createNewCardShape(box: Box, cardNr: number): Entity {
		let cardEntity = this.game.ecsManager.createEntity();
		let graphComp = new GraphicsComponent(
			this.game.scene.getNewPhongQuad(
				"CSS:rgb(0,0,0)",
				"CSS:rgb(0,0,0)",
				"CSS:rgb(255,255,255)"
			)
		);
		switch (box.color) {
			case COLOR.RED:
				graphComp.bundle.emissionColor = vec3.fromValues(1, 0, 0);
				break;
			case COLOR.GREEN:
				graphComp.bundle.emissionColor = vec3.fromValues(0, 1, 0);
				break;
			case COLOR.BLUE:
				graphComp.bundle.emissionColor = vec3.fromValues(0, 0, 1);
				break;
			case COLOR.ORANGE:
				graphComp.bundle.emissionColor = vec3.fromValues(1, 1, 0);
				break;
			case COLOR.PINK:
				graphComp.bundle.emissionColor = vec3.fromValues(1, 0, 0);
				break;
			case COLOR.PURPLE:
				graphComp.bundle.emissionColor = vec3.fromValues(1, 0, 1);
				break;
		}
		switch (cardNr) {
			case 0:
				vec3.scale(
					graphComp.bundle.emissionColor,
					graphComp.bundle.emissionColor,
					0.8
				);
				break;
			case 1:
				graphComp.bundle.emissionColor;
				vec3.scale(
					graphComp.bundle.emissionColor,
					graphComp.bundle.emissionColor,
					0.9
				);
				break;
		}
		let posComp = new PositionComponent();
		vec3.set(posComp.scale, 0.05, 0.1, 0.1);
		this.game.ecsManager.addComponent(cardEntity, graphComp);
		this.game.ecsManager.addComponent(cardEntity, posComp);
		return cardEntity;
	}
}
