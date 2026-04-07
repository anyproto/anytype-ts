import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import findAndReplaceDOMText from 'findandreplacedomtext';
import { Icon, Input } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const SKIP_TAGS = [ 'span', 'div', 'name' ].concat(Object.values(Mark.getTags()));

interface MatchPosition {
	blockId: string;
	range: I.TextRange;
};

interface ExpandedState {
	toggles: string[];
};

interface ActiveMatch {
	toggleId: string;
	position: MatchPosition | null;
};

const MenuSearchText = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, storageGet, storageSet, close, getId, getContainer: getMenuContainer, position } = props;
	const { data } = param;
	const { route, isPopup } = data;

	const nodeRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<any>(null);
	const searchTimeoutRef = useRef(0);
	const lastSearchRef = useRef('');
	const n = useRef(0);
	const matchElementsRef = useRef<HTMLElement[] | null>(null);

	const expandedRef = useRef<ExpandedState>({ toggles: [] });
	const activeMatchRef = useRef<ActiveMatch>({ toggleId: '', position: null });

	const getRootId = () => keyboard.getRootId(isPopup);
	const getContainer = () => U.Dom.getScrollContainer(isPopup);
	const getSearchTag = () => Mark.getTag(I.MarkType.Search);

	const getMatchElements = (): HTMLElement[] | null => {
		const container = getContainer();
		return container ? U.Dom.selectAll(getSearchTag(), container) : null;
	};

	const expandToggle = (el: HTMLElement) => {
		const toggleParent = el.closest('.block.textToggle:not(.isToggled), .block.textToggleHeader:not(.isToggled)') as HTMLElement;
		if (!toggleParent) {
			return;
		}

		const id = toggleParent.getAttribute('data-id');
		if (id && !expandedRef.current.toggles.includes(id)) {
			expandedRef.current.toggles.push(id);
			U.Dom.addClass(toggleParent, 'isToggled');
		};
	};

	const collapseExpanded = (keepToggleId?: string) => {
		const { toggles } = expandedRef.current;

		toggles
			.filter(id => id !== keepToggleId)
			.forEach(id => U.Dom.removeClass(U.Dom.get(`block-${id}`), 'isToggled'));

		expandedRef.current = { toggles: [] };
	};

	const removeHighlights = () => {
		const elements = getMatchElements();
		if (!elements) {
			return;
		}

		Array.from(elements).forEach(el => {
			const parent = el.parentNode;
			if (parent) {
				while (el.firstChild) {
					parent.insertBefore(el.firstChild, el);
				};
				parent.removeChild(el);
			};
		});
	};

	const clearSearch = (keepToggleId?: string) => {
		removeHighlights();
		collapseExpanded(keepToggleId);

		U.Dom.removeClass(U.Dom.select('#switcher', nodeRef.current), 'active');
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

		expandToggle(el);

		return isElementVisible(el);
	};

	const updateActiveMatch = (matchEl: HTMLElement) => {
		const toggle = matchEl.closest('.block.textToggle, .block.textToggleHeader') as HTMLElement;

		activeMatchRef.current.toggleId = toggle ? toggle.getAttribute('data-id') || '' : '';

		updateActivePosition(matchEl);
	};

	const updateActivePosition = (matchEl: HTMLElement) => {
		const focusable = matchEl.closest('.focusable') as HTMLElement;
		if (!focusable) {
			activeMatchRef.current.position = null;
			return;
		};

		const classList = (focusable.getAttribute('class') || '').split(' ');
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
		const containerEl = U.Dom.select('.editable', focusable);

		if (!containerEl) {
			activeMatchRef.current.position = null;
			return;
		};

		try {
			const range = document.createRange();
			range.setStart(containerEl, 0);
			range.setEndBefore(matchEl);

			const from = range.toString().length;
			const to = from + (matchEl.textContent?.length || 0);

			activeMatchRef.current.position = { blockId, range: { from, to } };
		} catch {
			activeMatchRef.current.position = null;
		};
	};

	const scrollToMatch = (matchEl: HTMLElement) => {
		const containerEl = getContainer();
		if (!containerEl) {
			return;
		};

		const scrollTop = containerEl.scrollTop;
		const matchRect = matchEl.getBoundingClientRect();
		const matchTop = matchRect.top || 0;
		const containerRect = containerEl.getBoundingClientRect();
		const containerTop = containerRect.top || 0;
		const containerHeight = containerEl.clientHeight || 0;
		const offset = J.Size.lastBlock + J.Size.header;
		const targetY = matchTop - containerTop + scrollTop;

		containerEl.scrollTop = targetY - containerHeight + offset;
	};

	const updateMatchCounter = () => {
		const node = nodeRef.current;
		const total = matchElementsRef.current?.length || 0;
		const text = total > 0 ? `${n.current + 1} of ${total}` : '';
		const switcher = U.Dom.select('#switcher', node);
		const arrowUp = U.Dom.select('.arrow.up', node);
		const arrowDown = U.Dom.select('.arrow.down', node);

		if (switcher) {
			switcher.textContent = text;
			U.Dom.toggleClass(switcher, 'active', total > 0);
		};
		if (arrowUp) {
			U.Dom.toggleClass(arrowUp, 'disabled', n.current <= 0);
		};
		if (arrowDown) {
			U.Dom.toggleClass(arrowDown, 'disabled', n.current >= total - 1 || total === 0);
		};
	};

	const focusCurrentMatch = () => {
		const elements = matchElementsRef.current;
		if (!elements?.length) {
			return;
		};

		const containerEl = getContainer();
		const tag = getSearchTag();
		if (containerEl) {
			U.Dom.selectAll(`${tag}.active`, containerEl).forEach(el => U.Dom.removeClass(el as HTMLElement, 'active'));
		};

		const currentEl = elements[n.current] as HTMLElement;
		if (!currentEl) {
			return;
		};

		U.Dom.addClass(currentEl, 'active');
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

		const containerEl = getContainer();
		const switcher = U.Dom.select('#switcher', nodeRef.current);

		U.Dom.removeClass(switcher, 'active');

		n.current = 0;
		clearSearch();
		lastSearchRef.current = value;
		storageSet({ search: value });

		if (!value || !containerEl) {
			return;
		};

		analytics.event('SearchWords', { length: value.length, route });

		findAndReplaceDOMText(containerEl, {
			preset: 'prose',
			find: new RegExp(U.String.regexEscape(value), 'gi'),
			wrap: getSearchTag(),
			portionMode: 'first',
			filterElements: filterSearchElement,
		});

		matchElementsRef.current = getMatchElements();
		if (switcher) {
			U.Dom.toggleClass(switcher, 'active', !!matchElementsRef.current?.length);
		};

		updateMatchCounter();
		focusCurrentMatch();
	};

	const onKeyDown = (e: any, v: string) => {
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

	const onKeyUp = (e: any, v: string) => {
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
		storageSet({ search: '' });
		close();
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

	const beforePosition = () => {
		const menu = getMenuContainer();
		const header = U.Dom.select('#header .side.center');
		const width = Math.min(header?.clientWidth || 0, J.Size.editor);

		U.Dom.css(menu, { width: `${width}px` });
	};

	useImperativeHandle(ref, () => ({
		beforePosition,
	}), []);

	useEffect(() => {
		position();
		
		const initTimeout = window.setTimeout(() => {
			const value = String(data.value || storageGet().search || '');
			inputRef.current?.setValue(value);
			inputRef.current?.setRange({ from: 0, to: value.length });
			inputRef.current?.focus();
			search();
		}, 100);

		return () => {
			window.clearTimeout(initTimeout);
			window.clearTimeout(searchTimeoutRef.current);

			const { toggleId } = activeMatchRef.current;
			clearSearch(toggleId);
			restoreFocus();
		};
	}, []);

	return (
		<div ref={nodeRef} className="wrap">
			<div className="filterWrapper">
				<div className="filterContainer">
					<Icon name="common/search" className="search" />
					<Input
						ref={inputRef}
						placeholder={translate('commonSearch')}
						onKeyDown={onKeyDown}
						onKeyUp={onKeyUp}
					/>
					<div id="switcher" className="cnt" />
					<Icon name="common/clear" color="default" onClick={onClear} />
				</div>

				<div className="arrowWrapper">
					<Icon name="arrow/small" size={8} className="arrow up" onClick={() => navigateMatch(-1)} />
					<Icon name="arrow/small" size={8} className="arrow down" onClick={() => navigateMatch(1)} />
				</div>
			</div>
		</div>
	);

});

export default MenuSearchText;