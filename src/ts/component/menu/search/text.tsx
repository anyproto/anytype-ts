import React, { forwardRef, useEffect, useRef } from 'react';
import $ from 'jquery';
import findAndReplaceDOMText from 'findandreplacedomtext';
import { Icon, Input } from 'Component';
import { I, S, U, J, keyboard, translate, analytics, Mark, focus, Storage } from 'Lib';

const SKIP_TAGS = [ 'span', 'div', 'name' ].concat(Object.values(Mark.getTags()));

interface MatchPosition {
	blockId: string;
	range: I.TextRange;
};

interface ExpandedState {
	toggles: string[];
	headers: string[];
};

interface ActiveMatch {
	toggleId: string;
	headerId: string;
	position: MatchPosition | null;
};

const MenuSearchText = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, storageGet, storageSet, close } = props;
	const { data } = param;
	const { route, isPopup } = data;

	const nodeRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<any>(null);
	const searchTimeoutRef = useRef(0);
	const lastSearchRef = useRef('');
	const n = useRef(0);
	const matchElementsRef = useRef<NodeListOf<Element> | null>(null);

	const expandedRef = useRef<ExpandedState>({ toggles: [], headers: [] });
	const activeMatchRef = useRef<ActiveMatch>({ toggleId: '', headerId: '', position: null });

	const getRootId = () => keyboard.getRootId(isPopup);
	const getContainer = () => U.Common.getScrollContainer(isPopup);
	const getSearchTag = () => Mark.getTag(I.MarkType.Search);

	const getMatchElements = (): NodeListOf<Element> | null => {
		const container = getContainer();
		return container.length ? container.get(0).querySelectorAll(getSearchTag()) : null;
	};

	const expandToggle = (el: JQuery<Element>) => {
		const toggleParent = el.parents('.block.textToggle:not(.isToggled)').first();
		if (!toggleParent.length) {
			return;
		}

		const id = toggleParent.attr('data-id');
		if (id && !expandedRef.current.toggles.includes(id)) {
			expandedRef.current.toggles.push(id);
			toggleParent.addClass('isToggled');
		}
	};

	const expandHeader = (el: JQuery<Element>) => {
		const block = el.closest('.block');
		if (!block.length) {
			return;
		}

		const blockId = block.attr('data-id');
		const rootId = getRootId();
		const header = S.Block.getHidingHeader(rootId, blockId);

		if (header && !expandedRef.current.headers.includes(header.id)) {
			expandedRef.current.headers.push(header.id);
		}
	};

	const expandAllCollapsedHeaders = () => {
		const rootId = getRootId();
		const container = getContainer();
		const collapsedHeaders = Storage.getToggle(rootId);

		if (!collapsedHeaders.length) {
			return;
		}

		// Temporarily show all hidden content by removing the hidden class
		container.find('.block.isHeaderChildHidden').removeClass('isHeaderChildHidden');

		// Track which headers we expanded
		expandedRef.current.headers = [ ...collapsedHeaders ];
	};

	const collapseHeadersWithoutMatches = () => {
		const rootId = getRootId();
		const matches = matchElementsRef.current;

		if (!matches?.length) {
			// No matches - restore all headers to collapsed state
			S.Block.updateHeadersToggle(rootId);
			expandedRef.current.headers = [];
			return;
		}

		// Find which headers contain matches
		const headersWithMatches = new Set<string>();

		Array.from(matches).forEach(match => {
			const block = $(match).closest('.block');
			if (block.length) {
				const blockId = block.attr('data-id');
				const header = S.Block.getHidingHeader(rootId, blockId);
				if (header) {
					headersWithMatches.add(header.id);
				}
			}
		});

		// Keep only headers that contain matches in our expanded list
		expandedRef.current.headers = expandedRef.current.headers.filter(id => headersWithMatches.has(id));

		// Update visibility - this will hide blocks under headers not in our expanded list
		S.Block.updateHeadersToggle(rootId);
	};

	const collapseExpanded = (keepToggleId?: string, keepHeaderId?: string) => {
		const { toggles, headers } = expandedRef.current;

		toggles
			.filter(id => id !== keepToggleId)
			.forEach(id => $(`#block-${id}`).removeClass('isToggled'));

		const headersToCollapse = headers.filter(id => id !== keepHeaderId);
		if (headersToCollapse.length) {
			headersToCollapse.forEach(id => $(`#block-${id}`).addClass('isToggled'));
			S.Block.updateHeadersToggle(getRootId());
		}

		expandedRef.current = { toggles: [], headers: [] };
	};

	const removeHighlights = () => {
		const elements = getMatchElements();
		if (!elements) {
			return;
		}

		Array.from(elements).forEach(el => {
			const $el = $(el);
			$el.replaceWith($el.html());
		});
	};

	const clearSearch = (keepToggleId?: string, keepHeaderId?: string) => {
		removeHighlights();
		collapseExpanded(keepToggleId, keepHeaderId);

		const node = $(nodeRef.current);
		node.find('#switcher').removeClass('active');
	};

	const isElementVisible = (el: HTMLElement): boolean => {
		const style = window.getComputedStyle(el);
		return style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden';
	};

	const filterSearchElement = (el: HTMLElement): boolean => {
		const tagName = el.nodeName.toLowerCase();
		if (!SKIP_TAGS.includes(tagName)) {
			return false;
		}

		const $el = $(el);
		expandToggle($el);
		expandHeader($el);

		return isElementVisible(el);
	};

	const updateActiveMatch = (matchEl: JQuery<Element>) => {
		const toggle = matchEl.closest('.block.textToggle');
		activeMatchRef.current.toggleId = toggle.length ? toggle.attr('data-id') || '' : '';

		const block = matchEl.closest('.block');
		activeMatchRef.current.headerId = '';

		if (block.length && expandedRef.current.headers.length) {
			const blockId = block.attr('data-id');
			const hidingHeader = S.Block.getHidingHeader(getRootId(), blockId);

			if (hidingHeader && expandedRef.current.headers.includes(hidingHeader.id)) {
				activeMatchRef.current.headerId = hidingHeader.id;
			}
		}

		updateActivePosition(matchEl);
	};

	const updateActivePosition = (matchEl: JQuery<Element>) => {
		const focusable = matchEl.closest('.focusable');
		if (!focusable.length) {
			activeMatchRef.current.position = null;
			return;
		};

		const classList = (focusable.attr('class') || '').split(' ');
		const blockClass = classList.find(c => (
			c.length > 1 &&
			c.startsWith('c') &&
			!c.includes('c-') &&
			c !== 'contentEditable'
		));

		if (!blockClass) {
			activeMatchRef.current.position = null;
			return;
		};

		const blockId = blockClass.substring(1);
		const containerEl = focusable.find('.editable').get(0);

		if (!containerEl) {
			activeMatchRef.current.position = null;
			return;
		};

		try {
			const range = document.createRange();
			range.setStart(containerEl, 0);
			range.setEndBefore(matchEl.get(0));

			const from = range.toString().length;
			const to = from + (matchEl.get(0).textContent?.length || 0);

			activeMatchRef.current.position = { blockId, range: { from, to } };
		} catch {
			activeMatchRef.current.position = null;
		};
	};

	const scrollToMatch = (matchEl: JQuery<Element>) => {
		const container = getContainer();
		const scrollTop = container.scrollTop();
		const matchTop = matchEl.offset()?.top || 0;
		const containerTop = container.offset()?.top || 0;
		const containerHeight = container.height() || 0;
		const offset = J.Size.lastBlock + J.Size.header;
		const targetY = matchTop - containerTop + scrollTop;

		container.scrollTop(targetY - containerHeight + offset);
	};

	const updateMatchCounter = () => {
		const node = $(nodeRef.current);
		const total = matchElementsRef.current?.length || 0;
		node.find('#cnt').text(`${n.current + 1}/${total}`);
	};

	const focusCurrentMatch = () => {
		const elements = matchElementsRef.current;
		if (!elements?.length) {
			return;
		};

		const container = getContainer();
		const tag = getSearchTag();
		container.find(`${tag}.active`).removeClass('active');

		const currentEl = $(elements[n.current]);
		if (!currentEl.length) {
			return;
		};

		currentEl.addClass('active');
		updateActiveMatch(currentEl);
		updateMatchCounter();
		scrollToMatch(currentEl);
	};

	const navigateMatch = (direction: number) => {
		const total = matchElementsRef.current?.length || 0;
		if (!total) {
			return;
		};

		n.current += direction;

		if (n.current < 0) {
			n.current = total - 1;
		} else if (n.current >= total) {
			n.current = 0;
		};

		focusCurrentMatch();
	};

	const search = () => {
		const value = inputRef.current?.getValue() || '';

		if (value && lastSearchRef.current === value) {
			return;
		};

		const container = getContainer();
		const node = $(nodeRef.current);
		const switcher = node.find('#switcher').removeClass('active');

		n.current = 0;
		clearSearch();
		lastSearchRef.current = value;
		storageSet({ search: value });

		if (!value) {
			return;
		}

		analytics.event('SearchWords', { length: value.length, route });

		// Expand all collapsed headers before searching so content is visible
		expandAllCollapsedHeaders();

		findAndReplaceDOMText(container.get(0), {
			preset: 'prose',
			find: new RegExp(U.String.regexEscape(value), 'gi'),
			wrap: getSearchTag(),
			portionMode: 'first',
			filterElements: filterSearchElement,
		});

		matchElementsRef.current = getMatchElements();
		const hasMatches = !!matchElementsRef.current?.length;
		switcher.toggleClass('active', hasMatches);

		// Collapse headers that don't contain any matches
		collapseHeadersWithoutMatches();

		updateMatchCounter();
		focusCurrentMatch();
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		keyboard.shortcut('arrowup, arrowdown, tab, enter', e, () => {
			e.preventDefault();
		});

		keyboard.shortcut('searchText', e, () => {
			e.preventDefault();
			e.stopPropagation();
			navigateMatch(1);
			window.clearTimeout(searchTimeoutRef.current);
		});
	};

	const onKeyUp = (e: React.KeyboardEvent) => {
		e.preventDefault();
		window.clearTimeout(searchTimeoutRef.current);

		let handled = false;

		keyboard.shortcut('tab, enter', e, () => {
			search();
			handled = true;
		});

		keyboard.shortcut('arrowup, arrowdown, tab, enter, searchText', e, (pressed: string) => {
			navigateMatch(pressed === 'arrowup' ? -1 : 1);
			handled = true;
		});

		if (!handled) {
			searchTimeoutRef.current = window.setTimeout(search, J.Constant.delay.keyboard);
		};
	};

	const onClear = () => {
		inputRef.current?.setValue('');
		close();
		storageSet({ search: '' });
	};

	const restoreFocus = () => {
		const position = activeMatchRef.current.position;

		if (position) {
			window.setTimeout(() => {
				focus.set(position.blockId, position.range);
				focus.apply();
			}, 0);
		} else {
			keyboard.setFocus(false);
		};
	};

	useEffect(() => {
		const initTimeout = window.setTimeout(() => {
			const value = String(data.value || storageGet().search || '');
			inputRef.current?.setValue(value);
			inputRef.current?.setRange({ from: 0, to: value.length });
			search();
		}, 100);

		return () => {
			window.clearTimeout(initTimeout);
			window.clearTimeout(searchTimeoutRef.current);

			const { toggleId, headerId } = activeMatchRef.current;
			clearSearch(toggleId, headerId);
			restoreFocus();
		};
	}, []);

	return (
		<div ref={nodeRef} className="flex">
			<Icon className="search" />

			<Input
				ref={inputRef}
				placeholder={translate('commonSearchPlaceholder')}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
			/>

			<div className="buttons">
				<div id="switcher" className="switcher">
					<Icon className="arrow left" onClick={() => navigateMatch(-1)} />
					<div id="cnt" className="cnt" />
					<Icon className="arrow right" onClick={() => navigateMatch(1)} />
				</div>

				<div className="line" />

				<Icon className="clear" onClick={onClear} />
			</div>
		</div>
	);

});

export default MenuSearchText;