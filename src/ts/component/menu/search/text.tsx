import * as React from 'react';
import $ from 'jquery';
import findAndReplaceDOMText from 'findandreplacedomtext';
import { Icon, Input } from 'Component';
import { I, U, J, keyboard, translate, analytics, Mark } from 'Lib';

const SKIP = [ 'span', 'div', 'name' ].concat(Object.values(Mark.getTags()));

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
		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`arrowup, arrowdown, tab, enter`, e, () => {
			e.preventDefault();
		});

		keyboard.shortcut('searchText', e, () => {
			e.preventDefault();
			e.stopPropagation();

			this.onArrow(1);
			window.clearTimeout(this.timeout);
		});
	};
	
	onKeyUp (e: any) {
		e.preventDefault();
		window.clearTimeout(this.timeout);

		let ret = false;

		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`tab, enter`, e, () => {
			this.search();
			ret = true;
		});

		keyboard.shortcut(`arrowup, arrowdown, tab, enter, ${cmd}+f`, e, (pressed: string) => {
			this.onArrow(pressed == 'arrowup' ? -1 : 1);
			ret = true;
		});

		if (ret) {
			return;
		};

		this.timeout = window.setTimeout(() => this.search(), J.Constant.delay.keyboard);
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

		this.focus();
	};

	onSearch (e: any) {
		this.focus();
		this.onArrow(1);
	};

	search () {
		if (!this.container || !this.container.length) {
			return;
		};

		const value = this.ref?.getValue();
		if (value && (this.last == value)) {
			return;
		};

		const { storageSet, param } = this.props;
		const { data } = param;
		const { route } = data;
		const node = $(this.node);
		const switcher = node.find('#switcher').removeClass('active');
		const tag = Mark.getTag(I.MarkType.Search);

		this.n = 0;
		this.clear();
		this.last = value;
		
		storageSet({ search: value });

		if (!value) {
			return;
		};

		analytics.event('SearchWords', { length: value.length, route });

		findAndReplaceDOMText(this.container.get(0), {
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

		this.items = this.container.get(0).querySelectorAll(tag) || [];
		
		switcher.toggleClass('active', !!this.items.length);

		this.setCnt();
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
		if (!this.container || !this.container.length) {
			return;
		};

		const node = $(this.node);
		const switcher = node.find('#switcher');
		const tag = Mark.getTag(I.MarkType.Search);
		const items = this.container.get(0).querySelectorAll(tag) || [];

		for (let i = 0; i < items.length; i++) {
			const item = $(items[i]);

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
			return $('#pageFlex.isFull');
		} else {
			return $('.popup').last().find('#pageFlex.isPopup');
		};
	};

	focus () {
		if (!this.items || !this.items.length) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;
		const scrollContainer = this.getScrollContainer();
		const offset = J.Size.lastBlock + J.Size.header;
		const tag = Mark.getTag(I.MarkType.Search);

		this.container.find(`${tag}.active`).removeClass('active');

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

		this.setCnt();
		scrollContainer.scrollTop(y - wh + offset);
	};

	setCnt () {
		const node = $(this.node);
		const cnt = node.find('#cnt');

		cnt.text(`${this.n + 1}/${this.items.length}`);
	};
	
};

export default MenuSearchText;