import React, { forwardRef, useRef, useEffect, useLayoutEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { U } from 'Lib';

interface Props {
	children?: React.ReactNode;
	className?: string;
	dataset?: any;
};

interface FrameRefProps {
	resize: () => void,
};

const Frame = forwardRef<FrameRefProps, Props>(({ 
	children, 
	className = '', 
	dataset = {},
}, ref) => {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	const cn = [ 'frame', className ];

	const unbind = () => {
		$(window).off('resize.frame');
	};

	const rebind = () => {
		unbind();
		$(window).on('resize.frame', () => resize());
	};

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

	useEffect(() => {
		rebind();
		resize();

		return () => unbind();
	});

	useLayoutEffect(() => resize());

	useImperativeHandle(ref, () => ({
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