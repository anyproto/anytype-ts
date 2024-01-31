import * as React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'Component';
import { I, UtilCommon, UtilObject } from 'Lib';
import { extensionStore } from 'Store';
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
		const object = extensionStore.createdObject;

		if (!object) {
			return null;
		};

		const name = object.name || UtilObject.defaultName('Page');

		return (
			<div className="page pageSuccess">
				<div className="label bold">{UtilCommon.sprintf('"%s" is saved!', UtilCommon.shorten(name, 64))}</div>
				<div className="label">{object.description}</div>

				<div className="buttons">
					<Button color="blank" className="c32" text="Open in app" onClick={this.onOpen} />
				</div>
			</div>
		);
	};

	onOpen () {
		window.open(Url.protocol + UtilObject.route(extensionStore.createdObject));
	};

});

export default Success;