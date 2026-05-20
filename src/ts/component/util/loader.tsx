import React, { forwardRef, useEffect, useRef } from 'react';
import raf from 'raf';
import * as I from 'Interface';

interface Props {
	id?: string;
	type?: I.LoaderType;
	className?: string;
	fitToContainer?: boolean;
	isPopup?: boolean;
};

const Loader = forwardRef<HTMLDivElement, Props>(({
	id = '',
	type = I.LoaderType.Dots,
	className = '',
	fitToContainer = false,
	isPopup = false,
}, ref) => {

	const nodeRef = useRef(null);

	let content = null;
	switch (type) {
		default:
		case I.LoaderType.Dots: {
			content = (
				<div className="dots">
					<div className="dot" />
					<div className="dot" />
					<div className="dot" />
				</div>
			);
			break;
		};

		case I.LoaderType.Loader: {
			content = <div className="loader" />;
			break;
		};
	};

	const resize = () => {
		if (!fitToContainer) {
			return;
		};

		const container = U.Dom.getScrollContainer(isPopup);
		if (nodeRef.current && container) {
			U.Dom.css(nodeRef.current, { height: `${container.clientHeight}px` });
		};
	};

	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		resize();

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<div ref={nodeRef} id={id} className={[ 'loaderWrapper', className ].join(' ')}>
			{content}
		</div>
	);

});

export default Loader;
