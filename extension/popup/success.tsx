import * as React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'Component';
import { I, C, UtilCommon, UtilObject } from 'Lib';
import { extensionStore, detailStore } from 'Store';
import Url from 'json/url.json';

interface State {
	error: string;
};

const Success = observer(class Success extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const object = detailStore.mapper(extensionStore.createdObject);

		if (!object) {
			return null;
		};

		return (
			<div className="page pageSuccess">
				<div className="label bold">{UtilCommon.sprintf('"%s" is saved!', UtilCommon.shorten(object.name, 64))}</div>
				<div className="label">{object.description}</div>

				<div className="buttonsWrapper">
					<Button color="blank" className="c32" text="Open in app" onClick={this.onOpen} />
				</div>
			</div>
		);
	};

	onOpen () {
		C.BroadcastPayloadEvent({ type: 'openObject', object: extensionStore.createdObject });
		window.close();
	};

});

export default Success;