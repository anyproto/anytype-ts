import * as React from 'react';
import { Emoji } from 'emoji-mart';
import { commonStore } from 'ts/store';
import { I } from 'ts/lib';

interface Props {
	id?: string;
	icon: string;
	size?: number;
	className?: string;
	canEdit?: boolean;
	offsetX?: number;
	offsetY?: number;
};

interface State {
	icon: string;
};

class Smile extends React.Component<Props, State> {
	
	private static defaultProps = {
		offsetX: 0,
		offsetY: 0,
		size: 18
	};
	
	state = {
		icon: ''
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { id, size, className, canEdit } = this.props;
		
		let icon = this.state.icon || this.props.icon;
		let cn = [ 'smile' ];
		if (className) {
			cn.push(className);
		};
		if (canEdit) {
			cn.push('canEdit');
		};
		
		return (
			<div id={id} className={cn.join(' ')} onClick={this.onClick}>
				{icon ? <Emoji emoji={icon} set="apple" size={size} backgroundImageFn={() => ''} /> : ''}
			</div>
		);
	};
	
	onClick (e: any) {
		const { id, canEdit, offsetX, offsetY } = this.props;
		
		if (!id || !canEdit) {
			return;
		};
		
		commonStore.menuOpen('smile', { 
			element: id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: offsetY,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				onSelect: (item: any) => {
					this.setState({ icon: item.id });
				}
			}
		});
	};
	
};

export default Smile;