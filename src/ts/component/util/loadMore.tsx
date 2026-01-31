import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from 'Component';
import { translate, U } from 'Lib';

interface Props {
	limit: number;
	loaded?: number;
	total?: number;
	onClick?(e: any): void;
};

const LoadMore = forwardRef<HTMLDivElement, Props>(({
	limit = 10,
	loaded = 0,
	total = 0,
	onClick,
}, ref) => {
		
	let number = limit;
	if (loaded && total) {
		const left = total - loaded;
		number = limit < left ? limit : left;
	};

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				className="loadMore"
				onClick={onClick}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				<Icon />
				<div className="name">{U.String.sprintf(translate('utilLoadMoreText'), number, U.Common.plural(number, translate('pluralObject')))}</div>
			</motion.div>
		</AnimatePresence>
	);

});

export default LoadMore;