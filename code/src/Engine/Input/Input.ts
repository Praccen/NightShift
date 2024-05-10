import { vec2 } from "gl-matrix";
import { windowInfo } from "../../main";
import TextObject2D from "../Rendering/GUI/Objects/Text/TextObject2D";

export default class Input {
	keys: boolean[];
	buttons: Map<string, boolean>;
	gamepads: Gamepad[];
	mousePosition: { x: number; y: number; previousX: number; previousY: number };
	mousePositionOnCanvas: {
		x: number;
		y: number;
		previousX: number;
		previousY: number;
	};
	mouseClicked: boolean;
	mouseRightClicked: boolean;

	simulateTouchBasedOnMouse: boolean;

	touchUsed: boolean;
	joystickLeftDirection: vec2;
	joystickRightDirection: vec2;
	repositionTouchControls: boolean;
	private joystickLeftRadius: number;
	private joystickRightRadius: number;
	private screenAspectRatio: number;

	private joystickLeftCenter: TextObject2D;
	private joystickLeftBorder: TextObject2D;
	private joystickRightCenter: TextObject2D;
	private joystickRightBorder: TextObject2D;

	private buttonRadius: number;
	private aButton: TextObject2D;
	private bButton: TextObject2D;

	private mouseMovementSinceLast: vec2;

	constructor() {
		this.keys = [];
		this.buttons = new Map();
		this.gamepads = new Array<Gamepad>();
		this.mousePosition = { x: 0, y: 0, previousX: 0, previousY: 0 };
		this.mousePositionOnCanvas = { x: 0, y: 0, previousX: 0, previousY: 0 };
		this.mouseClicked = false;
		this.mouseRightClicked = false;

		this.mouseMovementSinceLast = vec2.create();

		this.simulateTouchBasedOnMouse = false;

		this.touchUsed = false;

		//----Controls----
		// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values <-- for key codes
		let self = this;
		document.addEventListener("keydown", function (event) {
			self.keys[event.key.toUpperCase()] = true;
			self.touchUsed = false;
		});

		document.addEventListener("keyup", function (event) {
			self.keys[event.key.toUpperCase()] = false;
			self.touchUsed = false;
		});

		document.addEventListener("mousemove", function (event) {
			self.mouseMoveCallBack(event);
			self.mouseMovementSinceLast[0] += event.movementX;
			self.mouseMovementSinceLast[1] += event.movementY;
			self.mousePosition = {
				x: event.clientX,
				y: event.clientY,
				previousX: self.mousePosition.x,
				previousY: self.mousePosition.y,
			};
			self.mousePositionOnCanvas = {
				x: self.mousePosition.x - windowInfo.paddingX,
				y: self.mousePosition.y - windowInfo.paddingY,
				previousX: self.mousePositionOnCanvas.x,
				previousY: self.mousePositionOnCanvas.y,
			};
			if (self.simulateTouchBasedOnMouse && self.mouseClicked) {
				self.handleTouch([event]);
			}
		});

		document.addEventListener("mousedown", (event) => {
			if (event.button == 0) {
				self.mouseClicked = true;
				if (self.simulateTouchBasedOnMouse) {
					self.handleTouch([event]);
				}
			} else if (event.button == 2) {
				self.mouseRightClicked = true;
			}
		});
		document.addEventListener("mouseup", (event) => {
			if (event.button == 0) {
				self.mouseClicked = false;
				if (self.simulateTouchBasedOnMouse) {
					self.handleTouch([]);
				}
			} else if (event.button == 2) {
				self.mouseRightClicked = false;
			}
		});

		document.addEventListener("touchstart", function (event) {
			self.handleTouch(event.touches);
		});
		document.addEventListener("touchmove", function (event) {
			event.preventDefault();
			self.handleTouch(event.touches);
		});
		document.addEventListener("touchend", function (event) {
			self.handleTouch(event.touches);
		});
		//----------------

		this.joystickLeftDirection = vec2.create();
		this.joystickRightDirection = vec2.create();
		this.repositionTouchControls = false;
		this.joystickLeftRadius = 0.1; // 10 % of the width
		this.joystickRightRadius = 0.1; // 10 % of the width
		this.screenAspectRatio = 16 / 9;

		this.joystickLeftBorder = new TextObject2D();
		this.joystickLeftBorder.center = true;
		this.joystickLeftBorder.scaleWithWindow = true;
		this.joystickLeftBorder.position = vec2.fromValues(0.15, 0.8);
		this.joystickLeftBorder.size = 1920 * this.joystickLeftRadius * 2.0;
		this.joystickLeftBorder.textString = "⊕";
		this.joystickLeftBorder.getElement().style.opacity = "50%";
		this.joystickLeftBorder.setHidden(true);

		this.joystickLeftCenter = new TextObject2D();
		this.joystickLeftCenter.center = true;
		this.joystickLeftCenter.scaleWithWindow = true;
		vec2.copy(this.joystickLeftCenter.position, this.joystickLeftBorder.position);
		this.joystickLeftCenter.size = 1920 * this.joystickLeftRadius;
		this.joystickLeftCenter.textString = "⚫";
		this.joystickLeftCenter.getElement().style.opacity = "50%";
		this.joystickLeftCenter.getElement().style.color = "red";
		this.joystickLeftCenter.setHidden(true);

		this.joystickRightBorder = new TextObject2D();
		this.joystickRightBorder.center = true;
		this.joystickRightBorder.scaleWithWindow = true;
		this.joystickRightBorder.position = vec2.fromValues(0.85, 0.8);
		this.joystickRightBorder.size = 1920 * this.joystickRightRadius * 2.0;
		this.joystickRightBorder.textString = "⊕";
		this.joystickRightBorder.getElement().style.opacity = "50%";
		this.joystickRightBorder.setHidden(true);

		this.joystickRightCenter = new TextObject2D();
		this.joystickRightCenter.center = true;
		this.joystickRightCenter.scaleWithWindow = true;
		vec2.copy(this.joystickRightCenter.position, this.joystickRightBorder.position);
		this.joystickRightCenter.size = 1920 * this.joystickRightRadius;
		this.joystickRightCenter.textString = "⚫";
		this.joystickRightCenter.getElement().style.opacity = "50%";
		this.joystickRightCenter.getElement().style.color = "red";
		this.joystickRightCenter.setHidden(true);

		this.buttonRadius = 0.05; // 5 % of the width

		this.aButton = new TextObject2D();
		this.aButton.center = true;
		this.aButton.scaleWithWindow = true;
		this.aButton.position[0] = 0.65;
		this.aButton.position[1] = 0.8;
		this.aButton.size = 1920 * this.buttonRadius * 2.0;
		this.aButton.textString = "🔴";
		this.aButton.getElement().style.opacity = "50%";
		this.aButton.setHidden(true);

		this.bButton = new TextObject2D();
		this.bButton.center = true;
		this.bButton.scaleWithWindow = true;
		this.bButton.position[0] = 0.75;
		this.bButton.position[1] = 0.55;
		this.bButton.size = 1920 * this.buttonRadius * 2.0;
		this.bButton.textString = "🔵";
		this.bButton.getElement().style.opacity = "50%";
		this.bButton.setHidden(true);
	}

