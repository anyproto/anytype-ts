import * as React from 'react';
import { I } from 'ts/lib';

interface Props {
	id: string;
	type: string;
	onDrop(e: any, type: string, id: string): void;
};

interface State {
	over: boolean;
};

class DropTarget extends React.Component<Props, State> {
	
	state = {
		over: false
	};
	
	constructor (props: any) {
		super(props);
		
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
	};
	
	render () {
		const { children } = this.props;
		const { over } = this.state;
		
		let cn = [ 'dropTarget', (over ? 'over' : '') ];
		
		return (
			<div className={cn.join(' ')} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave} onDrop={this.onDrop}>
				{children}
			</div>
		);
	};
	
	onDragOver (e: any) {
		e.preventDefault();
		this.setState({ over: true });
	};
	
	onDragLeave (e: any) {
		e.preventDefault();
		this.setState({ over: false });
	};
	
	onDrop (e: any) {
		this.setState({ over: false });
		this.props.onDrop(e, this.props.type, this.props.id);
	};
	
};

export default DropTarget;