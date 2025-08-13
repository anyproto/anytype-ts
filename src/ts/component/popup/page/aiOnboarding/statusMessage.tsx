import React from 'react';
import { observer } from 'mobx-react';

interface StatusMessageProps {
	text: string;
	isActive?: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = observer(({ text, isActive = true }) => {
	return (
		<div className={`statusMessage ${isActive ? 'active' : ''}`}>
			<span className="statusText">{text}</span>
		</div>
	);
});

export default StatusMessage;