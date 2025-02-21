import React, { forwardRef, KeyboardEvent } from 'react';
import { Label } from 'Component';
import { I, S, U, J, focus, translate } from 'Lib';
import { observer } from 'mobx-react';

const BlockTableOfContents = observer(forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId, block, isPopup, onKeyDown, onKeyUp } = props;
	const cn = [ 'wrap', 'focusable', `c${block.id}` ];

	const onKeyDownHandler = (e: KeyboardEvent) => {
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		};
	};
	
	const onKeyUpHandler = (e: KeyboardEvent) => {
		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, props);
		};
	};

	const onFocus = () => {
		focus.set(block.id, { from: 0, to: 0 });
	};

	const getTree = () => {
		const blocks = S.Block.unwrapTree([ S.Block.wrapTree(rootId, rootId) ]).filter(it => it.isTextHeader());
		const list: any[] = [];

		let hasH1 = false;
		let hasH2 = false;

		blocks.forEach((block: I.Block) => {
			let depth = 0;

			if (block.isTextHeader1()) {
				depth = 0;
				hasH1 = true;
				hasH2 = false;
			};

			if (block.isTextHeader2()) {
				hasH2 = true;
				if (hasH1) depth++;
			};

			if (block.isTextHeader3()) {
				if (hasH1) depth++;
				if (hasH2) depth++;
			};

			list.push({ 
				depth, 
				id: block.id,
				text: String(block.content.text || translate('defaultNamePage')),
			});
		});

		return list;
	};

	const onClick = (e: any, id: string) => {
		const node = $(`.focusable.c${id}`);

		if (!node.length) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		const no = node.offset().top;
		const st = container.scrollTop();
		const hh = J.Size.header;
		const y = Math.max(hh + 20, (isPopup ? (no - container.offset().top + st) : no) - hh - 20);

		container.scrollTop(y);
	};

	const Item = (item: any) => (
		<div 
			className="item" 
			onClick={e => onClick(e, item.id)}
			style={{ paddingLeft: item.depth * 24 }}
		>
			<Label text={U.Common.getLatex(item.text)} />
		</div>
	);

	const tree = getTree();

	return (
		<div 
			className={cn.join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
		>
			{!tree.length ? (
				<div className="empty">{translate('blockTableOfContentsAdd')}</div>
			) : (
				<>
					{tree.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</>
			)}
		</div>
	);

}));

export default BlockTableOfContents;