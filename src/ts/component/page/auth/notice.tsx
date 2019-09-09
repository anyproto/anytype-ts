import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Label, Button } from 'ts/component';

const $ = require('jquery');

interface Props { 
	history: any;
};

class PageAuthNotice extends React.Component<Props, {}> {
	
	constructor (props: any) {
        super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};
    
	render () {
        return (
			<div className="frame">
				<Label className="bold" text="Important notice" />
				<Label text="Understanding how people use Anytype helps us improve the product. This version of Anytype includes the analytics code that protects your privacy. It doesn't record the actual document's content but still allows us to understand how you use Anytype. Stay subscribed to our mailing list, as we will soon announce a new release that enables you to opt-out." />
						
				<Button text="Start" className="orange" onClick={this.onSubmit} />
			</div>
		);
    };

	onSubmit (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/select');
	};

	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		node.css({ marginTop: -node.outerHeight() / 2 });
	};

};

export default PageAuthNotice;