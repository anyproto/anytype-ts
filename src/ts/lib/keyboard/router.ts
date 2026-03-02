import { KeyboardZone, KeyboardZoneType } from './zone';

class KeyboardRouter {

	private stack: KeyboardZone[] = [];
	private listener: ((e: KeyboardEvent) => void) | null = null;

	init () {
		this.destroy();

		this.listener = (e: KeyboardEvent) => this.handleEvent(e);
		window.addEventListener('keydown', this.listener, true);
	};

	destroy () {
		if (this.listener) {
			window.removeEventListener('keydown', this.listener, true);
			this.listener = null;
		};

		this.stack = [];
	};

	pushZone (zone: KeyboardZone): () => void {
		const existing = this.stack.find(z => z.id === zone.id);
		if (existing) {
			this.popZone(zone.id);
		};

		const prev = this.getActiveZone();
		if (prev?.onDeactivate) {
			prev.onDeactivate();
		};

		this.stack.push(zone);

		if (zone.onActivate) {
			zone.onActivate();
		};

		return () => this.popZone(zone.id);
	};

	popZone (id: string) {
		const idx = this.stack.findIndex(z => z.id === id);
		if (idx === -1) {
			return;
		};

		const zone = this.stack[idx];
		const wasActive = idx === this.stack.length - 1;

		if (wasActive && zone.onDeactivate) {
			zone.onDeactivate();
		};

		this.stack.splice(idx, 1);

		if (wasActive) {
			const newActive = this.getActiveZone();
			if (newActive?.onActivate) {
				newActive.onActivate();
			};
		};
	};

	pushMenuZone (menuId: string, handler: (e: any) => void) {
		this.pushZone({
			id: `menu:${menuId}`,
			type: KeyboardZoneType.Menu,
			onKeyDown: (e: KeyboardEvent) => {
				handler(e);
				return true;
			},
		});
	};

	popMenuZone (menuId: string) {
		this.popZone(`menu:${menuId}`);
	};

	pushPageZone (pageId: string, handler: (e: any) => void) {
		this.pushZone({
			id: `page:${pageId}`,
			type: KeyboardZoneType.Page,
			onKeyDown: (e: KeyboardEvent) => {
				handler(e);
				return false;
			},
		});
	};

	popPageZone (pageId: string) {
		this.popZone(`page:${pageId}`);
	};

	pushPopupZone (popupId: string, handler: (e: any) => void) {
		this.pushZone({
			id: `popup:${popupId}`,
			type: KeyboardZoneType.Popup,
			onKeyDown: (e: KeyboardEvent) => {
				handler(e);
				return true;
			},
		});
	};

	popPopupZone (popupId: string) {
		this.popZone(`popup:${popupId}`);
	};

	getActiveZone (): KeyboardZone | undefined {
		return this.stack.length ? this.stack[this.stack.length - 1] : undefined;
	};

	hasZoneOfType (type: KeyboardZoneType): boolean {
		return this.stack.some(z => z.type === type);
	};

	getZonesOfType (type: KeyboardZoneType): KeyboardZone[] {
		return this.stack.filter(z => z.type === type);
	};

	getZoneById (id: string): KeyboardZone | undefined {
		return this.stack.find(z => z.id === id);
	};

	getStack (): KeyboardZone[] {
		return [...this.stack];
	};

	private handleEvent (e: KeyboardEvent) {
		for (let i = this.stack.length - 1; i >= 0; i--) {
			const zone = this.stack[i];

			if (zone.onKeyDown(e)) {
				return;
			};
		};
	};

};

export const router = new KeyboardRouter();
