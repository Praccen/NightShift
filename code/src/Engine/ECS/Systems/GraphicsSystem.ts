import System from "./System";
import GraphicsComponent from "../Components/GraphicsComponent";
import { ComponentTypeEnum } from "../Components/Component";
import PositionComponent from "../Components/PositionComponent";
import PointLightComponent from "../Components/PointLightComponent";
import PositionParentComponent from "../Components/PositionParentComponent";
import { ECSUtils } from "../../Utils/ESCUtils";
import { mat4, vec3 } from "gl-matrix";

export default class GraphicsSystem extends System {
	constructor() {
		super([ComponentTypeEnum.POSITION]);
		// Optional ComponentTypeEnum.GRAPHICS, ComponentTypeEnum.POINTLIGHT, ComponentTypeEnun.POSITIONPARENT
	}

	update(dt: number) {
		for (const e of this.entities) {
			let posComp = <PositionComponent>(
				e.getComponent(ComponentTypeEnum.POSITION)
			);

			let graphComp = <GraphicsComponent>(
				e.getComponent(ComponentTypeEnum.GRAPHICS)
			);

			let posParentComp = <PositionParentComponent>(
				e.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);

			if (graphComp && posComp) {
				mat4.identity(graphComp.object.modelMatrix);

				if (posParentComp) {
					posParentComp.calculateMatrix(graphComp.object.modelMatrix);
					mat4.copy(posParentComp.matrix, graphComp.object.modelMatrix);
				}

				posComp.calculateMatrix(graphComp.object.modelMatrix);
			}

			let pointLightComp = <PointLightComponent>(
				e.getComponent(ComponentTypeEnum.POINTLIGHT)
			);

			if (pointLightComp && (posComp || posParentComp)) {
				vec3.add(
					pointLightComp.pointLight.position,
					ECSUtils.CalculatePosition(e),
					pointLightComp.posOffset
				);
			}
		}
	}
}
