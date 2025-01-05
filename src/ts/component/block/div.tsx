import React, { forwardRef, KeyboardEvent } from 'react';
import { I, focus } from 'Lib';
import { observer } from 'mobx-react';

const BlockDiv = observer(forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { block, onKeyDown, onKeyUp } = props;
	const { id, content } = block;
	const { style } = content;
	const cn = [ 'wrap', 'focusable', `c${id}` ];

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

	let inner: any = null;	
	switch (style) {
		case I.DivStyle.Line: {
			inner = <div className="line" />;
			break;
		};

		case I.DivStyle.Dot: {
			inner = (
				<div className="dots">
					{Array(3).fill(null).map((_, i) => <div key={i} className="dot" />)}
				</div>
			);
			break;
		};
	};

	return (
		<div 
			className={cn.join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
		>
			{inner}
		</div>
	);

}));

export default BlockDiv;