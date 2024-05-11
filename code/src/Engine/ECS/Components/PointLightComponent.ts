import { vec3 } from "gl-matrix";
import ObjectPlacer from "../../../Game/ObjectPlacer";
import Game from "../../../Game/States/Game";
import Div from "../../Rendering/GUI/Objects/Div";
import PointLight from "../../Rendering/Lighting/PointLight";
import { OverlayRendering } from "../../Rendering/GUI/OverlayRendering";
import { Component, ComponentTypeEnum } from "./Component";

export default class PointLightComponent extends Component {
	pointLight: PointLight;
	posOffset: vec3;

	constructor(pointLight: PointLight) {
		super(ComponentTypeEnum.POINTLIGHT);
		this.pointLight = pointLight;
		this.posOffset = vec3.create();
	}

	destructor(): void {
		Game.getInstanceNoSa().rendering.scene.deletePointLight(this.pointLight);
	}

	updateGui(overlayRendering: OverlayRendering, parentDiv: Div, objectPlacer: ObjectPlacer) {
		for (let i = 1; i < parentDiv.children.length; i++) {
			if (parentDiv.children[i].textString == ComponentTypeEnum[this.type]) {
				// Next should be a div that should hold the text edits
				if ((<Div>parentDiv.children[i + 1]).children.length == 0) {
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"R",
						["pointLight", "colour"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"G",
						["pointLight", "colour"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"B",
						["pointLight", "colour"],
						2
					);

					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"PosOffsetX",
						["posOffset"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"PosOffsetY",
						["posOffset"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"PosOffsetZ",
						["posOffset"],
						2
					);

					this.addCheckbox(overlayRendering, <Div>parentDiv.children[i + 1], "CastShadow", [
						"pointLight",
						"castShadow",
					]);
				} else {
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "R", ["pointLight", "colour"], 0);
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "G", ["pointLight", "colour"], 1);
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "B", ["pointLight", "colour"], 2);

					this.updateTextEdit(<Div>parentDiv.children[i + 1], "PosOffsetX", ["posOffset"], 0);
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "PosOffsetY", ["posOffset"], 1);
					this.updateTextEdit(<Div>parentDiv.children[i + 1], "PosOffsetZ", ["posOffset"], 2);

					this.updateCheckbox(<Div>parentDiv.children[i + 1], "CastShadow", [
						"pointLight",
						"castShadow",
					]);
				}
			}
		}
	}
}
