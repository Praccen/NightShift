import { vec2 } from "gl-matrix";
import Div from "../Div";
import GuiObject from "../GuiObject";

export default class TextObject2D extends GuiObject {
	position: vec2;
	size: number;

	constructor(parentDiv?: Div) {
		super(parentDiv);

		this.position = vec2.create();
		this.size = 42;
	}

	draw(): void {
		this.position2D = this.position;
		this.fontSize = this.size;
		this.div.textContent = this.textString;
		this.drawObject();
	}
}
