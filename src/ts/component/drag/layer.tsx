import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { observer } from 'mobx-react'; 
import { I, M, S, U, J, keyboard } from 'Lib';

const DragLayer = observer(forwardRef((_, ref: any) => {
	
	const nodeRef = useRef(null);

	const show = (rootId: string, type: I.DropType, ids: string[], component: any) => {
		const comp = $(ReactDOM.findDOMNode(component));
		const rect = (comp.get(0) as Element).getBoundingClientRect();
		const width = rect.width - J.Size.blockMenu;
		const node = $(nodeRef.current);
		const inner = node.find('#inner').html('');
		const container = U.Common.getPageContainer(keyboard.isPopup());
		const wrap = $('<div></div>');
		
		switch (type) {
			case I.DropType.Block: {
				wrap.addClass('blocks');

				const items = ids.map(id => S.Block.getLeaf(rootId, id)).filter(it => it).map(it => new M.Block(U.Common.objectCopy(it)));

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

				const items = ids.map(relationKey => S.Record.getRelationByKey(relationKey)).filter(it => it);

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

		node.css({ width });
		node.find('.block').attr({ id: '' });
		node.find('.selectionTarget').attr({ id: '' });
	};

	const hide = () => {
		$(nodeRef.current).find('#inner').html('');
	};

	useImperativeHandle(ref, () => ({
		show,
		hide,
	}));

	return (
		<div 
			ref={nodeRef}
			id="dragLayer" 
			className="dragLayer" 
		>
			<div id="inner" className="inner" />
		</div>
	);

}));

export default DragLayer;