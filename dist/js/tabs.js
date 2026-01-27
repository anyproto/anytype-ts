$(() => {
	const win = $(window);
	const doc = $(document);
	const body = $('body');
	const electron = window.Electron;
	const currentWindow = electron.currentWindow();
	const isFullScreen = electron.isFullScreen();
	const winId = Number(currentWindow?.windowId) || 0;
	const container = $('#tabs');
	const marker = $('#marker');
	const menuBar = $('#menuBar');
	const tabsWrapper = $('#tabsWrapper');
	const theme = Electron.getTheme();

	let sortable = null;
	let isDragging = false;
	let draggedActiveId = '';
	let activeId = '';
	let timeoutResize = 0;
	let tabsData = [];

	// Tab detach state
	let windowBounds = null;
	let draggedTabId = null;
	let lastCursorPos = null;
	let cursorPollInterval = null;

	// Clean up polling
	const stopCursorPolling = () => {
		if (cursorPollInterval) {
			clearInterval(cursorPollInterval);
			cursorPollInterval = null;
		};
	};

	body.addClass(`platform-${electron.platform}`);
	body.toggleClass('isFullScreen', isFullScreen);
	body.addClass('tabsHidden'); // Start hidden, will be shown when tabs load

	if (theme) {
		document.documentElement.classList.add(`theme${ucFirst(theme)}`);
	};

	const config = electron.getConfig();
	const showMenuBar = config.showMenuBar !== false; // Default to true
	let menuBarHiddenByConfig = !showMenuBar;

	body.toggleClass('showMenuBar', showMenuBar);

	// Alt key toggle for hidden menu bar (Windows/Linux behavior)
	// Single press of Alt toggles the menu bar visibility
	if ((electron.platform === 'win32') || (electron.platform === 'linux')) {
		let altKeyPressed = false;
		let altKeyUsedWithOther = false;

		doc.on('keydown', (e) => {
			if (e.key === 'Alt') {
				altKeyPressed = true;
			} else
			if (altKeyPressed) {
				// Alt was used as modifier with another key (e.g., Alt+Tab)
				altKeyUsedWithOther = true;
			};
		});

		doc.on('keyup', (e) => {
			if (e.key !== 'Alt') {
				return;
			};

			// Only toggle if Alt was pressed alone (not as modifier)
			if (altKeyPressed && !altKeyUsedWithOther && menuBarHiddenByConfig) {
				const isCurrentlyVisible = body.hasClass('altVisible');

				if (isCurrentlyVisible) {
					body.removeClass('showMenuBar altVisible');
					electron.Api(winId, 'setMenuBarTemporaryVisibility', false);
				} else {
					body.addClass('showMenuBar altVisible');
					electron.Api(winId, 'setMenuBarTemporaryVisibility', true);
				};
			};

			altKeyPressed = false;
			altKeyUsedWithOther = false;
		});

		// Hide menu bar when clicking outside the menu bar
		doc.on('mousedown', (e) => {
			if (!body.hasClass('altVisible')) {
				return;
			};

			const target = $(e.target);
			if (!target.closest('#menuBar').length) {
				body.removeClass('showMenuBar altVisible');
				electron.Api(winId, 'setMenuBarTemporaryVisibility', false);
			};
		});

		// Hide menu bar on window blur
		win.on('blur', () => {
			if (body.hasClass('altVisible')) {
				body.removeClass('showMenuBar altVisible');
				electron.Api(winId, 'setMenuBarTemporaryVisibility', false);
			};
		});

		// Hide menu bar on Escape key
		doc.on('keydown', (e) => {
			if ((e.key === 'Escape') && body.hasClass('altVisible')) {
				body.removeClass('showMenuBar altVisible');
				electron.Api(winId, 'setMenuBarTemporaryVisibility', false);
			};
		});

		// Handle Alt key toggle from main process (when focus is on tab content)
		electron.on('alt-key-toggle', () => {
			if (!menuBarHiddenByConfig) {
				return;
			};

			const isCurrentlyVisible = body.hasClass('altVisible');

			if (isCurrentlyVisible) {
				body.removeClass('showMenuBar altVisible');
				electron.Api(winId, 'setMenuBarTemporaryVisibility', false);
			} else {
				body.addClass('showMenuBar altVisible');
				electron.Api(winId, 'setMenuBarTemporaryVisibility', true);
			};
		});
	}

	// Menu bar button handlers (Windows and Linux)
	menuBar.find('#window-menu').off('click').on('click', () => electron.Api(winId,'menu'));
	menuBar.find('#window-min').off('click').on('click', () => electron.Api(winId, 'minimize'));
	menuBar.find('#window-max').off('click').on('click', () => electron.Api(winId, 'maximize'));
	menuBar.find('#window-close').off('click').on('click', () => electron.Api(winId, 'close'));

	const setActive = (id, animate) => {
		container.find('.tab.active').removeClass('active');
		container.find('.tab.hideDiv').removeClass('hideDiv');

		const active = container.find(`#tab-${id}`);
		if (!active.length) {
			return;
		};

		active.addClass('active');

		// Hide divider on the previous tab
		const tabs = container.find('.tab:not(.isAdd)');
		const activeIndex = tabs.index(active);
		if (activeIndex > 0) {
			tabs.eq(activeIndex - 1).addClass('hideDiv');
		};

		activeId = id;
		marker.toggleClass('anim', animate);
		updateMarkerPosition(id);
	};

	const updateMarkerPosition = (id) => {
		if (!id) {
			return;
		};

		const active = container.find(`#tab-${id}`);
		if (!active.length) {
			return;
		};

		const offset = active.offset();
		const containerOffset = container.offset();

		if (offset && containerOffset) {
			marker.css({ 
				width: active.outerWidth() - 4, 
				left: offset.left - containerOffset.left + 2,
			});
		};
	};

	const renderTab = (item) => {
		item = item || {};
		item.data = item.data || {};

		const title = String(item.data.title || 'New tab');
		const icon = String(item.data.icon || '');
		const layout = Number(item.data.layout) || 0;
		const uxType = Number(item.data.uxType) || 0;
		const isImage = Boolean(item.data.isImage);

		const tab = $(`
			<div id="tab-${item.id}" class="tab" data-id="${item.id}">
				<div class="clickable">
					<div class="name">${title}</div>
					<div class="icon close withBackground"></div>
				</div>
				<div class="div"></div>
			</div>
		`);

		const clickable = tab.find('.clickable');
		if (icon) {
			const cn = [ 'icon', 'object', `layout${layout}`, `uxType${uxType}` ];
			if (isImage) {
				cn.push('isImage');
			};

			clickable.prepend($(`
				<div className="iconWrapper">
					<div class="${cn.join(' ')}" style="background-image: url('${icon}')" />
				</div>
			`));
		};

		clickable.off('click').on('click', () => {
			electron.Api(winId, 'setActiveTab', item.id);
			setActive(item.id, true);
		});

		tab.find('.icon.close').off('click').on('click', (e) => {
			e.stopPropagation();
			electron.Api(winId, 'removeTab', [ item.id, true ]);
		});

		return tab;
	};

	const renderAdd = () => {
		const tab = $(`
			<div class="tab isAdd">
				<div class="icon withBackground"></div>
			</div>
		`);

		tab.off('click').on('click', () => {
			const activeTab = tabsData.find(it => it.id == activeId);

			electron.Api(winId, 'openTab', activeTab?.data, { setActive: true });
		});

		return tab;
	};

	const resize = () => {
		window.clearTimeout(timeoutResize);
		timeoutResize = window.setTimeout(() => {
			const tabs = container.find('.tab:not(.isAdd)');

			tabs.toggleClass('noClose', tabs.length == 1);
			updateMarkerPosition(activeId);
		}, 40);
	};

	// Check if screen coordinates are outside window bounds
	const isOutsideWindow = (screenX, screenY) => {
		if (!windowBounds) {
			return false;
		};

		const padding = 10;
		return (
			screenX < windowBounds.x - padding ||
			screenX > windowBounds.x + windowBounds.width + padding ||
			screenY < windowBounds.y - padding ||
			screenY > windowBounds.y + windowBounds.height + padding
		);
	};

	const initSortable = () => {
		if (sortable) {
			sortable.destroy();
			sortable = null;
		};

		const tabs = container.find('.tab:not(.isAdd)');
		if (!tabs.length) {
			return;
		};

		sortable = new Sortable(container[0], {
			animation: 150,
			easing: 'ease-in-out',
			draggable: '.tab:not(.isAdd)',
			filter: '.icon.close',
			preventOnFilter: false,
			onStart: async (evt) => {
				isDragging = true;
				draggedTabId = $(evt.item).attr('data-id');

				const item = $(evt.item);
				item.css('visibility', 'hidden');

				if (item.hasClass('active')) {
					draggedActiveId = item.attr('data-id');
					marker.removeClass('anim').css('pointer-events', 'none');
				};

				// Get window bounds for detecting drag outside (await to ensure it's ready)
				try {
					windowBounds = await electron.Api(winId, 'getWindowBounds');
				} catch (e) {};

				// Poll cursor position during drag (needed because mouse events don't fire outside window)
				stopCursorPolling(); // Clear any existing interval first
				cursorPollInterval = setInterval(async () => {
					if (!isDragging) {
						stopCursorPolling();
						return;
					};
					try {
						lastCursorPos = await electron.Api(winId, 'getCursorScreenPoint');
					} catch (e) {};
				}, 100);
			},
			onChange: (evt) => {
				updateMarkerPosition(draggedActiveId || activeId);
			},
			onEnd: async (evt) => {
				const tabId = draggedTabId;
				const bounds = windowBounds;
				const cursorPos = lastCursorPos;

				// Stop polling
				stopCursorPolling();

				isDragging = false;
				body.removeClass('draggingOutside');

				const item = $(evt.item);
				item.css('visibility', '');

				// Check if cursor was outside window (using last polled position)
				if (tabId && bounds && cursorPos) {
					const isOutside = isOutsideWindow(cursorPos.x, cursorPos.y);
					if (isOutside) {
						const tabs = container.find('.tab:not(.isAdd)');
						// Only allow detach if there's more than one tab
						if (tabs.length > 1) {
							electron.Api(winId, 'detachTab', {
								tabId: tabId,
								mouseX: cursorPos.x,
								mouseY: cursorPos.y,
							});
						};
					};
				};

				// Reset detach state
				draggedTabId = null;
				windowBounds = null;
				lastCursorPos = null;

				draggedActiveId = null;
				marker.addClass('anim').css('pointer-events', '');
				updateMarkerPosition(activeId);

				const tabIds = [];
				container.find('.tab:not(.isAdd)').each((i, el) => {
					const id = $(el).attr('data-id');
					if (id) {
						tabIds.push(id);
					};
				});

				if (tabIds.length > 0) {
					electron.Api(winId, 'reorderTabs', [ tabIds ]);
				};
			}
		});
	};

	const setTabs = (tabs, id, isVisible) => {
		if (isDragging) {
			return; // Don't update during drag
		};

		container.empty();

		tabs = tabs || [];
		tabsData = tabs;
		tabs.forEach((it, i) => {
			container.append(renderTab(it));
		});

		container.append(renderAdd());
		resize();
		setActive(id, false);

		// Set visibility - default to showing tabs if not specified
		const visible = typeof isVisible === 'boolean' ? isVisible : (tabs.length > 1);
		tabsWrapper.toggleClass('isHidden', !visible);
		body.toggleClass('tabsHidden', !visible);

		// Initialize sortable after a slight delay to ensure DOM is ready
		setTimeout(() => initSortable(), 10);
	};

	electron.Api(winId, 'getTabs').then(({ tabs, id, isVisible }) => setTabs(tabs, id, isVisible)).catch(() => {});

	electron.on('update-tabs', (e, tabs, id, isVisible) => setTabs(tabs, id, isVisible));

	electron.on('set-active-tab', (e, id) => setActive(id, false));

	electron.on('create-tab', (e, tab) => {
		if (isDragging) return;

		const existing = container.find(`#tab-${tab.id}`);
		if (existing.length) {
			existing.remove();
		};

		container.find('.tab.isAdd').before(renderTab(tab));
		resize();
		setTimeout(() => initSortable(), 10);
	});

	electron.on('update-tab', (e, tab) => {
		if (isDragging) return;

		const existing = container.find(`#tab-${tab.id}`);
		if (!existing.length) {
			return;
		};

		const obj = renderTab(tab);
		obj.attr({ class: existing.attr('class') });

		existing.replaceWith(obj);
		setTimeout(() => initSortable(), 10);
	});

	electron.on('remove-tab', (e, id) => {
		if (isDragging) return;

		container.find(`#tab-${id}`).remove();
		resize();
		setTimeout(() => initSortable(), 10);
	});

	electron.on('update-tab-bar-visibility', (e, isVisible) => {
		tabsWrapper.toggleClass('isHidden', !isVisible);
		body.toggleClass('tabsHidden', !isVisible);
	});
	electron.on('set-theme', (e, theme) => $('html').toggleClass('themeDark', theme == 'dark'));
	electron.on('native-theme', (e, isDark) => $('html').toggleClass('themeDark', isDark));
	electron.on('set-tabs-dimmer', (e, show) => body.toggleClass('showDimmer', show));
	electron.on('set-menu-bar-visibility', (e, show) => {
		menuBarHiddenByConfig = !show;
		body.removeClass('altVisible');
		body.toggleClass('showMenuBar', show);
	});
	electron.on('enter-full-screen', () => body.addClass('isFullScreen'));
	electron.on('leave-full-screen', () => body.removeClass('isFullScreen'));
	win.off('resize.tabs').on('resize.tabs', resize);

	function ucFirst (str) {
		return String(str || '').charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	};

});