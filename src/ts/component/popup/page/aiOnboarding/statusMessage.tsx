import React, { FC } from 'react';
import { observer } from 'mobx-react';

interface Props {
	text: string;
	isActive?: boolean;
};

const StatusMessage: FC<Props> = observer(({ text = '', isActive = true }) => {

	const cn = [ 'statusMessage' ];

	if (isActive) {
		cn.push('active');
	};

	return (
		<div className={cn.join(' ')}>
			<span className="statusText">{text}</span>
		</div>
	);

});

export default StatusMessage;