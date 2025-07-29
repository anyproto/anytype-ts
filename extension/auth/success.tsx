import { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const Success = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	return (
		<div className="page pageSuccess">
			<div className="title">Successfully authorized!</div>
		</div>
	);

}));

export default Success;