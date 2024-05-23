import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { I, M, UtilCommon, keyboard } from 'Lib';
import { blockStore, dbStore } from 'Store';
const Constant = require('json/constant.json');

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
		node.find('.selectionTarget').attr({ id: '' });

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
		if (this._isMounted) {
			this.setState({ rootId: '', type: I.DropType.None, ids: [], width: 0 });
		};
	};

	renderContent () {
		const { rootId, type, ids } = this.state;
		const node = $(this.node);
		const inner = node.find('#inner').html('');
		const container = UtilCommon.getPageContainer(keyboard.isPopup());
		const wrap = $('<div></div>');

		switch (type) {
			case I.DropType.Block: {
				wrap.addClass('blocks');

				const items = ids.map(id => blockStore.getLeaf(rootId, id)).filter(it => it).map(it => new M.Block(UtilCommon.objectCopy(it)));

				items.forEach(block => {
					const clone = container.find(`#block-${block.id}`).clone();

					wrap.append(clone);

					if (block.isDataview()) {
						const controls = clone.find('.dataviewControls');

						clone.find('.content').remove();
						controls.find('#views').remove();
						controls.find('#view-selector').remove();
						controls.find('#sideRight').remove();
					};

					if (block.isEmbed()) {
						clone.find('#value').remove();
						clone.find('.preview').css({ display: 'block' });
					};
				});
				break;
			};

			case I.DropType.Relation: {
				const add = $('<div class="menu vertical menuBlockRelationView"></div>');

				wrap.addClass('menus').append(add);

				const items = ids.map(relationKey => dbStore.getRelationByKey(relationKey)).filter(it => it);

				items.forEach(item => {
					const el = $(`#menuBlockRelationView #item-${item.id}`);
					add.append(el.clone());
				});
				break;
			};

			case I.DropType.Record: {
				if (!ids.length) {
					break;
				};

				const first = container.find(`#record-${ids[0]}`);
				const cn = first.parents('.viewContent').attr('class');
				const block = $('<div class="block blockDataview"></div>');
				const view = $('<div />');

				view.addClass(cn);
				block.append(view);

				wrap.addClass('blocks').append(block);

				ids.forEach((id: string, idx: number) => {
					const el = container.find(`#record-${id}`);
					const clone = el.clone().addClass('record');

					view.append(clone);
					clone.css({ width: el.width() });
				});
				break;
			};
		};

		inner.append(wrap);
	};
	
};

export default DragLayer;