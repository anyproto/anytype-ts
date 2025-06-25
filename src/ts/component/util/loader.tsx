import React, { forwardRef, useEffect, useRef } from 'react';
import raf from 'raf';
import { I, U } from 'Lib';

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
	const resizeObserver = new ResizeObserver(() => {
		raf(() => resize());
	});

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

		const container = U.Common.getScrollContainer(isPopup);
		$(nodeRef.current).css({ height: container.height() });
	};

	useEffect(() => {
		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		resize();

		return () => {
			if (nodeRef.current) {
				resizeObserver.disconnect();
			};
		};
	}, []);

	return (
		<div ref={nodeRef} id={id} className={[ 'loaderWrapper', className ].join(' ')}>
			{content}
		</div>
	);

});

export default Loader;