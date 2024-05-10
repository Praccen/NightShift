import { ComponentTypeEnum } from "./Component";
import PositionComponent from "./PositionComponent";

export default class PositionParentComponent extends PositionComponent {
	constructor() {
		super(ComponentTypeEnum.POSITIONPARENT);
	}
}
