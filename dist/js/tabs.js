$(() => {
	const body = $('body');
	const electron = window.Electron;
	const currentWindow = electron.currentWindow();
	const isFullScreen = electron.isFullScreen();
	const winId = Number(currentWindow?.windowId) || 0;
	const container = $('#tabs');
	const marker = $('#marker');
	const theme = Electron.getTheme();

	let sortable = null;
	let isDragging = false;
	let draggedActiveId = null;

	body.addClass(`platform-${electron.platform}`);
	body.toggleClass('isFullScreen', isFullScreen);
	
	if (theme) {
		document.documentElement.classList.add(`theme${ucFirst(theme)}`);
	};

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
		const tabs = container.find('.tab:not(.isAdd)');
		const activeIndex = tabs.index(active);
		if (activeIndex > 0) {
			tabs.eq(activeIndex - 1).addClass('hideDiv');
		};

		marker.toggleClass('anim', animate);
		marker.css({
			width: active.outerWidth() - 4,
			left: offset.left + 2,
		});
	};

	const updateMarkerPosition = () => {
		if (!isDragging || !draggedActiveId) {
			return;
		};

		const active = container.find(`#tab-${draggedActiveId}`);
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
			electron.Api(winId, 'createTab');
		});

		return tab;
	};

	const updateNoClose = () => {
		const tabs = container.find('.tab:not(.isAdd)');
		tabs.toggleClass('noClose', tabs.length == 1);
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
			animation: 0,
			draggable: '.tab:not(.isAdd)',
			filter: '.icon.close',
			preventOnFilter: false,
			onStart: (evt) => {
				isDragging = true;

				const item = $(evt.item);
				if (item.hasClass('active')) {
					draggedActiveId = item.attr('data-id');
					marker.removeClass('anim').css('pointer-events', 'none');
				};
			},
			onChange: (evt) => {
				if (draggedActiveId) {
					setTimeout(() => updateMarkerPosition(), 40);
				};
			},
			onEnd: (evt) => {
				isDragging = false;
				const wasActive = draggedActiveId !== null;
				draggedActiveId = null;

				if (wasActive) {
					marker.addClass('anim').css('pointer-events', '');
				};

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

				// Update marker position after a short delay
				setTimeout(() => {
					const activeId = container.find('.tab.active').attr('data-id');
					if (activeId) {
						//setActive(activeId, true);
					};
				}, 50);
			}
		});
	};

	const setTabs = (tabs, id) => {
		if (isDragging) {
			return; // Don't update during drag
		};

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

		// Initialize sortable after a slight delay to ensure DOM is ready
		setTimeout(() => initSortable(), 10);
	};

	electron.Api(winId, 'getTabs').then(({ tabs, id }) => setTabs(tabs, id));

	electron.on('update-tabs', (e, tabs, id) => setTabs(tabs, id));

	electron.on('set-active-tab', (e, id) => setActive(id, false));

	electron.on('create-tab', (e, tab) => {
		if (isDragging) return;

		const existing = container.find(`#tab-${tab.id}`);
		if (existing.length) {
			existing.remove();
		};

		container.find('.tab.isAdd').before(renderTab(tab));
		updateNoClose();
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
		updateNoClose();
		setTimeout(() => initSortable(), 10);
	});

	electron.on('update-tab-bar-visibility', (e, isVisible) => {
		$('.container').toggleClass('isHidden', !isVisible);
	});

	electron.on('set-theme', (e, theme) => {
		$('html').toggleClass('themeDark', theme == 'dark');
	});

	electron.on('set-tabs-dimmer', (e, show) => {
		body.toggleClass('showDimmer', show);
	});

	electron.on('enter-full-screen', () => {
		body.addClass('isFullScreen');
	});

	electron.on('leave-full-screen', () => {
		body.removeClass('isFullScreen');
	});

	function ucFirst (str) {
		return String(str || '').charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	};
});