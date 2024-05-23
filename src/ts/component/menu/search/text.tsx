import * as React from 'react';
import $ from 'jquery';
import findAndReplaceDOMText from 'findandreplacedomtext';
import { Icon, Input } from 'Component';
import { I, UtilCommon, keyboard, translate, analytics } from 'Lib';
const Constant = require('json/constant.json');

const SKIP = [ 
	'span', 'div', 'name', 'markupMention', 'markupColor', 'markupBgcolor', 'markupStrike', 'markupCode', 'markupItalic', 'markupBold', 
	'markupUnderline', 'markupLink', 'markupEmoji', 'markupObject',
].map(tag => tag.toLowerCase());

class MenuSearchText extends React.Component<I.Menu> {
	
	node: any = null;
	ref = null;
	last = '';
	n = 0;
	toggled = [];
	items: any = null;
	container = null;
	timeout = 0;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onClear = this.onClear.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onSearch = this.onSearch.bind(this);
	};

	render () {
		return (
			<div 
				ref={node => this.node = node}
				className="flex"
			>
				<Icon className="search" />

				<Input 
					ref={ref => this.ref = ref} 
					placeholder={translate('commonSearchPlaceholder')}
					onKeyDown={this.onKeyDown} 
					onKeyUp={this.onKeyUp} 
				/>
				<div className="buttons">

					<div id="switcher" className="switcher">
						<Icon className="arrow left" onClick={() => this.onArrow(-1)} />
						<div id="cnt" className="cnt" />
						<Icon className="arrow right" onClick={() => this.onArrow(1)} />
					</div>

					<div className="line" />

					<Icon className="clear" onClick={this.onClear} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { param, storageGet } = this.props;
		const { data } = param;

		this.container = this.getSearchContainer();

		window.setTimeout(() => { 
			const value = String(data.value || storageGet().search || '');

			this.ref?.setValue(value);
			this.ref?.setRange({ from: 0, to: value.length });
			this.search();
		}, 100);
	};

	componentWillUnmount () {
		this.clear();
		keyboard.setFocus(false);
		window.clearTimeout(this.timeout);
	};

	onKeyDown (e: any) {
		keyboard.shortcut('arrowup, arrowdown, tab, enter', e, () => {
			e.preventDefault();
		});
	};
	
	onKeyUp (e: any) {
		e.preventDefault();

		const cmd = keyboard.cmdKey();

		let ret = false;

		keyboard.shortcut(`arrowup, arrowdown, tab, enter, ${cmd}+f`, e, (pressed: string) => {
			this.onArrow(pressed == 'arrowup' ? -1 : 1);
			ret = true;
		});

		if (ret) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.search(), Constant.delay.keyboard);
	};

	onArrow (dir: number) {
		const max = (this.items || []).length - 1;

		this.n += dir;

		if (this.n < 0) {
			this.n = max;
		};
		if (this.n > max) {
			this.n = 0;
		};

		this.search();
	};

	onSearch (e: any) {
		this.focus();
		this.onArrow(1);
	};

	search () {
		const { storageSet, param } = this.props;
		const { data } = param;
		const { route } = data;
		const value = this.ref.getValue();
		const node = $(this.node);
		const cnt = node.find('#cnt');
		const switcher = node.find('#switcher').removeClass('active');

		if (this.last != value) {
			this.n = 0;
			this.clear();
		};
		this.last = value;
		
		storageSet({ search: value });

		if (!value) {
			return;
		};

		analytics.event('SearchWords', { length: value.length, route });

		findAndReplaceDOMText(this.container.get(0), {
			preset: 'prose',
			find: new RegExp(UtilCommon.regexEscape(value), 'gi'),
			wrap: 'search',
			portionMode: 'first',
			filterElements: (el: any) => {
				const tag = el.nodeName.toLowerCase();
				if (SKIP.indexOf(tag) < 0) {
					return false;
				};

				const parents = $(el).parents('.block.textToggle:not(.isToggled)');
				if (parents.length) {
					const parent = $(parents[0]);
					const id = parents.attr('data-id');

					this.toggled.push(id);
					parent.addClass('isToggled');
				};

				const style = window.getComputedStyle(el);
				if ((style.display == 'none') || (style.opacity == '0') || (style.visibility == 'hidden')) {
					return false;
				};
				return true;
			},
		});

		this.items = this.container.get(0).querySelectorAll('search') || [];
		this.items.length ? switcher.addClass('active') : switcher.removeClass('active');

		cnt.text(`${this.n + 1}/${this.items.length}`);

		this.focus();
	};

	onClear () {
		const { storageSet, close } = this.props;

		this.ref.setValue('');
		this.clear();

		close();
		storageSet({ search: '' });
	};

	clear () {
		if (!this.items) {
			return;
		};

		const node = $(this.node);
		const switcher = node.find('#switcher');

		for (let i = 0; i < this.items.length; i++) {
			const item = $(this.items[i]);

			item.replaceWith(item.html());
		};

		for (const id of this.toggled) {
			$(`#block-${id}`).removeClass('isToggled');
		};

		this.toggled = [];
		switcher.removeClass('active');
	};

	getScrollContainer () {
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;

		if (!isPopup) {
			return $(window);
		} else {
			const scrollable = this.container.find('.scrollable');

			return scrollable.length ? scrollable : this.container;
		};
	};

	getSearchContainer () {
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;

		if (!isPopup) {
			return $('#page.isFull');
		} else {
			return $('.popup').last().find('.innerWrap');
		};
	};

	focus () {
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;
		const scrollContainer = this.getScrollContainer();
		const offset = Constant.size.lastBlock + UtilCommon.sizeHeader();

		this.container.find('search.active').removeClass('active');

		const next = $(this.items[this.n]);

		if (!next || !next.length) {
			return;
		};

		next.addClass('active');
		
		const st = this.container.scrollTop();
		const no = next.offset().top;

		let wh = 0;
		let y = 0;

		if (isPopup) {
			y = no - this.container.offset().top + st;
			wh = scrollContainer.height();
		} else {
			y = no;
			wh = $(window).height();
		};

		scrollContainer.scrollTop(y - wh + offset);
	};
	
};

export default MenuSearchText;