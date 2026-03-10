import { FocusedPanel } from './router';
import { KeyboardZoneType } from './zone';
import { keyboard, Key } from 'Lib';

export enum GroupDirection {
	Horizontal = 'h',
	Vertical = 'v',
};

export interface GroupRegistration {
	id: string;
	panel: FocusedPanel;
	direction: GroupDirection;
	getContainer: () => HTMLElement | null;
	itemSelector: string;
	onEnter?: (item: HTMLElement) => boolean;
	onLeft?: (item: HTMLElement) => boolean;
	onRight?: (item: HTMLElement) => boolean;
	getItemCount?: () => number;
	scrollToIndex?: (idx: number) => void;
	getItemElement?: (index: number) => HTMLElement | null;
};

type OverflowHandler = (direction: number) => void;

class KeyboardNavigation {

	groups: Map<string, GroupRegistration> = new Map();
	highlightedElement: HTMLElement | null = null;
	activeGroupId: string | null = null;
	activeItemIndex = -1;
	captureElement: HTMLElement | null = null;
	private panelListener: ((e: Event) => void) | null = null;
	private overflowHandlers: Map<FocusedPanel, OverflowHandler> = new Map();

	init () {
		this.panelListener = (e: Event) => {
			const panel = (e as CustomEvent).detail as FocusedPanel | null;
			this.onPanelChange(panel);
		};
		window.addEventListener('focusPanelChange', this.panelListener);
	};

	destroy () {
		if (this.panelListener) {
			window.removeEventListener('focusPanelChange', this.panelListener);
			this.panelListener = null;
		};

		this.groups.clear();
		this.overflowHandlers.clear();
		this.clearHighlight();
		this.captureElement = null;
	};

	registerGroup (group: GroupRegistration) {
		this.groups.set(group.id, group);
	};

	unregisterGroup (id: string) {
		if (this.activeGroupId === id) {
			this.clearHighlight();
		};
		this.groups.delete(id);
	};

	registerOverflow (panel: FocusedPanel, handler: OverflowHandler) {
		this.overflowHandlers.set(panel, handler);
	};

	unregisterOverflow (panel: FocusedPanel) {
		this.overflowHandlers.delete(panel);
	};

