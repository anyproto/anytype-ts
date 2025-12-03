import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { motion, AnimatePresence } from 'motion/react';
import { Label } from 'Component';
import { U, S, J } from 'Lib';

interface Props {
	date: number;
};

const SectionDate = observer(forwardRef<{}, Props>((props, ref) => {

	const { date } = props;
	const nodeRef = useRef(null);
	const { showRelativeDates, dateFormat } = S.Common;
	const day = showRelativeDates ? U.Date.dayString(date) : null;
	const text = day ? day : U.Date.dateWithFormat(dateFormat, date);

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef} 
				className="sectionDate"
				{...U.Common.animationProps({
					initial: { y: 20 }, 
					animate: { y: 0 }, 
					exit: { y: -20 },
					transition: { duration: 0.3, delay: 0.1 },
				})}
			>
				<Label text={text} />
			</motion.div>
		</AnimatePresence>
	);

}));

export default SectionDate;