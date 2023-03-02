import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { I, M, Util } from 'Lib';
import { blockStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	rootId: string;
	type: I.DropType;
	width: number;
	ids: string[];
};

class DragLayer extends React.Component<object, State> {
	
	_isMounted = false;
	node: any = null;
	state = {
		rootId: '',
		type: I.DropType.None,
		width: 0,
		ids: [] as string[],
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
	};
	
	render () {
		const { width } = this.state;
		
		return (
			<div 
				ref={node => this.node = node}
				id="dragLayer" 
				className="dragLayer" 
				style={{ width }}
			>
				<div id="inner" className="inner" />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentDidUpdate () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		
		node.find('.block').attr({ id: '' });
		node.find('.selectable').attr({ id: '' });

		this.renderContent();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	show (rootId: string, type: I.DropType, ids: string[], component: any, x: number, y: number) {
		if (!this._isMounted) {
			return;
		};
		
		const comp = $(ReactDOM.findDOMNode(component));
		const rect = (comp.get(0) as Element).getBoundingClientRect();
		
		this.setState({ rootId, type, width: rect.width - Constant.size.blockMenu, ids });
	};

	hide () {
		if (!this._isMounted) {
			return;
		};

		this.setState({ rootId: '', type: I.DropType.None, ids: [], width: 0 });
	};

	renderContent () {
		const { rootId, type, ids } = this.state;
		const node = $(this.node);
		const inner = node.find('#inner').html('');

		let wrap = $('<div></div>');
		let items: any[] = [];

		switch (type) {
			case I.DropType.Block: {
				wrap.addClass('blocks');

				items = ids.map(id => blockStore.getLeaf(rootId, id)).filter(it => it).map(it => new M.Block(Util.objectCopy(it)));

				items.forEach(block => {
					const clone = $(`#block-${block.id}`).clone();

					if (block.isDataview()) {
						clone.find('.viewItem').remove();
						clone.find('.dataviewControls').remove();
					};

					wrap.append(clone);
				});
				break;
			};

			case I.DropType.Relation: {
				const add = $('<div class="menu vertical menuBlockRelationView"></div>');

				wrap.addClass('menus').append(add);

				items = ids.map(relationKey => dbStore.getRelationByKey(relationKey)).filter(it => it);
				items.forEach(item => {
					const el = $(`#menuBlockRelationView #item-${item.id}`);
					add.append(el.clone());
				});
				break;
			};

			case I.DropType.Record: {
				const cn = $(`.drop-target-${ids[0]}`).parents('.viewItem').attr('class');
				const dataview = $('<div class="block blockDataview"></div>');
				const view = $('<div />');

				view.addClass(cn);
				dataview.append(view);
				wrap.addClass('blocks').append(dataview);

				ids.forEach((id, idx) => {
					const el = $(`.drop-target-${id}`).parent();
					const style = {
						marginLeft: idx * 10,
						marginTop: idx * 10,
						zIndex: ids.length - idx
					};

					view.append(el.clone().addClass('record').css(style));
				});
				break;
			};
		};

		inner.append(wrap);
	};
	
};

export default DragLayer;