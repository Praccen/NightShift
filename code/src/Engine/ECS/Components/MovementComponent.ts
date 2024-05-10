import { quat, vec3 } from "gl-matrix";
import { Component, ComponentTypeEnum } from "./Component";

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
}
