import * as React from 'react';
import { Input } from 'ts/component';
import { I, keyboard, translate } from 'ts/lib';

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
				<Input ref={(ref: any) => { this.ref = ref; }} value={value} placeholder={translate('menuBlockLinkPlaceholder')} />
				<div className="buttons">
					<div className="btn" onClick={this.onLink}>{translate('menuBlockLinkLink')}</div>
					<div className="btn" onClick={this.onUnlink}>{translate('menuBlockLinkUnlink')}</div>
				</div>
			</form>
		);
	};
	
	componentDidMount () {
		window.setTimeout(() => { 
			if (this.ref) {
				this.ref.focus(); 
			};
		});
	};

	componentWillUnmount () {
		keyboard.setFocus(false);
	};
	
	onLink (e: any) {
		e.preventDefault();
		
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		onChange(this.ref.getValue());
		this.props.close();
	};
	
	onUnlink (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		onChange('');
		this.props.close();
	};
	
};

export default MenuBlockLink;