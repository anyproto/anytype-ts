import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S } from 'Lib';

interface TableOfContentsRefProps {
	setBlock: (v: string) => void;
};

const TableOfContents = observer(forwardRef<TableOfContentsRefProps, I.BlockComponent>((props, ref) => {

	const { rootId, isPopup } = props;
	const nodeRef = useRef(null);
	const blocks = S.Block.getBlocks(rootId, it => it.isTextHeader());
	const max = blocks.reduce((res, current) => Math.max(res, current.getLength()), 0);

	const setBlock = (id: string) => {
		const node = $(nodeRef.current);

		node.find('.item.active').removeClass('active');
		if (id) {
			node.find(`#item-${id}`).addClass('active');
		};
	};

	const onClick = () => {
		S.Menu.open('tableOfContents', {
			element: $(nodeRef.current),
			vertical: I.MenuDirection.Center,
			noFlipX: true,
			noFlipY: true,
			data: {
				rootId,
				isPopup,
			}
		});
	};

	useImperativeHandle(ref, () => ({
		setBlock,
	}));

	if (!blocks.length || !max) {
		return null;
	};

	return (
		<div ref={nodeRef} className="tableOfContents" onClick={onClick}>
			{blocks.map(block => (
				<div 
					id={`item-${block.id}`}
					className="item" 
					key={block.id} 
					style={{ width: `${block.getLength() / max * 100}%` }}
				/>
			))}
		</div>
	);

}));

export default TableOfContents;