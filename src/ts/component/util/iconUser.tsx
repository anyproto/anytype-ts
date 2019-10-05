import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Label } from 'ts/component';
import { dispatcher, I, cache } from 'ts/lib';

interface Props {
	name?: string;
	color?: string;
	icon?: string;
	className?: string;
	avatar?: I.ImageInterface;
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
			<div onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick} className={cn.join(' ')}>
				<div className="image" style={style} />
				<div className="txt">{this.shortName(text)}</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.load();
	};
	
	load () {
		const { avatar } = this.props;
		if (!avatar) {
			return;
		};
		
		let key = [ 'image', avatar.id, I.ImageSize.LARGE ].join('.');
		let s = cache.get(key);
			
		if (s) {
			this.setState({ icon: 'data:image/jpeg;base64,' + s });
			return;
		};
			
		let request = {
			id: avatar.id,
			size: I.ImageSize.LARGE
		};
			
		dispatcher.call('imageGetBlob', request, (errorCode: any, message: any) => {
			if (message.error.code) {
				return;
			};

			s = message.blob.toString('base64');
			cache.set(key, s);
			this.setState({ icon: 'data:image/jpeg;base64,' + s });
		});
	};
	
	shortName (s: string): string {
		if (!s) {
			return '';
		};
		return s.trim().substr(0, 1);
	};
	
};

export default IconUser;