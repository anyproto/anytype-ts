import * as React from 'react';
import $ from 'jquery';
import findAndReplaceDOMText from 'findandreplacedomtext';
import { Icon, Input } from 'Component';
import { I, UtilCommon, keyboard, translate, analytics } from 'Lib';
import Constant from 'json/constant.json';

const SKIP = [ 
	'span', 'div', 'name', 'mention', 'color', 'bgcolor', 'strike', 'kbd', 'italic', 'bold', 
	'underline', 'lnk', 'emoji', 'obj',
];

class MenuSearchText extends React.Component<I.Menu> {
	
	node: any = null;
	ref = null;
	last = '';
	n = 0;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onClear = this.onClear.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onSearch = this.onSearch.bind(this);
	};

	render () {
		const { param, storageGet } = this.props;
		const { data } = param;
		const value = String(data.value || storageGet().search || '');
		
		return (
			<div 
				ref={node => this.node = node}
				className="flex"
			>
				<Icon className="search" />

				<Input 
					ref={ref => this.ref = ref} 
					value={value} 
					placeholder={translate('commonSearchPlaceholder')}
					onKeyDown={this.onKeyDown} 
					onKeyUp={this.onKeyUp} 
				/>
				<div className="buttons">

					<div id="switcher" className="switcher">
						<Icon className="arrow left" onClick={() => { this.onArrow(-1); }} />
						<div id="cnt" className="cnt" />
						<Icon className="arrow right" onClick={() => { this.onArrow(1); }} />
					</div>

					<div className="line" />

					<Icon className="clear" onClick={this.onClear} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.search();

		window.setTimeout(() => { 
			if (this.ref) {
				this.ref.focus(); 
			};
		}, 100);
	};

	componentWillUnmount () {
		this.clear();
		keyboard.setFocus(false);
	};

	onKeyDown (e: any) {
		keyboard.shortcut('arrowup, arrowdown, tab, enter', e, (pressed: string) => {
			e.preventDefault();
		});
	};
	
	onKeyUp (e: any) {
		e.preventDefault();
		
		let ret = false;
		keyboard.shortcut('arrowup, arrowdown, tab, enter', e, (pressed: string) => {
			this.onArrow(pressed == 'arrowup' ? -1 : 1);
			ret = true;
		});

		if (ret) {
			return;
		};

		this.search();
	};

	onArrow (dir: number) {
		const items = this.getItems();
		const max = items.length - 1;

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
		const searchContainer = this.getSearchContainer();
		const value = UtilCommon.regexEscape(this.ref.getValue());
		const node = $(this.node);
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

		findAndReplaceDOMText(searchContainer.get(0), {
			preset: 'prose',
			find: new RegExp(value, 'gi'),
			wrap: 'search',
			portionMode: 'first',
			filterElements: (el: any) => {
				const tag = el.nodeName.toLowerCase();
				if (SKIP.indexOf(tag) < 0) {
					return false;
				};

				const style = window.getComputedStyle(el);
				if ((style.display == 'none') || (style.opacity == '0') || (style.visibility == 'hidden')) {
					return false;
				};
				return true;
			},
		});

		const items = this.getItems();

		items.length ? switcher.addClass('active') : switcher.removeClass('active');
		this.focus();
	};

	setCnt () {
		const node = $(this.node);
		const cnt = node.find('#cnt');
		const items = this.getItems();

		cnt.text(`${this.n + 1}/${items.length}`);
	};

	onClear () {
		this.ref.setValue('');
		this.clear();
		this.props.storageSet({ search: '' });
	};

	clear () {
		const node = $(this.node);
		const switcher = node.find('#switcher');
		const items = this.getItems();

		items.each((i: number, item: any) => {
			item = $(item);
			item.replaceWith(item.html());
		});

		switcher.removeClass('active');
	};

	getScrollContainer () {
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;

		if (!isPopup) {
			return $(window);
		} else {
			const container = this.getSearchContainer();
			const scrollable = container.find('.scrollable');

			return scrollable.length ? scrollable : container;
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

	getItems () {
		return this.getSearchContainer().find('search');
	};

	focus () {
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;
		const scrollContainer = this.getScrollContainer();
		const searchContainer = this.getSearchContainer();
		const items = this.getItems();
		const offset = Constant.size.lastBlock + UtilCommon.sizeHeader();

		searchContainer.find('search.active').removeClass('active');

		this.setCnt();

		const next = $(items.get(this.n));

		if (next && next.length) {
			next.addClass('active');
		
			const st = searchContainer.scrollTop();
			const no = next.offset().top;

			let wh = 0;
			let y = 0;

			if (isPopup) {
				y = no - searchContainer.offset().top + st;
				wh = scrollContainer.height();
			} else {
				y = no;
				wh = $(window).height();
			};

			scrollContainer.scrollTop(y - wh + offset);
		};
	};
	
};

export default MenuSearchText;
