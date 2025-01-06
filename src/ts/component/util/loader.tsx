import React, { forwardRef } from 'react';
import { I } from 'Lib';

interface Props {
	id?: string;
	type?: I.LoaderType;
	className?: string;
};

const Loader = forwardRef<HTMLDivElement, Props>(({
	id = '',
	type = I.LoaderType.Dots,
	className = '',
}, ref) => {

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

	return (
		<div id={id} className={[ 'loaderWrapper', className ].join(' ')}>
			{content}
		</div>
	);

});

export default Loader;