	handle (panel: FocusedPanel, e: KeyboardEvent): boolean {
		const key = keyboard.eventKey(e);

		// Don't intercept arrow keys with modifiers (Cmd+Arrow, Alt+Arrow, etc. are text editing shortcuts)
		if (keyboard.isArrow(e) && (e.metaKey || e.ctrlKey || e.altKey)) {
			return false;
		};

		// Capture mode
		if (this.captureElement) {
			if (key === Key.escape) {
				e.preventDefault();
				this.exitCapture();
				return true;
			};

			// Up/Down in single-line inputs exits capture and navigates groups
			if ((key === Key.up) || (key === Key.down)) {
				const tag = this.captureElement.tagName.toLowerCase();
				const isMultiline = (tag === 'textarea') || this.captureElement.hasAttribute('contenteditable');

				if (!isMultiline) {
					e.preventDefault();
					this.exitCapture();

					const sortedGroups = this.getVisibleGroupsForPanel(panel);
					const groupIndex = sortedGroups.findIndex(g => g.id === this.activeGroupId);

					if (key === Key.down) {
						this.moveBetweenGroups(sortedGroups, groupIndex, 1, true);
					} else {
						this.moveBetweenGroups(sortedGroups, groupIndex, -1, false);
					};
					return true;
				};
			};

			return false;
		};

		// Don't handle if menus or popups are open
		if (
			keyboard.router.hasZoneOfType(KeyboardZoneType.Menu) ||
			keyboard.router.hasZoneOfType(KeyboardZoneType.Popup)
		) {
			return false;
		};

		// Don't handle if text input is focused (unless we have active keyboard navigation)
		if (keyboard.isFocused && !this.activeGroupId) {
			return false;
		};

		if (key === Key.escape) {
			e.preventDefault();
			keyboard.router.clearFocus();
			return true;
		};

		const sortedGroups = this.getVisibleGroupsForPanel(panel);
		if (!sortedGroups.length) {
			return false;
		};

		const group = this.activeGroupId ? this.groups.get(this.activeGroupId) : null;

		// No active group yet
		if (!group || (group.panel !== panel)) {
			switch (key) {
				case Key.down:
				case Key.right:
				case Key.enter: {
					e.preventDefault();
					this.highlightFirstGroupFirstItem(sortedGroups);
					return true;
				};

				case Key.up:
				case Key.left: {
					e.preventDefault();
					this.highlightLastGroupLastItem(sortedGroups);
					return true;
				};
			};

			return false;
		};

		const groupIndex = sortedGroups.findIndex(g => g.id === this.activeGroupId);

		switch (key) {
			case Key.down: {
				e.preventDefault();

				if (group.direction === GroupDirection.Horizontal) {
					this.moveBetweenGroups(sortedGroups, groupIndex, 1, true);
				} else {
					const totalCount = group.getItemCount ? group.getItemCount() : this.getVisibleItems(group).length;
					if (this.activeItemIndex >= totalCount - 1) {
						this.moveBetweenGroups(sortedGroups, groupIndex, 1, true);
					} else {
						this.moveWithinGroup(group, this.activeItemIndex + 1);
					};
				};
				return true;
			};

			case Key.up: {
				e.preventDefault();

				if (group.direction === GroupDirection.Horizontal) {
					this.moveBetweenGroups(sortedGroups, groupIndex, -1, false);
				} else {
					if (this.activeItemIndex <= 0) {
						this.moveBetweenGroups(sortedGroups, groupIndex, -1, false);
					} else {
						this.moveWithinGroup(group, this.activeItemIndex - 1);
					};
				};
				return true;
			};

			case Key.right: {
				e.preventDefault();

				if (group.direction === GroupDirection.Horizontal) {
					const items = this.getVisibleItems(group);
					if (this.activeItemIndex < items.length - 1) {
						this.moveWithinGroup(group, this.activeItemIndex + 1);
					};
				} else
				if (group.onRight) {
					const items = this.getVisibleItems(group);
					const item = items[this.activeItemIndex];

					if (item) {
						group.onRight(item);
					};
				};
				return true;
			};

			case Key.left: {
				e.preventDefault();

				if (group.direction === GroupDirection.Horizontal) {
					if (this.activeItemIndex > 0) {
						this.moveWithinGroup(group, this.activeItemIndex - 1);
					};
				} else
				if (group.onLeft) {
					const items = this.getVisibleItems(group);
					const item = items[this.activeItemIndex];

					if (item) {
						group.onLeft(item);
					};
				};
				return true;
			};

			case Key.enter: {
				e.preventDefault();

				const items = this.getVisibleItems(group);
				const item = items[this.activeItemIndex];

				if (!item) {
					return true;
				};

				// Check for custom enter handler
				if (group.onEnter) {
					if (group.onEnter(item)) {
						return true;
					};
				};

				// Check for capturable element
				const capturable = item.querySelector('input, textarea, [contenteditable="true"]') as HTMLElement;
				if (capturable) {
					this.enterCapture(capturable);
				} else {
					// Try mousedown on clickable targets (.clickable for tree items, .inner for list items)
					const target = (item.querySelector('.clickable') || item.querySelector('.inner')) as HTMLElement;
					if (target) {
						target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
					} else {
						item.click();
					};
				};
				return true;
			};

			case Key.escape: {
				e.preventDefault();
				this.clearHighlight();
				keyboard.router.clearFocus();
				return true;
			};
		};

		return false;
	};

	moveInGroup (groupId: string, direction: number): HTMLElement | null {
		const group = this.groups.get(groupId);
		if (!group) {
			return null;
		};

		const items = this.getVisibleItems(group);
		if (!items.length) {
			return null;
		};

		let newIndex = this.activeGroupId === groupId ? this.activeItemIndex + direction : (direction > 0 ? 0 : items.length - 1);

		if (newIndex < 0) {
			newIndex = items.length - 1;
		};
		if (newIndex >= items.length) {
			newIndex = 0;
		};

		this.moveWithinGroup(group, newIndex);
		return this.highlightedElement;
	};

	onPanelChange (panel: FocusedPanel | null) {
		if (!panel) {
			this.onPanelLeave();
			return;
		};

		this.onPanelEnter(panel);
	};

	onPanelEnter (panel: FocusedPanel) {
		this.clearHighlight();

		const sortedGroups = this.getVisibleGroupsForPanel(panel);
		if (sortedGroups.length) {
			this.highlightFirstGroupFirstItem(sortedGroups);
		};
	};

	onPanelLeave () {
		this.clearHighlight();
		this.captureElement = null;
	};

	clearHighlight () {
		if (this.highlightedElement) {
			this.highlightedElement.classList.remove('keyboardHighlight');
			this.highlightedElement = null;
		};

		this.activeGroupId = null;
		this.activeItemIndex = -1;
	};

	private highlightFirstGroupFirstItem (sortedGroups: GroupRegistration[]) {
		for (const group of sortedGroups) {
			const items = this.getVisibleItems(group);
			if (items.length) {
				this.setHighlight(group, 0);
				return;
			};
		};
	};

