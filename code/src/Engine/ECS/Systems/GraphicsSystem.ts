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
			let posComp = <PositionComponent>e.getComponent(ComponentTypeEnum.POSITION);

			let graphComp = <GraphicsComponent>e.getComponent(ComponentTypeEnum.GRAPHICS);

			if (graphComp && posComp) {
				graphComp.bundle.modelMatrix = posComp.matrix;
			}

			let pointLightComp = <PointLightComponent>e.getComponent(ComponentTypeEnum.POINTLIGHT);

			if (pointLightComp && (posComp)) {
				vec3.transformMat4(pointLightComp.pointLight.position, pointLightComp.posOffset, posComp.matrix);
			}
		}
	}
}
