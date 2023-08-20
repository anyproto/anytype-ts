import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Frame } from 'Component';
import { I } from 'Lib';
import Url from 'json/url.json';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);

		this.onLogin = this.onLogin.bind(this);
		this.onDownload = this.onDownload.bind(this);
	};

	render () {
		return (
			<div className="page pageIndex">
				<Frame>
					<Label text="To save in Anytype you need to Pair with app" />

					<div className="buttons">
						<Button color="orange" className="c28" text="Pair with app" onClick={this.onLogin} />
						<Button color="blank" className="c28" text="Download app" onClick={this.onDownload} />
					</div>
				</Frame>
			</div>
		);
	};

	onLogin () {
	};

	onDownload () {
		window.open(Url.download);
	};


});

export default Index;