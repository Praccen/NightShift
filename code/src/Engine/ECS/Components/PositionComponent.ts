import { Component, ComponentTypeEnum } from "./Component";
import Div from "../../Rendering/GUI/Objects/Div";
import { OverlayRendering } from "../../Rendering/GUI/OverlayRendering";
import ObjectPlacer from "../../../Game/ObjectPlacer";
import EditText from "../../Rendering/GUI/Objects/Text/EditText";
import { mat4, quat, vec3 } from "gl-matrix";

export default class PositionComponent extends Component {
	position: vec3;
	rotation: quat;
	scale: vec3;
	origin: vec3;

	matrix: mat4;

	constructor(componentType?: ComponentTypeEnum) {
		super(componentType ? componentType : ComponentTypeEnum.POSITION);

		this.position = vec3.create();
		this.rotation = quat.create();
		this.scale = vec3.fromValues(1.0, 1.0, 1.0);
		this.origin = vec3.create();

		this.matrix = mat4.create();
	}

	calculateMatrix(matrix: mat4) {
		mat4.translate(matrix, matrix, this.position);
		mat4.multiply(matrix, matrix, mat4.fromQuat(mat4.create(), this.rotation));
		mat4.scale(matrix, matrix, this.scale);
		mat4.translate(matrix, matrix, vec3.negate(vec3.create(), this.origin));
	}

	updateGui(
		overlayRendering: OverlayRendering,
		parentDiv: Div,
		objectPlacer: ObjectPlacer
	) {
		for (let i = 1; i < parentDiv.children.length; i++) {
			if (parentDiv.children[i].textString == ComponentTypeEnum[this.type]) {
				// Next should be a div that should hold the text edits
				if ((<Div>parentDiv.children[i + 1]).children.length == 0) {
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"PosX",
						["position"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"PosY",
						["position"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"PosZ",
						["position"],
						2
					);

					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"RotX",
						["rotation"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"RotY",
						["rotation"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"RotZ",
						["rotation"],
						2
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"RotW",
						["rotation"],
						3
					);

					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"ScaleX",
						["scale"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"ScaleY",
						["scale"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"ScaleZ",
						["scale"],
						2
					);

					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"OriginX",
						["origin"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"OriginY",
						["origin"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"OriginZ",
						["origin"],
						2
					);
				} else {
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"PosX",
						["position"],
						0
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"PosY",
						["position"],
						1
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"PosZ",
						["position"],
						2
					);

					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"RotX",
						["rotation"],
						0
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"RotY",
						["rotation"],
						1
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"RotZ",
						["rotation"],
						2
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"RotW",
						["rotation"],
						3
					);

					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"ScaleX",
						["scale"],
						0
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"ScaleY",
						["scale"],
						1
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"ScaleZ",
						["scale"],
						2
					);

					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"OriginX",
						["origin"],
						0
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"OriginY",
						["origin"],
						1
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"OriginZ",
						["origin"],
						2
					);
				}
			}
		}
	}
}
