import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Title, Smile, Loader } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup {
	history: any;
};

interface State {
	loading: boolean;
};

const $ = require('jquery');

@observer
class PopupArchive extends React.Component<Props, State> {

	state = {
		loading: false,
	};
	ids: string[] = [];

	render () {
		const { loading } = this.state;
		const { archive } = blockStore;
		const element = blockStore.getLeaf(archive, archive);
		
		if (!element) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(archive, archive);
		const length = childrenIds.length;
		const children = blockStore.getChildren(archive, archive);
		const map = blockStore.getDetailMap(archive);
		const size = map.size;
		
		const Item = (item: any) => {
			const content = item.content || {};
			const details = blockStore.getDetail(archive, content.targetBlockId);
			
			return (
				<div id={'item-' + content.targetBlockId} className="item" onClick={(e: any) => { this.onSelect(item); }}>
					<Icon className="checkbox" />
					<Smile icon={details.iconEmoji} className="c24" size={20} />
					<div className="name">{details.name}</div>
				</div>
			);
		};
		
		return (
			<div>
				{loading ? <Loader /> : ''}
				<div className="head">
					<Title text="Archive" />
					<div className="sides">
						<div className="side left">
							<div className="btn" onClick={(e: any) => { this.onSelectAll(); }}>Select all</div>
						</div>
						<div className="side right">
							<div className="btn" onClick={(e: any) => { this.onReturn(); }}>Put it back</div>
							<div className="btn" onClick={(e: any) => { this.onDelete(); }}>Delete</div>
						</div>
					</div>
				</div>
				<div className="items">
					{children.map((item: any, i: any) => (
						<Item key={item.id} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { archive } = blockStore;
		
		this.setState({ loading: true });
		C.BlockOpen(archive, [], (message: any) => {
			this.setState({ loading: false });
		});
		
		this.ids = [];
		this.checkButtons();
	};
	
	componentDidUpdate () {
		this.checkButtons();
	};
	
	componentWillUnmount () {
		const { archive } = blockStore;
		C.BlockClose(archive, [], (message: any) => {});
	};
	
	onSelect (item: any) {
		const id = item.content.targetBlockId;
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + id);
		const idx = this.ids.indexOf(id);
		
		if (idx < 0) {
			this.ids.push(id);
			el.addClass('active');
		} else {
			this.ids.splice(idx, 1);
			el.removeClass('active');
		};
		
		this.ids = [ ...new Set(this.ids) ];
		this.checkButtons();
	};
	
	onSelectAll () {
		const { archive } = blockStore;
		const children = blockStore.getChildren(archive, archive);
		const node = $(ReactDOM.findDOMNode(this));
		
		if (this.ids.length == children.length) {
			this.ids = [];
		} else {
			this.ids = children.map((it: I.Block) => { return it.content.targetBlockId; });
		};
		
		node.find('.item.active').removeClass('active');
		for (let id of this.ids) {
			node.find('#item-' + id).addClass('active');
		};
		
		this.checkButtons();
	};
	
	checkButtons () {
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('.side.right');
		
		el.css({ opacity: (this.ids.length ? 1 : 0) });
	};
	
	onReturn () {
		const { archive } = blockStore;
		C.BlockListSetPageIsArchived(archive, this.ids, false, (message: any) => {
			this.ids = [];
			this.checkButtons();
		});
	};
	
	onDelete () {
		this.setState({ loading: true });
		C.BlockListDeletePage(this.ids, (message: any) => {
			this.ids = [];
			this.checkButtons();
			this.setState({ loading: false });
		});
	};
	
};

export default PopupArchive;