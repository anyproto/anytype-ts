import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Smile, Icon, Button, Input, Cover } from 'ts/component';
import { I, Util } from 'ts/lib';
import { authStore, commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

const $ = require('jquery');

interface Props extends I.Popup {};
interface State {
	expanded: boolean;
	filter: string;
	id: string;
};

@observer
class PopupTree extends React.Component<Props, State> {
	
	state = {
		expanded: false,
		filter: '',
		id: '',
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
		const { expanded, filter, id } = this.state;
		const { param, } = this.props;
		const { data } = param;
		const { rootId, type } = data;
		const { account } = authStore;
		const { root } = blockStore;
		const map = blockStore.getDetailMap(root);
		const size = map.size;
		
		let tree = blockStore.getTree(root, blockStore.getBlocks(root));
		let selected = null;
		
		if (filter) {
			const reg = new RegExp(filter, 'gi');
			tree = tree.filter((it: I.Block) => { 
				const content = it.content || {};
				const details = blockStore.getDetail(root, content.targetBlockId);
				
				return String(details.name || '').match(reg); 
			});
		};
		
		if (expanded) {
			selected = blockStore.getLeaf(root, id);
		};
		
		const Item = (item: any) => {
			const content = item.content || {};
			const details = blockStore.getDetail(root, content.targetBlockId);
			
			return (
				<div id={'item-' + item.id} className="item" onClick={(e: any) => { this.onClick(e, item); }}>
					<Smile icon={details.icon} className="c48" size={24} />
					<div className="info">
						<div className="name">{details.name}</div>
						<div className="descr">We can both help with building an it's a distillation of themes found on ...</div>
					</div>
					<Icon className="arrow" />
				</div>
			);
		};
		
		const Selected = (item: any) => {
			const content = item.content || {};
			const details = blockStore.getDetail(root, content.targetBlockId);
			const { coverType, coverId, coverX, coverY, coverScale } = details;
			
			return (
				<div className="selected">
					<Smile icon={details.icon} className="c48" size={24} />
					<div className="name">{details.name}</div>
					<div className="descr">We can both help with building an it's a distillation of themes found on ...</div>
					<Cover type={coverType} image={commonStore.imageUrl(coverId, 2048)} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} />
					<div className="buttons">
						<Button text="Open" className="orange" onClick={this.onConfirm} />
						<Button text="Cancel" className="grey" onClick={this.onCancel} />
					</div>
				</div>
			);
		};
		
		return (
			<div className={expanded ? 'expanded' : ''}>
				{expanded ? (
					<React.Fragment>
						<div className="head">
							
						</div>
						<div className="sides">
							<div className="items left">
								{tree.map((item: any, i: number) => {
									return <Item key={i} {...item} />;
								})}
							</div>
							<div className="items center">
								<Selected {...selected} />
							</div>
							<div className="items right">
								{tree.map((item: any, i: number) => {
									return <Item key={i} {...item} />;
								})}
							</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						<form className="head" onSubmit={this.onSubmit}>
							<Icon className="search" />
							<Input ref={(ref: any) => { this.ref = ref; }} placeHolder="Type to search..." onKeyUp={(e: any) => { this.onKeyUp(e, false); }} />
						</form>
						{!tree.length ? (
							<div className="empty">
								<div className="txt">
									<b>There is no pages named "{filter}"</b>
									Try creating a new one or search for something else.
								</div>
							</div>
						) : (
							<div className="items">
								{tree.map((item: any, i: number) => {
									return <Item key={i} {...item} />;
								})}
							</div>
						)}
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
		const { expanded } = this.state;
		const win = $(window);
		const obj = $('#popupTree');
		const head = obj.find('.head');
		const items = obj.find('.items');
		const sides = obj.find('.sides');
		const empty = obj.find('.empty');
		const offset = expanded ? 32 : 0;
		const height = win.height() - head.outerHeight() - 128;
		
		sides.css({ height: height });
		items.css({ height: height - offset });
		empty.css({ height: height, lineHeight: height + 'px' });
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
		this.setState({ expanded: true, id: item.id });
	};
	
	onConfirm (e: any) {
	};
	
	onCancel (e: any) {
	};
	
};

export default PopupTree;