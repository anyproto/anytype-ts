import * as React from 'react';
import { Input } from 'ts/component';
import { I, Util, keyboard, translate } from 'ts/lib';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const findAndReplaceDOMText = require('findandreplacedomtext');
const SKIP = [ 
	'span', 'div', 'name', 'mention', 'color', 'bgcolor', 'strike', 'kbd', 'italic', 'bold', 'underline', 'lnk', 'emoji',
];

class MenuSearch extends React.Component<Props, {}> {
	
	ref: any = null;
	last: string = '';
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
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
				<Input ref={(ref: any) => { this.ref = ref; }} value={value} placeHolder={translate('commonSearch')} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} />
				<div className="buttons">
					<div className="btn" onClick={this.onSearch}>{translate('commonSearchButton')}</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
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
		keyboard.shortcut('tab', e, (pressed: string) => {
			e.preventDefault();
		});
	};
	
	onKeyUp (e: any) {
		e.preventDefault();
		
		let ret = false;
		keyboard.shortcut('arrowup, arrowdown, tab, enter', e, (pressed: string) => {
			this.focus();
			this.n += pressed == 'arrowup' ? -1 : 1;
			ret = true;
		});

		if (ret) {
			return;
		};

		this.search();
	};

	onSearch (e: any) {
		this.focus();
		this.n++;
		this.search();
	};

	search () {
		const { param } = this.props;
		const { data } = param;
		const { container } = data;
		const value = Util.filterFix(this.ref.getValue());

		if (this.last != value) {
			this.n = 0;
			this.clear();
		};
		this.last = value;

		if (!value) {
			return;
		};

		findAndReplaceDOMText(container.get(0), {
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
	};

	clear () {
		const { param } = this.props;
		const { data } = param;
		const { container } = data;

		container.find('search').each((i: number, item: any) => {
			item = $(item);
			item.replaceWith(item.html());
		});
	};

	focus () {
		const { param } = this.props;
		const { data } = param;
		const { container } = data;
		const win = $(window);
		const items = container.find('.editor search');
		const wh = win.height();
		const offset = Constant.size.lastBlock + Constant.size.header;

		if (this.n > items.length - 1) {
			this.n = 0;
		};

		container.find('search.active').removeClass('active');

		const next = $(items.get(this.n));
		if (next && next.length) {
			next.addClass('active');
		
			const y = next.offset().top;
			$('html, body').stop(true, true).animate({ scrollTop: y - wh + offset }, 100);
		};
	};
	
};

export default MenuSearch;