	mouseMoveCallBack(event: MouseEvent) {
		// Overload this if you want direct controll of the events
	}

	handleTouch(touches) {
		this.touchUsed = true;

		let joystickLeftBeingUsed =
			this.joystickLeftDirection[0] != 0.0 ||
			this.joystickLeftDirection[1] != 0.0;

		this.joystickLeftDirection[0] = 0.0;
		this.joystickLeftDirection[1] = 0.0;

		let joystickRightBeingUsed =
			this.joystickRightDirection[0] != 0.0 ||
			this.joystickRightDirection[1] != 0.0;

		this.joystickRightDirection[0] = 0.0;
		this.joystickRightDirection[1] = 0.0;

		for (const key of this.buttons.keys()) {
			this.buttons.set(key, false);
		}

		var paddingX = windowInfo.paddingX;
		var paddingY = windowInfo.paddingY;
		let width = windowInfo.resolutionWidth;
		let height = windowInfo.resolutionHeight;

		let joystickLeftRadiusInPixels = width * this.joystickLeftRadius;
		let joystickLeftCenter = vec2.fromValues(
			paddingX + width * this.joystickLeftBorder.position[0],
			paddingY + height * this.joystickLeftBorder.position[1],
		); // In pixels

		let joystickRightRadiusInPixels = width * this.joystickRightRadius;
		let joystickRightCenter = vec2.fromValues(
			paddingX + width * this.joystickRightBorder.position[0],
			paddingY + height * this.joystickRightBorder.position[1],
		); // In pixels

		let aButtonCenter = vec2.fromValues(
			paddingX + width * this.aButton.position[0],
			paddingY + height * this.aButton.position[1],
		); // In pixels
		let bButtonCenter = vec2.fromValues(
			paddingX + width * this.bButton.position[0],
			paddingY + height * this.bButton.position[1],
		); // In pixels

		for (let touch of touches) {
			let touchPos = vec2.fromValues(touch.clientX, touch.clientY);

			// Handle touches not related to joystickLeft here, break if they are fulfilled
			if (
				vec2.dist(touchPos, aButtonCenter) <
				this.buttonRadius * width
			) {
				if (this.repositionTouchControls) {
					this.aButton.position[0] = (touchPos[0] - paddingX) / width;
					this.aButton.position[1] = (touchPos[1] - paddingY) / height;
				} else {
					this.buttons.set("A", true);
				}
				continue;
			}

			if (
				vec2.dist(touchPos, bButtonCenter) <
				this.buttonRadius * width
			) {
				if (this.repositionTouchControls) {
					this.bButton.position[0] = (touchPos[0] - paddingX) / width;
					this.bButton.position[1] = (touchPos[1] - paddingY) / height;
				} else {
					this.buttons.set("B", true);
				}
				continue;
			}

			// Handle joystickLeft
			let joystickLeftDistanceFromCenter = vec2.subtract(vec2.create(), touchPos, joystickLeftCenter);
			// If the joystickLeft was being used already, allow movement on the left size of the screen, otherwise allow movement within the joystickLeft border
			if (
				(joystickLeftBeingUsed ||
					vec2.len(joystickLeftDistanceFromCenter) < joystickLeftRadiusInPixels) &&
				touchPos[0] < paddingX + width * 0.5
			) {
				if (this.repositionTouchControls) {
					this.joystickLeftBorder.position[0] = (touchPos[0] - paddingX) / width;
					this.joystickLeftBorder.position[1] = (touchPos[1] - paddingY) / height;
				} else {
					this.joystickLeftDirection[0] =
						joystickLeftDistanceFromCenter[0] / joystickLeftRadiusInPixels;
					this.joystickLeftDirection[1] =
						joystickLeftDistanceFromCenter[1] / joystickLeftRadiusInPixels;
				}
			}
			// Handle joystickRight
			let joystickRightDistanceFromCenter = vec2.subtract(vec2.create(), touchPos, joystickRightCenter);
			// If the joystickRight was being used already, allow movement on the left size of the screen, otherwise allow movement within the joystickRight border
			if (
				(joystickRightBeingUsed ||
					vec2.len(joystickRightDistanceFromCenter) <
						joystickRightRadiusInPixels) &&
				touchPos[0] > paddingX + width * 0.5
			) {
				if (this.repositionTouchControls) {
					this.joystickRightBorder.position[0] = (touchPos[0] - paddingX) / width;
					this.joystickRightBorder.position[1] =
						(touchPos[1] - paddingY) / height;
				} else {
					this.joystickRightDirection[0] =
						joystickRightDistanceFromCenter[0] / joystickRightRadiusInPixels;
					this.joystickRightDirection[1] =
						joystickRightDistanceFromCenter[1] / joystickRightRadiusInPixels;
				}
			}
		}
	}

