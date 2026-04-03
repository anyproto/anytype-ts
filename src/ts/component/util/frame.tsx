import React, { forwardRef, useRef, useEffect, useLayoutEffect, useImperativeHandle, ReactNode } from 'react';
import raf from 'raf';

interface Props {
	children?: ReactNode;
	className?: string;
	dataset?: any;
};

interface FrameRefProps {
	resize: () => void,
	getNode: () => HTMLDivElement | null,
};

const Frame = forwardRef<FrameRefProps, Props>(({ 
	children, 
	className = '', 
	dataset = {},
}, ref) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const cn = [ 'frame', className ];

	const resizeHandler = useRef(() => resize());

	const unbind = () => {
		U.Dom.removeEvent(window, 'resize', resizeHandler.current);
	};

	const rebind = () => {
		unbind();
		U.Dom.addEvent(window, 'resize', resizeHandler.current);
	};

	const resize = () => {
		raf(() => {
			const node = nodeRef.current;
			if (!node) {
				return;
			};

			U.Dom.css(node, {
				marginTop: `${-node.offsetHeight / 2}px`,
				marginLeft: `${-node.offsetWidth / 2}px`,
			});
		});
	};

	useEffect(() => {
		rebind();
		resize();

		return () => unbind();
	});

	useLayoutEffect(() => resize());

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
		resize,
	}));

	return (
		<div
			ref={nodeRef}
			className={cn.join(' ')}
			{...U.Common.dataProps(dataset)}
		>
			{children}
		</div>
	);

});

export default Frame;