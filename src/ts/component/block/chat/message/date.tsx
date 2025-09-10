import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
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
		<div ref={nodeRef} className="sectionDate">
			<Label text={text} />
		</div>
	);

}));

export default SectionDate;