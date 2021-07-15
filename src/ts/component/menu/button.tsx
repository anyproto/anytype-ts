import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuButton extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { disabled } = data;
		const items = this.getItems();

		return (
			<div className="items">
				{items.map((item: any, i: number) => (
					<MenuItemVertical 
						key={i}
						{...item} 
						className={disabled ? 'disabled' : ''}
						onClick={(e: any) => { this.onSelect(e, item); }} 
					/>
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { options } = data;
		
		return options || [];
	};
	
	onSelect (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { disabled, onSelect, noClose } = data;

		if (!noClose) {
			close();
		};
		
		if (!disabled && onSelect) {
			onSelect(e, item);
		};
	};

};

export default MenuButton;