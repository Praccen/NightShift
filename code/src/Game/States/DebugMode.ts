import State, { StatesEnum } from "../../Engine/States/State";
import { input, options, StateAccessible } from "../GameMachine";
import Game from "./Game";
import { MousePicking } from "../../Engine/Maths/MousePicking";
import DebugMenu from "./DebugMenu";
import { WebUtils } from "../../Engine/Utils/WebUtils";
import { ECSUtils } from "../../Engine/Utils/ESCUtils";
import { mat4, vec2, vec3 } from "gl-matrix";

export default class DebugMode extends State {
	private game: Game;
	private stateAccessible: StateAccessible;
	private debugMenu: DebugMenu;
	private mouseWasPressed: boolean;
	private cWasPressed: boolean;
	private lastMousePos: vec2;
	private checkpointNeeded: boolean;
	private checkpointTriggeredThisFrame: boolean;
	private actionString: string;
	private oWasPressed: boolean;
	private pWasPressed: boolean;

	constructor(sa: StateAccessible, game: Game) {
		super();
		this.stateAccessible = sa;
		this.game = game;
		this.debugMenu = new DebugMenu(this.stateAccessible, this.game, this);

		this.lastMousePos = vec2.fromValues(
			input.mousePosition.x,
			input.mousePosition.y
		);

		this.oWasPressed = true;
		this.pWasPressed = true;
		this.mouseWasPressed = false;
		this.cWasPressed = false;
		this.checkpointNeeded = false;
		this.checkpointTriggeredThisFrame = false;
		this.actionString = "";
	}

	async init() {
		this.debugMenu.init();
		let posCookie = WebUtils.GetCookie("debugPos");
		if (posCookie != "") {
			let coords = posCookie.split(",");
			if (coords.length == 3) {
				this.game.rendering.camera.setPosition(
					vec3.fromValues(
						parseFloat(coords[0]),
						parseFloat(coords[1]),
						parseFloat(coords[2])
					)
				);
			}
		}

		let dirCookie = WebUtils.GetCookie("debugDir");
		if (dirCookie != "") {
			let coords = dirCookie.split(",");
			if (coords.length == 3) {
				this.game.rendering.camera.setDir(
					vec3.fromValues(
						parseFloat(coords[0]),
						parseFloat(coords[1]),
						parseFloat(coords[2])
					)
				);
			}
		}

		this.oWasPressed = true;
		this.pWasPressed = true;
		document.exitPointerLock();
	}

	reset() {
		this.debugMenu.reset();
	}

