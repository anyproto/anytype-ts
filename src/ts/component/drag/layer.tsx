import React, { forwardRef, useRef, useImperativeHandle } from 'react';

import * as I from 'Interface';
import * as M from 'Model';

const DragLayer = forwardRef((_, ref: any) => {
	
	const nodeRef = useRef(null);

	const show = (rootId: string, type: I.DropType, ids: string[], component: I.DragComponentProps) => {
		let componentNode = null;
		if (component.getNode) {
			componentNode = component.getNode();
		} else {
			componentNode = null;
		};

		if (!componentNode) {
			return;
		};

		const rect = U.Dom.getElementRect(componentNode);
		const node = nodeRef.current;
		const inner = U.Dom.select('#inner', node);
		if (inner) {
			inner.innerHTML = '';
		};
		const containerEl = U.Dom.getPageFlexContainer(keyboard.isPopup());
		const wrap = document.createElement('div');

		let width = rect.width;

		switch (type) {
			case I.DropType.Block: {
				U.Dom.addClass(wrap, 'blocks');

				width -= J.Size.blockMenu;
				const items: M.Block[] = [];
				for (const id of ids) {
					const leaf = S.Block.getLeaf(rootId, id);
					if (leaf) {
						items.push(new M.Block(U.Common.objectCopy(leaf)));
					};
				};

				items.forEach(block => {
					const blockEl = containerEl ? U.Dom.select(`#block-${U.Common.esc(block.id)}`, containerEl) : null;
					const clone = blockEl ? blockEl.cloneNode(true) as HTMLElement : null;

					if (clone) {
						wrap.appendChild(clone);

						if (block.isDataview()) {
							const controls = U.Dom.select('.dataviewControls', clone);

							const content = U.Dom.select('.content', clone);
							if (content) content.remove();
							if (controls) {
								const views = U.Dom.select('#views', controls);
								if (views) views.remove();
								const viewSelector = U.Dom.select('#view-selector', controls);
								if (viewSelector) viewSelector.remove();
								const sideRight = U.Dom.select('#sideRight', controls);
								if (sideRight) sideRight.remove();
							};
						};

						if (block.isEmbed()) {
							const value = U.Dom.select('#value', clone);
							if (value) value.remove();
							const preview = U.Dom.select('.preview', clone);
							if (preview) U.Dom.css(preview, { display: 'block' });
						};
					};
				});
				break;
			};

			case I.DropType.Relation: {
				const relContainerEl = U.Dom.getPageFlexContainer(keyboard.isPopup());
				const add = document.createElement('div');
				add.className = 'sidebarPage pageObjectRelation';

				U.Dom.addClass(wrap, 'sidebar');
				wrap.appendChild(add);

				ids.forEach(id => {
					const sidebar = relContainerEl ? U.Dom.select('.sidebar', relContainerEl) : null;
					const el = sidebar ? U.Dom.select(`#section-object-relation-${id}`, sidebar) : null;
					if (el) {
						const clone = el.cloneNode(true) as HTMLElement;
						add.appendChild(clone);
						U.Dom.css(clone, { width: `${el.offsetWidth}px` });
					};
				});
				break;
			};

			case I.DropType.Record: {
				if (!ids.length) {
					break;
				};

				const first = containerEl ? U.Dom.select(`#record-${U.Common.esc(ids[0])}`, containerEl) : null;
				const viewContentEl = first?.closest('.viewContent');
				const cn = viewContentEl?.getAttribute('class') ?? '';
				const blockDiv = document.createElement('div');
				blockDiv.className = 'block blockDataview';
				const view = document.createElement('div');

				if (cn) {
					view.className = cn;
				};
				blockDiv.appendChild(view);

				U.Dom.addClass(wrap, 'blocks');
				wrap.appendChild(blockDiv);

				ids.forEach((id: string, idx: number) => {
					const el = containerEl ? U.Dom.select(`#record-${U.Common.esc(id)}`, containerEl) : null;
					if (el) {
						const clone = el.cloneNode(true) as HTMLElement;
						U.Dom.addClass(clone, 'record');
						view.appendChild(clone);
						U.Dom.css(clone, { width: `${el.offsetWidth}px` });
					};
				});
				break;
			};
		};

		if (inner) {
			inner.appendChild(wrap);
		};

		if (node) {
			U.Dom.css(node, { width: `${width}px` });
		};
		U.Dom.selectAll('.block', node).forEach(el => el.id = '');
		U.Dom.selectAll('.selectionTarget', node).forEach(el => el.id = '');
	};

	const hide = () => {
		const inner = U.Dom.select('#inner', nodeRef.current);
		if (inner) {
			inner.innerHTML = '';
		};
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

});

export default DragLayer;