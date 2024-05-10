import { Component, ComponentTypeEnum } from "./Components/Component";

export default class Entity {
	public readonly id: number;
	components: Array<Component>;

	constructor(id: number) {
		this.id = id;
		this.components = new Array<Component>();
	}

	hasComponent(type: ComponentTypeEnum): boolean {
		return this.components.some((c) => c.type == type);
	}

	getComponent(type: ComponentTypeEnum): Component {
		return this.components.find((c) => c.type == type);
	}
}
