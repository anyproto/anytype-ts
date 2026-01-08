$(document).ready(() => {
	const body = $('body');
	const electron = window.Electron;
	const currentWindow = electron.currentWindow();
	const winId = Number(currentWindow?.windowId) || 0;
	const container = $('#tabs');
	const marker = $('#marker');
	let sortable = null;

	body.addClass(`platform-${electron.platform}`);

	const setActive = (id, animate) => {
		container.find('.tab.active').removeClass('active');
		container.find('.tab.hideDiv').removeClass('hideDiv');

		const active = container.find(`#tab-${id}`);
		if (!active.length) {
			return;
		};

		const offset = active.position();

		active.addClass('active');

		// Hide divider on the previous tab
		active.prev('.tab:not(.isAdd)').addClass('hideDiv');

		marker.toggleClass('anim', animate);
		marker.css({
			width: active.outerWidth(),
			transform: `translate3d(${offset.left}px, 0px, 0px)`
		});
	};

	const renderTab = (item) => {
		item = item || {};
		item.data = item.data || {};

		const title = String(item.data.title || 'New tab');
		const icon = String(item.data.icon || '');

		const tab = $(`
			<div id="tab-${item.id}" class="tab">
				<div class="clickable">
					<div class="name">${title}</div>
					<div class="icon close withBackground"></div>
				</div>
				<div class="div"></div>
			</div>
		`);

		const clickable = tab.find('.clickable');
		if (icon) {
			clickable.prepend($(`<div class="icon" style="background-image: url('${icon}')" />`));
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
			electron.Api(winId, 'createTab');
		});

		return tab;
	};

	const updateNoClose = () => {
		const tabs = container.find('.tab:not(.isAdd)');
		tabs.toggleClass('noClose', tabs.length == 1);
	};

	let dragAnimationFrame = null;
	let isDraggingActive = false;

	const updateMarkerDuringDrag = () => {
		if (!isDraggingActive) return;

		const activeTab = container.find('.tab.active');
		if (activeTab.length) {
			const offset = activeTab.position();
			if (offset && offset.left !== undefined) {
				marker.css({
					width: activeTab.outerWidth(),
					transform: `translate3d(${offset.left}px, 0px, 0px)`
				});
			};
		};

		if (isDraggingActive) {
			dragAnimationFrame = requestAnimationFrame(updateMarkerDuringDrag);
		};
	};

	const initSortable = () => {
		if (sortable) {
			sortable.destroy();
		};

		sortable = new Sortable(container[0], {
			animation: 150,
			draggable: '.tab:not(.isAdd)',
			filter: '.icon.close',
			preventOnFilter: false,
			onStart: (evt) => {
				// Check if dragging active tab
				if ($(evt.item).hasClass('active')) {
					isDraggingActive = true;

					// Disable marker animation and pointer events during drag
					marker.removeClass('anim').css('pointer-events', 'none');

					// Start continuous marker updates
					updateMarkerDuringDrag();
				};
			},
			onEnd: (evt) => {
				// Stop continuous updates
				if (dragAnimationFrame) {
					cancelAnimationFrame(dragAnimationFrame);
					dragAnimationFrame = null;
				};
				isDraggingActive = false;

				// Re-enable marker animation and pointer events
				marker.addClass('anim').css('pointer-events', '');

				const tabIds = [];
				container.find('.tab:not(.isAdd)').each((i, el) => {
					const id = $(el).attr('id').replace('tab-', '');
					tabIds.push(id);
				});

				// Wrap tabIds in array to preserve it through Electron API
				electron.Api(winId, 'reorderTabs', [ tabIds ]);

				// Update marker position after drag
				setTimeout(() => {
					const activeId = container.find('.tab.active').attr('id')?.replace('tab-', '');
					if (activeId) {
						setActive(activeId, true);
					};
				}, 0);
			}
		});
	};

	const setTabs = (tabs, id) => {
		container.empty();

		tabs = tabs || [];
		tabs.forEach((it, i) => {
			container.append(renderTab(it));
		});

		container.append(renderAdd());
		updateNoClose();
		setActive(id, false);

		// Update visibility based on tab count
		$('.container').toggleClass('isHidden', tabs.length <= 1);

		// Initialize sortable
		initSortable();
	};

	electron.Api(winId, 'getTabs').then(({ tabs, id }) => setTabs(tabs, id));

	electron.on('update-tabs', (e, tabs, id) => setTabs(tabs, id));

	electron.on('set-active-tab', (e, id) => setActive(id, false));

	electron.on('create-tab', (e, tab) => {
		const existing = container.find(`#tab-${tab.id}`);
		if (!existing.length) {
			container.find('.tab.isAdd').before(renderTab(tab));
			updateNoClose();

			// Reinitialize sortable after DOM update
			requestAnimationFrame(() => {
				initSortable();
			});
		};
	});

	electron.on('update-tab', (e, tab) => {
		const existing = container.find(`#tab-${tab.id}`);
		if (existing.length) {
			existing.replaceWith(renderTab(tab));

			// Reinitialize sortable after DOM update
			requestAnimationFrame(() => {
				initSortable();
			});
		};
	});

	electron.on('remove-tab', (e, id) => {
		container.find(`#tab-${id}`).remove();
		updateNoClose();

		// Reinitialize sortable after DOM update
		requestAnimationFrame(() => {
			initSortable();
		});
	});

	electron.on('update-tab-bar-visibility', (e, isVisible) => {
		$('.container').toggleClass('isHidden', !isVisible);
	});
});
