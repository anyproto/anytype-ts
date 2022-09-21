import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input, Button } from 'Component';
import { I, Util, keyboard, translate, analytics } from 'Lib';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const findAndReplaceDOMText = require('findandreplacedomtext');
const SKIP = [ 
	'span', 'div', 'name', 'mention', 'color', 'bgcolor', 'strike', 'kbd', 'italic', 'bold', 
	'underline', 'lnk', 'emoji', 'obj',
];

class MenuSearchText extends React.Component<Props, {}> {
	
	ref: any = null;
	last: string = '';
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClear = this.onClear.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onSearch = this.onSearch.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		return (
			<div className="flex">
				<Icon className="search" />

				<Input ref={(ref: any) => { this.ref = ref; }} value={value} placeholder={translate('commonSearch')} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} />
				<div className="buttons">

					<div id="switcher" className="switcher">
						<Icon className="arrow left" onClick={() => { this.onArrow(-1); }} />
						<div id="cnt" className="cnt"></div>
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
		const searchContainer = this.getSearchContainer();
		const value = Util.filterFix(this.ref.getValue());
		const node = $(ReactDOM.findDOMNode(this));
		const switcher = node.find('#switcher').removeClass('active');

		if (this.last != value) {
			this.n = 0;
			this.clear();
		};
		this.last = value;

		if (!value) {
			return;
		};

		analytics.event('SearchWords', { length: value.length });

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
		const node = $(ReactDOM.findDOMNode(this));
		const cnt = node.find('#cnt');
		const items = this.getItems();

		cnt.text(`${this.n + 1}/${items.length}`);
	};

	onClear () {
		this.ref.setValue('');
		this.clear();
	};

	clear () {
		const node = $(ReactDOM.findDOMNode(this));
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
		const offset = Constant.size.lastBlock + Util.sizeHeader();

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