import React, { forwardRef, useEffect, useRef } from 'react';
import $ from 'jquery';
import findAndReplaceDOMText from 'findandreplacedomtext';
import { Icon, Input } from 'Component';
import { I, U, J, keyboard, translate, analytics, Mark } from 'Lib';

const SKIP = [ 'span', 'div', 'name' ].concat(Object.values(Mark.getTags()));

const MenuSearchText = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, storageGet, storageSet, close } = props;
	const { data } = param;
	const { route, isPopup } = data;
	const nodeRef = useRef(null);
	const inputRef = useRef(null);
	const n = useRef(0);
	const toggledRef = useRef<Array<string>>([]);
	const itemsRef = useRef<any>(null);
	const lastRef = useRef<string>('');
	const timeoutRef = useRef<number>(0);

	const onKeyDown = (e: any) => {
		keyboard.shortcut(`arrowup, arrowdown, tab, enter`, e, () => {
			e.preventDefault();
		});

		keyboard.shortcut('searchText', e, () => {
			e.preventDefault();
			e.stopPropagation();

			onArrow(1);
			window.clearTimeout(timeoutRef.current);
		});
	};
	
	const onKeyUp = (e: any) => {
		e.preventDefault();
		window.clearTimeout(timeoutRef.current);

		let ret = false;

		keyboard.shortcut(`tab, enter`, e, () => {
			search();
			ret = true;
		});

		keyboard.shortcut(`arrowup, arrowdown, tab, enter, searchText`, e, (pressed: string) => {
			onArrow(pressed == 'arrowup' ? -1 : 1);
			ret = true;
		});

		if (ret) {
			return;
		};

		timeoutRef.current = window.setTimeout(() => search(), J.Constant.delay.keyboard);
	};

	const onArrow = (dir: number) => {
		const max = (itemsRef.current || []).length - 1;

		n.current += dir;

		if (n.current < 0) {
			n.current = max;
		};
		if (n.current > max) {
			n.current = 0;
		};

		focus();
	};

	const search = () => {
		const value = inputRef.current?.getValue();
		if (value && (lastRef.current == value)) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		const node = $(nodeRef.current);
		const switcher = node.find('#switcher').removeClass('active');
		const tag = Mark.getTag(I.MarkType.Search);

		n.current = 0;
		clear();
		lastRef.current = value;
		
		storageSet({ search: value });

		if (!value) {
			return;
		};

		analytics.event('SearchWords', { length: value.length, route });

		findAndReplaceDOMText(container.get(0), {
			preset: 'prose',
			find: new RegExp(U.Common.regexEscape(value), 'gi'),
			wrap: tag,
			portionMode: 'first',
			filterElements: (el: any) => {
				if (SKIP.indexOf(el.nodeName.toLowerCase()) < 0) {
					return false;
				};

				const parents = $(el).parents('.block.textToggle:not(.isToggled)');
				if (parents.length) {
					const parent = $(parents[0]);
					const id = parents.attr('data-id');

					toggledRef.current.push(id);
					parent.addClass('isToggled');
				};

				const style = window.getComputedStyle(el);
				if ((style.display == 'none') || (style.opacity == '0') || (style.visibility == 'hidden')) {
					return false;
				};
				return true;
			},
		});

		itemsRef.current = getItems();
		switcher.toggleClass('active', !!itemsRef.current.length);

		setCnt();
		focus();
	};

	const onClear = () => {
		inputRef.current?.setValue('');
		clear();

		close();
		storageSet({ search: '' });
	};

	const clear = () => {
		const node = $(nodeRef.current);
		const switcher = node.find('#switcher');
		const items = getItems();

		for (let i = 0; i < items.length; i++) {
			const item = $(items[i]);

			item.replaceWith(item.html());
		};

		for (const id of toggledRef.current) {
			$(`#block-${id}`).removeClass('isToggled');
		};

		toggledRef.current = [];
		switcher.removeClass('active');
	};

	const getItems = () => {
		const container = U.Common.getScrollContainer(isPopup);
		return container.length ? container.get(0).querySelectorAll(Mark.getTag(I.MarkType.Search)) : [];
	};

	const focus = () => {
		if (!itemsRef.current || !itemsRef.current.length) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		const offset = J.Size.lastBlock + J.Size.header;
		const tag = Mark.getTag(I.MarkType.Search);

		container.find(`${tag}.active`).removeClass('active');

		const next = $(itemsRef.current[n.current]);

		if (!next || !next.length) {
			return;
		};

		next.addClass('active');
		
		const st = container.scrollTop();
		const no = next.offset().top;
		const wh = container.height();
		const y = no - container.offset().top + st;

		setCnt();
		container.scrollTop(y - wh + offset);
	};

	const setCnt = () => {
		const node = $(nodeRef.current);
		const cnt = node.find('#cnt');

		cnt.text(`${n.current + 1}/${itemsRef.current.length}`);
	};

	useEffect(() => {
		window.setTimeout(() => { 
			const value = String(data.value || storageGet().search || '');

			inputRef.current?.setValue(value);
			inputRef.current?.setRange({ from: 0, to: value.length });
			search();
		}, 100);

		return () => {
			clear();
			keyboard.setFocus(false);
			window.clearTimeout(timeoutRef.current);
		};
	}, []);
	
	return (
		<div 
			ref={nodeRef}
			className="flex"
		>
			<Icon className="search" />

			<Input 
				ref={inputRef} 
				placeholder={translate('commonSearchPlaceholder')}
				onKeyDown={onKeyDown} 
				onKeyUp={onKeyUp} 
			/>

			<div className="buttons">
				<div id="switcher" className="switcher">
					<Icon className="arrow left" onClick={() => onArrow(-1)} />
					<div id="cnt" className="cnt" />
					<Icon className="arrow right" onClick={() => onArrow(1)} />
				</div>

				<div className="line" />

				<Icon className="clear" onClick={onClear} />
			</div>
		</div>
	);
	
});

export default MenuSearchText;