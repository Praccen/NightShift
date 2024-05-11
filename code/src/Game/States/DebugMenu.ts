import { ComponentTypeEnum } from "../../Engine/ECS/Components/Component";
import Div from "../../Engine/Rendering/GUI/Objects/Div";
import TextObject2D from "../../Engine/Rendering/GUI/Objects/Text/TextObject2D";
import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";
import { StatesEnum } from "../../Engine/States/State";
import { windowInfo } from "../../main";
import { StateAccessible, input } from "../GameMachine";
import DebugMode from "./DebugMode";
import Game from "./Game";
import { quat, vec2, vec3 } from "gl-matrix";

export default class DebugMenu {
	private overlay: OverlayRendering;
	private stateAccessible: StateAccessible;
	private game: Game;

	private placementMenu: Div;
	private movingPlacementBox: Boolean;

	private entitiesBox: Div;
	private movingEntitiesBox: boolean;

	private propsBox: Div;
	private movingPropsBox;
	private propsVisibleMemory: Map<ComponentTypeEnum, boolean>;

	private hidden: boolean;

	mouseOverGuiElement: boolean;
	actionText: TextObject2D;

	constructor(stateAccessible: StateAccessible, game: Game, debugMode: DebugMode) {
		this.overlay = new OverlayRendering();
		this.stateAccessible = stateAccessible;
		this.game = game;

		this.mouseOverGuiElement = false;

		let downloadOctreesButton = this.overlay.getNewButton();
		downloadOctreesButton.position[0] = 0.8;
		downloadOctreesButton.position[1] = 0.1;
		downloadOctreesButton.center = true;
		downloadOctreesButton.textSize = 40;
		downloadOctreesButton.textString = "Download \nOctrees";

		let self = this;
		downloadOctreesButton.onClick(function () {
			self.stateAccessible.meshStore.downloadOctrees();
		});

		let downloadTransformsButton = this.overlay.getNewButton();
		downloadTransformsButton.position[0] = 0.6;
		downloadTransformsButton.position[1] = 0.1;
		downloadTransformsButton.center = true;
		downloadTransformsButton.textSize = 40;
		downloadTransformsButton.textString = "Download \nTransforms";

		downloadTransformsButton.onClick(function () {
			self.game.objectPlacer.downloadTransforms();
		});

		let menuButton = this.overlay.getNewButton();
		menuButton.position[0] = 0.4;
		menuButton.position[1] = 0.1;
		menuButton.center = true;
		menuButton.textSize = 40;
		menuButton.textString = "Menu";

		menuButton.onClick(function () {
			debugMode.gotoState = StatesEnum.MAINMENU;
		});

		this.placementMenu = this.overlay.getNewDiv();
		this.placementMenu.getElement().style.backgroundColor = "gray";
		this.placementMenu.getElement().style.opacity = "70%";
		this.placementMenu.position[0] = 0.01;
		this.placementMenu.position[1] = 0.03;
		this.placementMenu.getElement().style.borderRadius = "5px";
		this.placementMenu.getElement().style.maxHeight = "50%";
		this.placementMenu.getElement().style.overflowY = "auto";
		this.placementMenu.getElement().style.resize = "vertical";
		// Prevent picking through gui element (also don't update the properties box when hovering the properties window)
		this.placementMenu.getElement().onmouseenter = () => {
			this.mouseOverGuiElement = true;
		};
		this.placementMenu.getElement().onmouseleave = () => {
			if (!input.mouseClicked) {
				this.mouseOverGuiElement = false;
			}
		};

		let placementMenuText = this.overlay.getNew2DText(this.placementMenu);
		placementMenuText.textString = "Placement menu";
		placementMenuText.getElement().style.backgroundColor = "dimgray";
		placementMenuText.getElement().style.width = "100%";
		placementMenuText.getElement().style.cursor = "move";
		placementMenuText.getElement().style.borderRadius = "5px";
		placementMenuText.getElement().onmousedown = () => {
			this.movingPlacementBox = true;
		};

		this.actionText = this.overlay.getNew2DText();
		this.actionText.position[0] = 0.4;
		this.actionText.position[1] = 0.01;
		this.actionText.size = 20;

		this.entitiesBox = this.overlay.getNewDiv();
		this.entitiesBox.getElement().style.backgroundColor = "gray";
		this.entitiesBox.getElement().style.opacity = "70%";
		this.entitiesBox.position[0] = 0.88;
		this.entitiesBox.position[1] = 0.03;
		this.entitiesBox.getElement().style.borderRadius = "5px";
		this.entitiesBox.getElement().style.height = "50%";
		this.entitiesBox.getElement().style.maxHeight = "100%";
		this.entitiesBox.getElement().style.overflowY = "auto";
		this.entitiesBox.getElement().style.resize = "vertical";
		// Prevent picking through gui element (also don't update the properties box when hovering the properties window)
		this.entitiesBox.getElement().onmouseenter = () => {
			this.mouseOverGuiElement = true;
		};
		this.entitiesBox.getElement().onmouseleave = () => {
			if (!input.mouseClicked) {
				this.mouseOverGuiElement = false;
			}
		};

		let entitiesText = this.overlay.getNew2DText(this.entitiesBox);
		entitiesText.textString = "Entities";
		entitiesText.getElement().style.backgroundColor = "dimgray";
		entitiesText.getElement().style.width = "100%";
		entitiesText.getElement().style.cursor = "move";
		entitiesText.getElement().style.borderRadius = "5px";
		entitiesText.getElement().onmousedown = () => {
			this.movingEntitiesBox = true;
		};

		this.propsBox = this.overlay.getNewDiv();
		this.propsBox.getElement().style.backgroundColor = "gray";
		this.propsBox.getElement().style.opacity = "70%";
		this.propsBox.position[0] = 0.01;
		this.propsBox.position[1] = 0.55;
		this.propsBox.getElement().style.borderRadius = "5px";
		this.propsBox.getElement().style.height = "40%";
		this.propsBox.getElement().style.maxHeight = "100%";
		this.propsBox.getElement().style.overflowY = "auto";
		this.propsBox.getElement().style.resize = "vertical";
		// Prevent picking through gui element (also don't update the properties box when hovering the properties window)
		this.propsBox.getElement().onmouseenter = () => {
			this.mouseOverGuiElement = true;
		};
		this.propsBox.getElement().onmouseleave = () => {
			if (!input.mouseClicked) {
				this.mouseOverGuiElement = false;
			}
		};

		let propertiesText = this.overlay.getNew2DText(this.propsBox);
		propertiesText.textString = "Properties";
		propertiesText.getElement().style.backgroundColor = "dimgray";
		propertiesText.getElement().style.width = "100%";
		propertiesText.getElement().style.cursor = "move";
		propertiesText.getElement().style.borderRadius = "5px";
		propertiesText.getElement().onmousedown = () => {
			this.movingPropsBox = true;
		};

		this.propsVisibleMemory = new Map<ComponentTypeEnum, boolean>();
		for (let comp of Object.keys(ComponentTypeEnum).filter((v) => isNaN(Number(v)))) {
			let compBtn = this.overlay.getNewButton(this.propsBox);
			compBtn.textString = comp;
			compBtn.textSize = 20;
			compBtn.scaleWithWindow = true;
			compBtn.getInputElement().className = "listButton";
			compBtn.getElement().style.width = "100%";

			let compPropDiv = this.overlay.getNewDiv(this.propsBox);

			compBtn.onClick(() => {
				let hiddenStatus = compPropDiv.toggleHidden();
				this.propsVisibleMemory.set(ComponentTypeEnum[comp], hiddenStatus);
			});
			compPropDiv.setHidden(true);
			compBtn.setHidden(false);

			this.propsVisibleMemory.set(ComponentTypeEnum[comp], true);
		}

		let consoleCommandsTextEdit = this.overlay.getNewEditText();
		consoleCommandsTextEdit.position[0] = 0.5;
		consoleCommandsTextEdit.position[1] = 0.97;
		consoleCommandsTextEdit.center = true;
		consoleCommandsTextEdit.getElement().style.width = "80%";
		consoleCommandsTextEdit.getInputElement().style.width = "100%";

		consoleCommandsTextEdit.getInputElement().addEventListener("change", (ev) => {
			self.parseConsoleInput(consoleCommandsTextEdit.getInputElement().value);
			consoleCommandsTextEdit.getInputElement().value = "";
		});

		consoleCommandsTextEdit.getElement().onmouseenter = () => {
			this.mouseOverGuiElement = true;
		};
		consoleCommandsTextEdit.getElement().onmouseleave = () => {
			if (!input.mouseClicked) {
				this.mouseOverGuiElement = false;
			}
		};

		this.hidden = true;
	}

