import React, { forwardRef, useRef, useEffect, useLayoutEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { U, H } from 'Lib';

interface Props {
	children?: React.ReactNode;
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

	const resize = () => {
		raf(() => {
			if (!nodeRef.current) {
				return;
			};

			const node = $(nodeRef.current);
			node.css({
				marginTop: -node.outerHeight() / 2,
				marginLeft: -node.outerWidth() / 2
			});
		});
	};

	const onResize = H.useDebounceCallback(resize, 50);

	H.useResizeObserver({ ref: nodeRef, onResize });

	useEffect(() => {
		resize();
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