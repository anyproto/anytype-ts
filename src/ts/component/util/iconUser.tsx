import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Label } from 'ts/component';
import { dispatcher, I } from 'ts/lib';

interface Props {
	name?: string;
	color?: string;
	icon?: string;
	className?: string;
	image?: I.ImageInterface;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

interface State {
	icon: string;
};

class IconUser extends React.Component<Props, State> {
	
	public static defaultProps = {
        color: 'grey'
    };

	state = {
		icon: '',
	};

	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { className, name, color, onClick, onMouseDown, onMouseEnter, onMouseLeave } = this.props;
		
		let icon = this.state.icon || this.props.icon || '';
		let cn = [ 'icon', 'user' ];
		let style: any = {};
		let text = name || '';
		
		if (className) {
			cn.push(className);
		};
		
		if (icon) {
			text = '';
			style.backgroundImage = 'url("' + icon + '")';
		} else {
			cn.push(color);
		};
		
		return (
			<div onMouseDown={this.onMouseDown} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} onClick={onClick} className={cn.join(' ')}>
				<div className="image" style={style} />
				<div className="txt">{this.shortName(text)}</div>
				<div className="arrow" />
			</div>
		);
	};
	
	componentDidMount () {
		const { image } = this.props;
		
		if (image) {
			let request = {
				id: image.id,
				size: I.ImageSize.LARGE
			};
			
			dispatcher.call('imageGetBlob', request, (errorCode: any, message: any) => {
				if (message.error.code) {
					return;
				};
				
				this.setState({ icon: 'data:image/jpeg;base64,' + message.blob.toString('base64') });
			});
		};
	};
	
	shortName (s: string): string {
		if (!s) {
			return '';
		};
		return s.trim().substr(0, 1);
	};
	
	onMouseEnter (e: any) {
		let { onMouseEnter } = this.props;
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		let { onMouseLeave } = this.props;
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};
	
	onMouseDown (e: any) {
		let { onMouseDown } = this.props;
		
		if (onMouseDown) {
			onMouseDown(e);
		};
	};
	
};

export default IconUser;