	getMouseMovement(): vec2 {
		let diff = vec2.clone(this.mouseMovementSinceLast);
		vec2.set(this.mouseMovementSinceLast, 0.0, 0.0);
		return diff;
	}

	updateGamepad() {
		if (window.isSecureContext) {
			this.gamepads = navigator.getGamepads();

			for (const gp of this.gamepads) {
				if (!gp) {
					continue;
				}

				this.touchUsed = false;
				if (Math.abs(gp.axes[0]) > 0.1) {
					this.joystickLeftDirection[0] = gp.axes[0];
				} else {
					this.joystickLeftDirection[0] = 0.0;
				}

				if (Math.abs(gp.axes[1]) > 0.1) {
					this.joystickLeftDirection[1] = gp.axes[1];
				} else {
					this.joystickLeftDirection[1] = 0.0;
				}

				this.touchUsed = false;
				if (Math.abs(gp.axes[2]) > 0.1) {
					this.joystickRightDirection[0] = gp.axes[2];
				} else {
					this.joystickRightDirection[0] = 0.0;
				}

				if (Math.abs(gp.axes[3]) > 0.1) {
					this.joystickRightDirection[1] = gp.axes[3];
				} else {
					this.joystickRightDirection[1] = 0.0;
				}

				for (const key of this.buttons.keys()) {
					this.buttons.set(key, false);
				}

				if (gp.buttons[0].value > 0.5) {
					this.buttons.set("A", true);
					console.log("Pressed A");
				}
				if (gp.buttons[1].value > 0.5) {
					this.buttons.set("B", true);
					console.log("Pressed B");
				}
			}
		}
	}

	drawTouchControls() {
		this.joystickLeftBorder.setHidden(!this.touchUsed);
		this.joystickLeftCenter.setHidden(!this.touchUsed);
		this.joystickRightBorder.setHidden(!this.touchUsed);
		this.joystickRightCenter.setHidden(!this.touchUsed);
		this.aButton.setHidden(!this.touchUsed);
		this.bButton.setHidden(!this.touchUsed);
		if (this.touchUsed) {
			this.joystickLeftCenter.position[0] =
				this.joystickLeftBorder.position[0] +
				this.joystickLeftDirection[0] * this.joystickLeftRadius;
			this.joystickLeftCenter.position[1] =
				this.joystickLeftBorder.position[1] +
				this.joystickLeftDirection[1] *
					(this.joystickLeftRadius * this.screenAspectRatio) -
				0.01;
			this.joystickRightCenter.position[0] =
				this.joystickRightBorder.position[0] +
				this.joystickRightDirection[0] * this.joystickRightRadius;
			this.joystickRightCenter.position[1] =
				this.joystickRightBorder.position[1] +
				this.joystickRightDirection[1] *
					(this.joystickRightRadius * this.screenAspectRatio) -
				0.01;

			this.joystickLeftBorder.draw();
			this.joystickLeftCenter.draw();
			this.joystickRightBorder.draw();
			this.joystickRightCenter.draw();
			this.aButton.draw();
			this.bButton.draw();
		}
	}
}
