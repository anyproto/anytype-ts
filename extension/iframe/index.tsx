import * as React from 'react';
import { observer } from 'mobx-react';
import { Button } from 'Component';
import { I } from 'Lib';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);

		this.onClose = this.onClose.bind(this);
	};

	render () {
		return (
			<div className="page pageIndex">
				<div className="head">
					<div className="side left">
					</div>
					<div className="side right">
						<Button text="Save" color="orange" className="c32" />
						<Button text="Clear" color="simple" className="c32" />
						<Button text="Cancel" color="simple" className="c32" onClick={this.onClose} />
					</div>
				</div>
				<div className="blocks">

				</div>
			</div>
		);
	};

	onClose () {
		parent.postMessage({ type: 'clickClose' }, '*');
	};

});

export default Index;