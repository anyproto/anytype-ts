import React, { forwardRef, useEffect } from 'react';
import * as I from 'Interface';

/**
 * Host page for the Spotlight-style quick search window. The window contains
 * nothing but the search popup: the page marks the renderer as the quick search
 * panel (so object opens redirect to the main window) and opens the popup.
 * Re-shows of the hidden panel are handled by the 'quickSearchShow' command.
 */
const PageMainQuickSearch = forwardRef<I.PageRef, I.PageComponent>(() => {

	useEffect(() => {
		S.Common.isQuickSearchWindow = true;
		keyboard.onQuickSearchPopup();
	}, []);

	return (
		<div className="pageMainQuickSearch" />
	);

});

export default PageMainQuickSearch;