	private handleInput(dt: number) {
		if (input.keys["O"]) {
			if (!this.oWasPressed) {
				WebUtils.SetCookie("debug", "false");
				this.gotoState = StatesEnum.GAME;
			}
			this.oWasPressed = true;
		} else {
			this.oWasPressed = false;
		}

		if (input.keys["P"]) {
			if (!this.pWasPressed) {
				this.debugMenu.toggleHidden();
			}
			this.pWasPressed = true;
		} else {
			this.pWasPressed = false;
		}

		let moveVec: vec3 = vec3.create();
		let move = false;
		if (input.keys["W"]) {
			vec3.add(moveVec, moveVec, this.game.rendering.camera.getDir());
			move = true;
		}

		if (input.keys["S"]) {
			vec3.subtract(moveVec, moveVec, this.game.rendering.camera.getDir());
			move = true;
		}

		if (input.keys["A"]) {
			vec3.subtract(moveVec, moveVec, this.game.rendering.camera.getRight());
			move = true;
		}

		if (input.keys["D"]) {
			vec3.add(moveVec, moveVec, this.game.rendering.camera.getRight());
			move = true;
		}

		if (input.keys[" "]) {
			vec3.add(moveVec, moveVec, vec3.fromValues(0.0, 1.0, 0.0));
			move = true;
		}

		if (input.keys["SHIFT"]) {
			vec3.subtract(moveVec, moveVec, vec3.fromValues(0.0, 1.0, 0.0));
			move = true;
		}

		if (move) {
			vec3.normalize(moveVec, moveVec);
			vec3.scale(moveVec, moveVec, 15.0 * dt); // Speed
			this.game.rendering.camera.translate(moveVec);
		}

		let rotVec: vec2 = vec2.create();
		let rotate = false;

		if (
			input.mouseRightClicked &&
			!this.debugMenu.mouseOverGuiElement &&
			(input.mousePosition.x != input.mousePosition.previousX ||
				input.mousePosition.y != input.mousePosition.previousY)
		) {
			vec2.set(
				rotVec,
				(input.mousePosition.previousY - input.mousePosition.y) * 0.2,
				(input.mousePosition.previousX - input.mousePosition.x) * 0.2
			);

			rotate = true;
		}

		if (rotate) {
			let rotMatrix = mat4.create();
			let rotAmount: number = 90.0;
			let rightVec = vec3.copy(
				vec3.create(),
				this.game.rendering.camera.getRight()
			);
			if (rotVec[1]) {
				mat4.rotate(
					rotMatrix,
					rotMatrix,
					(rotAmount * rotVec[1] * dt * Math.PI) / 180.0,
					vec3.fromValues(0.0, 1.0, 0.0)
				);
			}
			if (rotVec[0]) {
				mat4.rotate(
					rotMatrix,
					rotMatrix,
					(rotAmount * rotVec[0] * dt * Math.PI) / 180.0,
					rightVec
				);
			}
			let oldDir = this.game.rendering.camera.getDir();
			let newDir = vec3.transformMat4(vec3.create(), oldDir, rotMatrix);
			this.game.rendering.camera.setDir(newDir);
		}

		if (input.mouseClicked && !this.debugMenu.mouseOverGuiElement) {
			// Holding mousebutton
			let rotChange = vec3.create();
			let newPosition = null;
			let scaleChange = 0.0;
			let edited = false;
			if (input.keys["R"]) {
				if (input.keys["1"]) {
					rotChange[0] = input.mousePosition.x - this.lastMousePos[0];
				}
				if (input.keys["2"]) {
					rotChange[1] = input.mousePosition.x - this.lastMousePos[0];
				}
				if (input.keys["3"]) {
					rotChange[2] = input.mousePosition.x - this.lastMousePos[0];
				}
				edited = true;
				this.actionString = "Rotating";
			} else if (input.keys["T"]) {
				let ray = MousePicking.GetRay(this.game.rendering.camera);
				let dist: number = Infinity;

				dist = this.game.objectPlacer.rayCastToNonSelectedObjects(ray);

				if (dist >= 0.0 && dist < Infinity) {
					newPosition = vec3.add(
						vec3.create(),
						this.game.rendering.camera.getPosition(),
						vec3.scale(vec3.create(), ray.getDir(), dist)
					);
				}
				this.actionString = "Moving";
				edited = true;
			} else if (input.keys["Y"]) {
				scaleChange = (this.lastMousePos[1] - input.mousePosition.y) * 0.001;
				edited = true;
				this.actionString = "Scaling";
			}

			if (edited) {
				this.game.objectPlacer.updateCurrentlyEditingObject(
					rotChange,
					scaleChange,
					newPosition
				);
				this.checkpointTriggeredThisFrame = true;
				this.checkpointNeeded = true;
			} else if (!this.mouseWasPressed) {
				// If we clicked the mouse button this frame
				// Try to select a new object to edit
				let ray = MousePicking.GetRay(this.game.rendering.camera);
				this.game.objectPlacer.rayCastToSelectNewObject(ray);
				this.actionString = "Selected ";
			}

			this.mouseWasPressed = true;
		} else {
			this.mouseWasPressed = false;
			this.actionString = "Currently selected:";
		}

		if (input.keys["DELETE"]) {
			this.game.objectPlacer.deleteCurrentObject();
			this.actionString = "Deleted object";
			this.checkpointTriggeredThisFrame = true;
			this.checkpointNeeded = true;
		}

		if (input.keys["C"]) {
			if (!this.cWasPressed) {
				this.game.objectPlacer.duplicateCurrentObject();
				this.actionString = "Duplicated object";
				this.checkpointTriggeredThisFrame = true;
				this.checkpointNeeded = true;
			}
			this.cWasPressed = true;
		} else {
			this.cWasPressed = false;
		}
	}

	update(dt: number) {
		this.checkpointTriggeredThisFrame = false;

		if (document.activeElement == document.getElementById("content")) {
			this.handleInput(dt);
		}

		vec2.set(this.lastMousePos, input.mousePosition.x, input.mousePosition.y);

		let camPos = this.game.rendering.camera.getPosition();
		WebUtils.SetCookie(
			"debugPos",
			camPos[0] + "," + camPos[1] + "," + camPos[2]
		);
		let camDir = this.game.rendering.camera.getDir();
		WebUtils.SetCookie(
			"debugDir",
			camDir[0] + "," + camDir[1] + "," + camDir[2]
		);

		this.debugMenu.actionText.textString =
			this.actionString + " " + this.game.objectPlacer.getCurrentObjectType();

		this.debugMenu.update(dt);

		this.game.ecsManager.update(0.0);

		if (this.checkpointNeeded && !this.checkpointTriggeredThisFrame) {
			this.game.objectPlacer.makeCheckpoint();
			this.checkpointNeeded = false;
		}
	}

	prepareDraw(dt: number): void {
		this.game.prepareDraw(dt, false);
	}

	draw() {
		this.game.rendering.draw();
		this.debugMenu.draw();
		input.drawTouchControls();
	}
}
