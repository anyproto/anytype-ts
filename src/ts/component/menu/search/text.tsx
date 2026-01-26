import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import findAndReplaceDOMText from 'findandreplacedomtext';
import { Icon, Input } from 'Component';
import { I, U, J, keyboard, translate, analytics, Mark, focus } from 'Lib';

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

	const { param, storageGet, storageSet, close, getId } = props;
	const { data } = param;
	const { route, isPopup } = data;

	const nodeRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<any>(null);
	const searchTimeoutRef = useRef(0);
	const lastSearchRef = useRef('');
	const n = useRef(0);
	const matchElementsRef = useRef<NodeListOf<Element> | null>(null);

	const expandedRef = useRef<ExpandedState>({ toggles: [] });
	const activeMatchRef = useRef<ActiveMatch>({ toggleId: '', position: null });

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

	const collapseExpanded = (keepToggleId?: string) => {
		const { toggles } = expandedRef.current;

		toggles
			.filter(id => id !== keepToggleId)
			.forEach(id => $(`#block-${id}`).removeClass('isToggled'));

		expandedRef.current = { toggles: [] };
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

	const clearSearch = (keepToggleId?: string) => {
		removeHighlights();
		collapseExpanded(keepToggleId);

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

		return isElementVisible(el);
	};

	const updateActiveMatch = (matchEl: JQuery<Element>) => {
		const toggle = matchEl.closest('.block.textToggle');
		activeMatchRef.current.toggleId = toggle.length ? toggle.attr('data-id') || '' : '';

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
		const text = total > 0 ? `${n.current + 1} of ${total}` : '';

		node.find('#switcher').text(text).toggleClass('active', total > 0);
		node.find('.arrow.up').toggleClass('disabled', n.current <= 0);
		node.find('.arrow.down').toggleClass('disabled', n.current >= total - 1 || total === 0);
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
		};

		analytics.event('SearchWords', { length: value.length, route });

		findAndReplaceDOMText(container.get(0), {
			preset: 'prose',
			find: new RegExp(U.String.regexEscape(value), 'gi'),
			wrap: getSearchTag(),
			portionMode: 'first',
			filterElements: filterSearchElement,
		});

		matchElementsRef.current = getMatchElements();
		switcher.toggleClass('active', !!matchElementsRef.current?.length);

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
		const menu = $(`#${getId()}`);
		const header = $('#header .side.center');
		const width = Math.min(header.width(), J.Size.editor);

		menu.css({ width });
	};

	useImperativeHandle(ref, () => ({
		beforePosition,
	}), []);

	useEffect(() => {
		beforePosition();
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
					<Icon className="search" />
					<Input
						ref={inputRef}
						placeholder={translate('commonSearch')}
						onKeyDown={onKeyDown}
						onKeyUp={onKeyUp}
					/>
					<div id="switcher" className="cnt" />
					<Icon className="clear" onClick={onClear} />
				</div>

				<div className="arrowWrapper">
					<Icon className="arrow up" onClick={() => navigateMatch(-1)} />
					<Icon className="arrow down" onClick={() => navigateMatch(1)} />
				</div>
			</div>
		</div>
	);

});

export default MenuSearchText;