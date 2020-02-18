import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Input } from 'ts/component';
import { commonStore } from 'ts/store';
import { I } from 'ts/lib';

interface Props extends I.Menu {};

class MenuBlockLink extends React.Component<Props, {}> {
	
	ref: any = null; 
	
	constructor (props: any) {
		super(props);
		
		this.onLink = this.onLink.bind(this);
		this.onUnlink = this.onUnlink.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		return (
			<form className="flex" onSubmit={this.onLink}>
				<Input ref={(ref: any) => { this.ref = ref; }} value={value} placeHolder="Enter link URL" />
				<div className="buttons">
					<div className="btn" onClick={this.onLink}>Link</div>
					<div className="btn" onClick={this.onUnlink}>Unlink</div>
				</div>
			</form>
		);
	};
	
	componentDidMount () {
		this.ref.focus();
	};
	
	onLink (e: any) {
		e.preventDefault();
		
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		onChange(this.ref.getValue());
		commonStore.menuClose(this.props.id);
	};
	
	onUnlink (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		onChange('');
		commonStore.menuClose(this.props.id);
	};
	
};

export default MenuBlockLink;