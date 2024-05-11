import { quat, vec3 } from "gl-matrix";
import { Component, ComponentTypeEnum } from "./Component";
import { OverlayRendering } from "../../Rendering/GUI/OverlayRendering";
import Div from "../../Rendering/GUI/Objects/Div";
import ObjectPlacer from "../../../Game/ObjectPlacer";

export default class MovementComponent extends Component {
	constantAcceleration: vec3;
	accelerationDirection: vec3;
	acceleration: number;
	velocity: vec3;
	drag: number;
	onGround: boolean;
	jumpPower: number;
	jumpRequested: boolean;
	jumpAllowed: boolean;
	momentum: quat;

	constructor() {
		super(ComponentTypeEnum.MOVEMENT);
		this.constantAcceleration = vec3.fromValues(0.0, -9.8, 0.0);
		this.accelerationDirection = vec3.create();
		this.acceleration = 6.0;
		this.velocity = vec3.create();
		this.drag = 4.0;
		this.onGround = false;
		this.jumpPower = 5.0;
		this.jumpRequested = false;
		this.jumpAllowed = false;
		this.momentum = quat.create();
	}

	updateGui(overlayRendering: OverlayRendering, parentDiv: Div, objectPlacer: ObjectPlacer) {
		for (let i = 1; i < parentDiv.children.length; i++) {
			if (parentDiv.children[i].textString == ComponentTypeEnum[this.type]) {
				// Next should be a div that should hold the text edits
				if ((<Div>parentDiv.children[i + 1]).children.length == 0) {
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"VelX",
						["velocity"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"VelY",
						["velocity"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"VelZ",
						["velocity"],
						2
					);
				} else {
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "VelX", ["velocity"], 0);
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "VelY", ["velocity"], 1);
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "VelZ", ["velocity"], 2);
				}
			}
		}
	}
}
