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

	/**
	 * Called when a text input/editable receives focus (e.g. user clicks on it).
	 * Finds the keyboard group containing this element and activates it,
	 * so that Tab/arrow navigation works from this element.
	 */
	activateForElement (element: HTMLElement) {
		for (const [ , group ] of this.groups) {
			const container = group.getContainer();

			if (!container || !container.contains(element)) {
				continue;
			};

			const items = this.getVisibleItems(group);
			const itemIndex = items.findIndex(item => (item === element) || item.contains(element));

			if (itemIndex === -1) {
				continue;
			};

			// Set panel without blurring the active element or dispatching focusPanelChange
			keyboard.router.focusedPanel = group.panel;

			// Track group/item state
			this.activeGroupId = group.id;
			this.activeItemIndex = itemIndex;

			// Enter capture mode for the focused element
			this.captureElement = element;

			// Remove any existing highlight (the input itself is visually focused)
			if (this.highlightedElement) {
				this.highlightedElement.classList.remove('keyboardHighlight');
				this.highlightedElement = null;
			};

			return true;
		};

		return false;
	};

	handle (panel: FocusedPanel, e: KeyboardEvent): boolean {
		const key = keyboard.eventKey(e);

		// Don't intercept arrow keys with modifiers (Cmd+Arrow, Alt+Arrow, etc. are text editing shortcuts)
		if (keyboard.isArrow(e) && (e.metaKey || e.ctrlKey || e.altKey)) {
			return false;
		};

		// Capture mode: a text input is focused within a keyboard group
		if (this.captureElement) {
			if (key === Key.escape) {
				e.preventDefault();
				this.exitCapture();
				return true;
			};

			// Tab / Shift+Tab: exit capture and move to next/prev group
			if (key === Key.tab) {
				e.preventDefault();
				this.exitCapture();

				const sortedGroups = this.getVisibleGroupsForPanel(panel);
				const groupIndex = sortedGroups.findIndex(g => g.id === this.activeGroupId);

				this.tabBetweenGroups(sortedGroups, groupIndex, e.shiftKey ? -1 : 1);
				return true;
			};

			// Up/Down: exit capture for single-line inputs, or at multiline boundaries
			if ((key === Key.up) || (key === Key.down)) {
				const tag = this.captureElement.tagName.toLowerCase();
				const isMultiline = (tag === 'textarea') || this.captureElement.hasAttribute('contenteditable');

				let shouldExit = !isMultiline;

				// For multiline non-editor inputs, exit at first/last line
				if (isMultiline && !this.isInsideEditor(this.captureElement)) {
					shouldExit = this.isAtMultilineBoundary(this.captureElement, key === Key.up);
				};

				if (shouldExit) {
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

		// Tab / Shift+Tab: move between groups within the focused panel
		if (key === Key.tab) {
			e.preventDefault();

			if (!group || (group.panel !== panel)) {
				if (e.shiftKey) {
					this.highlightLastGroupLastItem(sortedGroups);
				} else {
					this.highlightFirstGroupFirstItem(sortedGroups);
				};
				return true;
			};

			const gi = sortedGroups.findIndex(g => g.id === this.activeGroupId);
			this.tabBetweenGroups(sortedGroups, gi, e.shiftKey ? -1 : 1);
			return true;
		};

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

	/**
	 * Tab-specific group movement: when no next group is found, cycle to next panel.
	 */
	private tabBetweenGroups (sortedGroups: GroupRegistration[], currentIndex: number, direction: number) {
		for (let i = currentIndex + direction; (i >= 0) && (i < sortedGroups.length); i += direction) {
			const nextGroup = sortedGroups[i];
			const items = this.getVisibleItems(nextGroup);

			if (items.length) {
				const idx = direction > 0 ? 0 : items.length - 1;
				this.setHighlight(nextGroup, idx);
				return;
			};
		};

		// No more groups in this panel — cycle to next panel
		this.clearHighlight();
		keyboard.router.cycleFocus();
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

	/**
	 * Checks if the element is inside the block editor (not sidebar/form editors).
	 */
	private isInsideEditor (element: HTMLElement): boolean {
		return !!element.closest('.editorWrapper');
	};

	/**
	 * Checks if the cursor is at the first line (for Up) or last line (for Down)
	 * in a multiline input, so we can exit and navigate to the next group.
	 */
	private isAtMultilineBoundary (element: HTMLElement, isUp: boolean): boolean {
		const sel = window.getSelection();

		if (!sel || !sel.rangeCount) {
			return true;
		};

		const range = sel.getRangeAt(0);
		const text = element.textContent || '';

		if (isUp) {
			// At the very start of content
			if (range.startOffset === 0) {
				const container = range.startContainer;
				if ((container === element) || (container === element.firstChild) || (container.parentNode === element)) {
					return true;
				};
			};
		} else {
			// At the very end of content
			if (!text.length) {
				return true;
			};

			const endContainer = range.endContainer;
			const endOffset = range.endOffset;
			const nodeLength = endContainer.nodeType === Node.TEXT_NODE
				? (endContainer.textContent || '').length
				: endContainer.childNodes.length;

			if ((endOffset >= nodeLength) && !endContainer.nextSibling) {
				return true;
			};
		};

		return false;
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
