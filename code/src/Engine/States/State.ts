export enum StatesEnum {
	STAY,
	LOADINGSCREEN,
	MAINMENU,
	OPTIONS,
	CONTROLS,
	GAME,
	DEBUGMODE,
	LEVELSELECT,
	INTRO,
	INTRO2,
	END,
}

export default class State {
	/*
	 * Set this to the enum for the state you want the state machine to move to.
	 * Leave it at STAY to keep running the current state.
	 */
	gotoState: StatesEnum;
	initialized: boolean;

	constructor() {
		this.gotoState = StatesEnum.STAY;
		this.initialized = false;
	}

	async init() {}

	reset() {}

	onExit(e: BeforeUnloadEvent) {}

	update(dt: number) {}

	prepareDraw(dt: number) {}

	draw() {}
}
