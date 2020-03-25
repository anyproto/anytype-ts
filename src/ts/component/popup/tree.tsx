import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Smile, Icon, Button, Input } from 'ts/component';
import { I, Util } from 'ts/lib';
import { authStore, commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

const $ = require('jquery');

interface Props extends I.Popup {};
interface State {
	expanded: boolean;
	filter: string;
};

@observer
class PopupTree extends React.Component<Props, State> {
	
	state = {
		expanded: false,
		filter: '',
	};
	ref: any = null;
	timeout: number = 0;
	
	constructor (props: any) {
		super (props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { expanded, filter } = this.state;
		const { param, } = this.props;
		const { data } = param;
		const { rootId, type } = data;
		const { account } = authStore;
		const { root } = blockStore;
		
		let tree = blockStore.getTree(root, blockStore.getBlocks(root));
		
		if (filter) {
			const reg = new RegExp(filter, 'gi');
			tree = tree.filter((it: I.Block) => { 
				return String(it.content.fields.name || '').match(reg); 
			});
		};
		
		const Item = (item: any) => {
			const { content } = item;
			const { fields } = content;
			
			return (
				<div id={'item-' + item.id} className="item" onClick={(e: any) => { this.onClick(e, item); }}>
					<Smile icon={fields.icon} className="c48" size={24} />
					<div className="info">
						<div className="name">{fields.name}</div>
						<div className="descr">We can both help with building an it's a distillation of themes found on ...</div>
					</div>
					<Icon className="arrow" />
				</div>
			);
		};
		
		return (
			<div className={expanded ? 'expanded' : ''}>
				{expanded ? (
					<React.Fragment>
						<div className="items">
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						<form className="head" onSubmit={this.onSubmit}>
							<Input ref={(ref: any) => { this.ref = ref; }} placeHolder="Type to search..." onKeyUp={(e: any) => { this.onKeyUp(e, false); }} />
						</form>
						<div className="items">
							{!tree.length ? <div className="empty">No items match criteria</div> : ''}
							{tree.map((item: any, i: number) => {
								return <Item key={i} {...item} />;
							})}
						</div>
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this.init();
		this.ref.focus();
	};
	
	componentDidUpdate () {
		this.init();
	};
	
	componentWillUnmount () {
		$(window).unbind('resize.tree');
		window.clearTimeout(this.timeout);
	};
	
	init () {
		const { expanded } = this.state;
		const win = $(window);
		const obj = $('#popupTree');
		
		expanded ? obj.addClass('expanded') : obj.removeClass('expanded');
		
		this.resize();
		win.unbind('resize.tree').on('resize.tree', () => { this.resize(); });
	};
	
	resize () {
		const win = $(window);
		const obj = $('#popupTree');
		const head = obj.find('.head');
		const items = obj.find('.items');
		
		items.css({ height: win.height() - head.outerHeight() - 128 });
		obj.css({ marginLeft: -obj.width() / 2 });
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		
		this.onKeyUp(e, true);
	};
	
	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			this.setState({ filter: Util.filterFix(this.ref.getValue()) });
		}, force ? 0 : 50);
	};
	
	onClick (e: any, item: any) {
		this.setState({ expanded: true });
	};
	
	onConfirm (e: any) {
	};
	
	onCancel (e: any) {
	};
	
};

export default PopupTree;