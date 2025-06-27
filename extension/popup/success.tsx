import { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Button } from 'Component';
import { I, C, S, U } from 'Lib';

const Success = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const object = S.Detail.mapper(S.Extension.createdObject);

	const onOpen = () => {
		C.BroadcastPayloadEvent({ type: 'openObject', object: S.Extension.createdObject }, () => window.close());
	};

	if (!object) {
		return null;
	};

	return (
		<div className="page pageSuccess">
			<div className="label bold">{U.Common.sprintf('"%s" is saved!', U.Common.shorten(object.name, 64))}</div>
			<div className="label">{object.description}</div>

			<div className="buttonsWrapper">
				<Button color="blank" className="c32" text="Open in app" onClick={onOpen} />
			</div>
		</div>
	);

}));

export default Success;