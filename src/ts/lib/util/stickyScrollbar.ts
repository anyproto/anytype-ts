

/**
 * Utility class for managing sticky horizontal scrollbar synchronization
 * Used in dataview grid and board views
 */
class UtilStickyScrollbar {

	/**
	 * Synchronizes the sticky scrollbar position based on the main scroll position
	 * Uses ratio-based calculation to account for different coordinate systems
	 * @param scroll - The main scroll container element
	 * @param stickyScrollbar - The sticky scrollbar element
	 * @param isSyncingScroll - Ref to prevent feedback loops
	 * @returns The new isSyncingScroll state
	 */
	syncFromMain (scroll: HTMLElement, stickyScrollbar: HTMLElement, isSyncingScroll: boolean): boolean {
		if (!stickyScrollbar || isSyncingScroll) {
			return isSyncingScroll;
		};

		isSyncingScroll = true;

		const maxScroll = scroll.scrollWidth - scroll.clientWidth;
		const maxSticky = stickyScrollbar.scrollWidth - stickyScrollbar.clientWidth;

		if (maxScroll > 0 && maxSticky > 0) {
			const scrollRatio = scroll.scrollLeft / maxScroll;
			stickyScrollbar.scrollLeft = scrollRatio * maxSticky;
		};

		isSyncingScroll = false;
		return isSyncingScroll;
	};

	/**
	 * Synchronizes the main scroll position based on the sticky scrollbar position
	 * Uses ratio-based calculation to account for different coordinate systems
	 * @param scroll - The main scroll container element
	 * @param stickyScrollbar - The sticky scrollbar element
	 * @param isSyncingScroll - Ref to prevent feedback loops
	 * @returns The new isSyncingScroll state
	 */
	syncFromSticky (scroll: HTMLElement, stickyScrollbar: HTMLElement, isSyncingScroll: boolean): boolean {
		if (isSyncingScroll) {
			return isSyncingScroll;
		};

		isSyncingScroll = true;

		if (scroll && stickyScrollbar) {
			const maxScroll = scroll.scrollWidth - scroll.clientWidth;
			const maxSticky = stickyScrollbar.scrollWidth - stickyScrollbar.clientWidth;

			if (maxScroll > 0 && maxSticky > 0) {
				const stickyRatio = stickyScrollbar.scrollLeft / maxSticky;
				scroll.scrollLeft = stickyRatio * maxScroll;
			};
		};

		isSyncingScroll = false;
		return isSyncingScroll;
	};

};

export default new UtilStickyScrollbar();
