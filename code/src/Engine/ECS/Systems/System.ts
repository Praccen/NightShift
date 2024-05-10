import { ComponentTypeEnum } from "../Components/Component";
import Entity from "../Entity";

export default class System {
	protected entities: Array<Entity>;
	protected requiredComponents: Array<ComponentTypeEnum>;

	constructor(componentTypes: Array<ComponentTypeEnum>) {
		this.requiredComponents = componentTypes;
		this.entities = new Array<Entity>();
	}

	entityHasCorrectComponents(entity: Entity): boolean {
		for (const type of this.requiredComponents) {
			if (!entity.hasComponent(type)) {
				return false;
			}
		}

		return true;
	}

	addEntity(entity: Entity): boolean {
		if (this.entityHasCorrectComponents(entity)) {
			this.entities.push(entity);
			return true;
		}
		return false;
	}

	containsEntity(entityId: number) {
		return this.entities.some((c) => c.id == entityId);
	}

	removeFaultyEntity(entityId: number) {
		const index = this.entities.findIndex((c) => c.id == entityId);
		if (index != -1) {
			if (!this.entityHasCorrectComponents(this.entities[index])) {
				this.entities.splice(index, 1);
			}
		}
	}

	removeEntity(entityId: number) {
		const index = this.entities.findIndex((c) => c.id == entityId);
		if (index != -1) {
			this.entities.splice(index, 1);
		}
	}

	update(dt: number) {
		// Pure virtual possible?
	}
}