	private highlightLastGroupLastItem (sortedGroups: GroupRegistration[]) {
		for (let i = sortedGroups.length - 1; i >= 0; i--) {
			const group = sortedGroups[i];
			const items = this.getVisibleItems(group);
			if (items.length) {
				this.setHighlight(group, items.length - 1);
				return;
			};
		};
	};

	private moveBetweenGroups (sortedGroups: GroupRegistration[], currentIndex: number, direction: number, selectFirst: boolean) {
		for (let i = currentIndex + direction; (i >= 0) && (i < sortedGroups.length); i += direction) {
			const nextGroup = sortedGroups[i];
			const items = this.getVisibleItems(nextGroup);

			if (items.length) {
				const idx = selectFirst ? 0 : items.length - 1;
				this.setHighlight(nextGroup, idx);
				return;
			};
		};

		// No next group found — check overflow handler
		const currentGroup = sortedGroups[currentIndex];
		if (currentGroup) {
			const handler = this.overflowHandlers.get(currentGroup.panel);
			if (handler) {
				this.clearHighlight();
				handler(direction);
				return;
			};
		};

		this.clearHighlight();
	};

	private moveWithinGroup (group: GroupRegistration, newIndex: number) {
		if (group.scrollToIndex) {
			group.scrollToIndex(newIndex);
			this.retrySetHighlight(group, newIndex, 0);
		} else {
			this.setHighlight(group, newIndex);
		};
	};

	private retrySetHighlight (group: GroupRegistration, index: number, attempt: number) {
		requestAnimationFrame(() => {
			const el = group.getItemElement ? group.getItemElement(index) : null;

			if (el) {
				this.setHighlightElement(group, el, index);
			} else
			if (attempt < 4) {
				this.retrySetHighlight(group, index, attempt + 1);
			};
		});
	};

	private setHighlight (group: GroupRegistration, index: number) {
		const items = this.getVisibleItems(group);
		if (!items.length) {
			return;
		};

		const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
		const item = items[clampedIndex];

		if (!item) {
			return;
		};

		this.setHighlightElement(group, item, clampedIndex);

		if (!group.scrollToIndex && (group.direction === GroupDirection.Vertical)) {
			item.scrollIntoView({ block: 'center', behavior: 'instant' });
		};
	};

	private setHighlightElement (group: GroupRegistration, item: HTMLElement, index: number) {
		if (this.highlightedElement) {
			this.highlightedElement.classList.remove('keyboardHighlight');
		};

		item.classList.add('keyboardHighlight');
		this.highlightedElement = item;
		this.activeGroupId = group.id;
		this.activeItemIndex = index;
	};

	private enterCapture (element: HTMLElement) {
		this.captureElement = element;

		// Remove item highlight while captured
		if (this.highlightedElement) {
			this.highlightedElement.classList.remove('keyboardHighlight');
		};

		element.focus();
	};

	private exitCapture () {
		if (!this.captureElement) {
			return;
		};

		this.captureElement.blur();
		this.captureElement = null;

		// Restore highlight on active item
		if (this.activeGroupId) {
			const group = this.groups.get(this.activeGroupId);
			if (group) {
				this.setHighlight(group, this.activeItemIndex);
			};
		};
	};

	private getVisibleGroupsForPanel (panel: FocusedPanel): GroupRegistration[] {
		const groups: GroupRegistration[] = [];

		this.groups.forEach(group => {
			if (group.panel !== panel) {
				return;
			};

			const container = group.getContainer();
			if (!container || !this.isVisible(container)) {
				return;
			};

			groups.push(group);
		});

		// Sort by DOM order
		groups.sort((a, b) => {
			const ca = a.getContainer();
			const cb = b.getContainer();

			if (!ca || !cb) {
				return 0;
			};

			const pos = ca.compareDocumentPosition(cb);

			if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
				return -1;
			};

			if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
				return 1;
			};

			return 0;
		});

		return groups;
	};

	private getVisibleItems (group: GroupRegistration): HTMLElement[] {
		const container = group.getContainer();
		if (!container) {
			return [];
		};

		const scopedSelector = group.itemSelector.split(',').map(s => `:scope ${s.trim()}`).join(', ');
		const all = Array.from(container.querySelectorAll(scopedSelector)) as HTMLElement[];
		const visible = all.filter(el => this.isVisible(el) && !el.classList.contains('disabled'));

		// Sort by visual position for virtualized lists where DOM order ≠ visual order
		if (group.scrollToIndex) {
			visible.sort((a, b) => {
				return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
			});
		};

		return visible;
	};

	private isVisible (el: HTMLElement): boolean {
		return (el.offsetWidth > 0) || (el.offsetHeight > 0);
	};

};

export const navigation = new KeyboardNavigation();
