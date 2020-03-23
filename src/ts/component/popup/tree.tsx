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
};

@observer
class PopupTree extends React.Component<Props, State> {
	
	state = {
		expanded: false,
	};
	
	constructor (props: any) {
		super (props);
		
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { expanded } = this.state;
		const { param, } = this.props;
		const { data } = param;
		const { rootId, type } = data;
		const { account } = authStore;
		const { root } = blockStore;
		const tree = blockStore.getTree(root, blockStore.getBlocks(root));
		
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
					<div>
					</div>
				) : (
					<div>
						<div className="head">
							<Input placeHolder="Type to search..." />
						</div>
						<div className="items">
							{tree.map((item: any, i: number) => {
								return <Item key={i} {...item} />;
							})}
						</div>
					</div>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this.init();
	};
	
	componentDidUpdate () {
		this.init();
	};
	
	componentWillUnmount () {
		$(window).unbind('resize.tree');
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
	};
	
	onClick (e: any, item: any) {
	};
	
	onConfirm (e: any) {
	};
	
	onCancel (e: any) {
	};
	
};

export default PopupTree;