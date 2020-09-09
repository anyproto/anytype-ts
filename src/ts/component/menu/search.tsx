import * as React from 'react';
import { Input } from 'ts/component';
import { I, keyboard, Util } from 'ts/lib';

interface Props extends I.Menu {};

class MenuSearch extends React.Component<Props, {}> {
	
	ref: any = null; 
	
	constructor (props: any) {
		super(props);
		
		this.onChange = this.onChange.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		return (
			<form className="flex" onSubmit={this.onChange}>
				<Input ref={(ref: any) => { this.ref = ref; }} value={value} placeHolder="Search..." />
				<div className="buttons">
					<div className="btn" onClick={this.onChange}>Search</div>
				</div>
			</form>
		);
	};
	
	componentDidMount () {
		window.setTimeout(() => { 
			if (this.ref) {
				this.ref.focus(); 
			};
		}, 100);
	};

	componentWillUnmount () {
		keyboard.setFocus(false);
	};
	
	onChange (e: any) {
		e.preventDefault();
		
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		onChange(Util.filterFix(this.ref.getValue()));
	};
	
};

export default MenuSearch;