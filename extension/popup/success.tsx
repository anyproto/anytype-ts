import * as React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'Component';
import { I, C, S, U } from 'Lib';

interface State {
	error: string;
};

const Success = observer(class Success extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const object = S.Detail.mapper(S.Extension.createdObject);

		if (!object) {
			return null;
		};

		return (
			<div className="page pageSuccess">
				<div className="label bold">{U.Common.sprintf('"%s" is saved!', U.Common.shorten(object.name, 64))}</div>
				<div className="label">{object.description}</div>

				<div className="buttonsWrapper">
					<Button color="blank" className="c32" text="Open in app" onClick={this.onOpen} />
				</div>
			</div>
		);
	};

	onOpen () {
		C.BroadcastPayloadEvent({ type: 'openObject', object: S.Extension.createdObject }, () => {
			window.close();
		});
	};

});

export default Success;