	async init() {
		this.overlay.show();
		this.hidden = false;

		// Force the entities box to reload.
		let length = this.entitiesBox.children.length;
		if (length > 1) {
			this.entitiesBox.children[1].remove();
			this.entitiesBox.children.splice(1, 1);
		}
	}

	private parseConsoleInput(input: string) {
		if (input.startsWith("r ")) {
			// r x 45.2  should rotate current object by 45.2 degrees around x axis
			const args = input.split(" ");
			if (args.length == 3) {
				const index = ["x", "y", "z"].findIndex((string) => {
					return string == args[1];
				});
				if (index != -1) {
					const degrees = parseFloat(args[2]);
					let rotChange = vec3.create();
					rotChange[index] = degrees;
					this.game.objectPlacer.updateCurrentlyEditingObject(rotChange, 0, null);
				}
			}
		}
	}

	update(dt: number) {
		// Moving of boxes
		if (!input.mouseClicked) {
			this.movingPlacementBox = false;
			this.movingEntitiesBox = false;
			this.movingPropsBox = false;
		}

		if (this.movingPlacementBox) {
			vec2.set(
				this.placementMenu.position,
				input.mousePositionOnCanvas.x / windowInfo.resolutionWidth,
				input.mousePositionOnCanvas.y / windowInfo.resolutionHeight
			);
		}

		if (this.movingEntitiesBox) {
			vec2.set(
				this.entitiesBox.position,
				input.mousePositionOnCanvas.x / windowInfo.resolutionWidth,
				input.mousePositionOnCanvas.y / windowInfo.resolutionHeight
			);
		}

		if (this.movingPropsBox) {
			vec2.set(
				this.propsBox.position,
				input.mousePositionOnCanvas.x / windowInfo.resolutionWidth,
				input.mousePositionOnCanvas.y / windowInfo.resolutionHeight
			);
		}

		// Update the placement menu if it is not synced with placements (+1 is because there is a text child as well)
		if (this.placementMenu.children.length != this.game.objectPlacer.placements.size + 1) {
			for (let i = 1; i < this.placementMenu.children.length; i++) {
				this.placementMenu.children[i].remove();
				this.placementMenu.children.splice(i, 1);
				i--;
			}

			this.game.objectPlacer.placements.forEach((value, key) => {
				let objectSelector = this.overlay.getNewButton(this.placementMenu);
				objectSelector.textString = key.substring(key.lastIndexOf("/") + 1);
				objectSelector.textSize = 20;
				objectSelector.scaleWithWindow = true;
				objectSelector.getInputElement().className = "listButton";
				objectSelector.getElement().style.width = "100%";
				objectSelector.onClick(() => {
					this.game.objectPlacer.placeObject(
						key,
						vec3.create(),
						vec3.fromValues(1.0, 1.0, 1.0),
						quat.create(),
						vec3.create()
					);
				});
			});
		}

		// Update the entities menu
		if (this.entitiesBox.children.length != this.game.ecsManager.entities.length + 1) {
			for (let i = 1; i < this.entitiesBox.children.length; i++) {
				this.entitiesBox.children[i].remove();
				this.entitiesBox.children.splice(i, 1);
				i--;
			}

			this.game.ecsManager.entities.forEach((e) => {
				let entityBtn = this.overlay.getNewButton(this.entitiesBox);
				entityBtn.textString = "" + e.id;
				entityBtn.textSize = 20;
				entityBtn.scaleWithWindow = true;
				entityBtn.getInputElement().className = "listButton";
				entityBtn.getElement().style.width = "100%";

				entityBtn.onClick(() => {
					this.game.objectPlacer.selectNewObjectFromEntityId(e.id);
				});
			});
		}

		for (let i = 1; i < this.entitiesBox.children.length; i++) {
			let eChild = this.entitiesBox.children[i];
			eChild.getElement().style.backgroundColor = "transparent";

			if (
				this.game.objectPlacer.currentlyEditingEntityId != undefined &&
				eChild.textString == "" + this.game.objectPlacer.currentlyEditingEntityId
			) {
				eChild.getElement().style.backgroundColor = "dimgray";
			}
		}

		if (this.game.objectPlacer.currentlyEditingEntityId != undefined) {
			let entity = this.game.ecsManager.getEntity(this.game.objectPlacer.currentlyEditingEntityId);

			for (let i = 1; i < this.propsBox.children.length; i += 2) {
				if (
					entity != undefined &&
					entity.hasComponent(ComponentTypeEnum[this.propsBox.children[i].textString])
				) {
					this.propsBox.children[i].setHidden(false);
					let hiddenStatus = this.propsVisibleMemory.get(
						ComponentTypeEnum[this.propsBox.children[i].textString]
					);
					if (hiddenStatus != undefined) {
						this.propsBox.children[i + 1].setHidden(hiddenStatus);
					}
					entity
						.getComponent(ComponentTypeEnum[this.propsBox.children[i].textString])
						.updateGui(this.overlay, this.propsBox, this.game.objectPlacer);
				} else {
					this.propsBox.children[i].setHidden(true);
					this.propsBox.children[i + 1].setHidden(true);
				}
			}
		} else {
			for (let i = 1; i < this.propsBox.children.length; i++) {
				this.propsBox.children[i].setHidden(true);
			}
		}
	}

	reset() {
		this.overlay.hide();
		this.hidden = true;
	}

	toggleHidden() {
		if (this.hidden) {
			this.overlay.show();
			this.hidden = false;
		} else {
			this.overlay.hide();
			this.hidden = true;
		}
	}

	draw() {
		this.overlay.draw();
	}
}
