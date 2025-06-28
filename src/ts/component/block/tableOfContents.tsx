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

	const onClick = (e: any, item: any) => {
		U.Common.scrollToHeader(item, isPopup);
	};

	const Item = (item: any) => (
		<div 
			className="item" 
			onClick={e => onClick(e, item)}
			style={{ paddingLeft: item.depth * 24 }}
		>
			<Label text={U.Common.getLatex(item.text)} />
		</div>
	);

	const items = S.Block.getTableOfContents(rootId);

	return (
		<div 
			className={cn.join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
		>
			{!items.length ? (
				<div className="empty">{translate('blockTableOfContentsAdd')}</div>
			) : (
				<>
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</>
			)}
		</div>
	);

}));

export default BlockTableOfContents;