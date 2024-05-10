import { vec3 } from "gl-matrix";
import { Component, ComponentTypeEnum } from "./Component";

export default class CameraFocusComponent extends Component {
	offset: vec3;
	focusPoint: vec3;

	constructor() {
		super(ComponentTypeEnum.CAMERAFOCUS);
		this.offset = vec3.fromValues(0.0, 1.0, -1.0);
		this.focusPoint = vec3.create();
	}
}
