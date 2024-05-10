import { vec2 } from "gl-matrix";
import GuiObject from "./GuiObject";

export default class Div extends GuiObject {
	position: vec2;
	size: number;
	children: Array<GuiObject>;

	constructor(parentDiv?: Div) {
		super(parentDiv);

		this.position = vec2.create();
		this.size = 42;
		this.children = new Array<GuiObject>();
	}

	appendChild(childObj: GuiObject) {
		this.children.push(childObj);
		this.div.appendChild(childObj.getElement());
	}

	draw(): void {
		this.position2D = this.position;
		this.fontSize = this.size;
		this.drawObject();
	}
}
