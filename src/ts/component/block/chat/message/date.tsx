import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { motion, AnimatePresence } from 'framer-motion';
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

	useEffect(() => {
		const node = $(nodeRef.current);

		node.addClass('anim');
		window.setTimeout(() => node.addClass('show'), J.Constant.delay.chatMessage);
	}, []);

	useEffect(() => {
		$(nodeRef.current).addClass('show');
	}, [ date ]);

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef} className="sectionDate"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: -20, opacity: 0 }}
				transition={{ type: 'spring', stiffness: 300, damping: 20 }}
			>
				<Label text={text} />
			</motion.div>
		</AnimatePresence>
	);

}));

export default SectionDate;