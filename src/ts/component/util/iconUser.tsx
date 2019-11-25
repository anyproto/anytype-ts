import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Label } from 'ts/component';
import { dispatcher, I, cache } from 'ts/lib';

interface Props {
	name?: string;
	color?: string;
	icon?: string;
	className?: string;
	avatar?: I.Avatar;
	onClick?(e: any): void;
	onMouseDown?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

interface State {
	icon: string;
};

class IconUser extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	
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
		this._isMounted = true;
		this.load();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	load () {
		const { avatar } = this.props;
		if (!avatar) {
			return;
		};
		
		const { image } = avatar;
		if (!image || !image.id) {
			return;
		};
		
		let set = (s: string) => {
			this.setState({ icon: 'data:image/jpeg;base64,' + s });
		};
		
		let key = [ 'image', image.id, I.ImageSize.Large ].join('.');
		let s = cache.get(key);
			
		if (s) {
			set(s);
			return;
		};
			
		let request = {
			id: image.id,
			size: I.ImageSize.Large
		};
			
		dispatcher.call('imageGetBlob', request, (errorCode: any, message: any) => {
			if (!this._isMounted || message.error.code) {
				return;
			};

			s = message.blob.toString('base64');
			cache.set(key, s);
			set(s);
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