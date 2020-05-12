import * as React from 'react';
import { getEmojiDataFromNative, Emoji } from 'emoji-mart';
import { Icon } from 'ts/component';
import { commonStore } from 'ts/store';
import { I } from 'ts/lib';

interface Props {
	id?: string;
	icon: string;
	hash?: string;
	size?: number;
	className?: string;
	canEdit?: boolean;
	offsetX?: number;
	offsetY?: number;
	onSelect?(id: string): void;
	onUpload?(hash: string): void;
};

interface State {
	icon: string;
	hash: string;
};

const EmojiData = require('emoji-mart/data/apple.json');
const Constant = require('json/constant.json');
const blank = require('img/blank/smile.svg');

class Smile extends React.Component<Props, State> {
	
	private static defaultProps = {
		offsetX: 0,
		offsetY: 0,
		size: 16,
		className: 'c20',
	};
	
	state = {
		icon: '',
		hash: '',
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { id, size, className, canEdit } = this.props;
		const icon = String(this.state.icon || this.props.icon || '');
		const hash = String(this.state.hash || this.props.hash || '');
		
		let cn = [ 'smile' ];
		if (className) {
			cn.push(className);
		};
		if (canEdit) {
			cn.push('canEdit');
		};
		
		let element = <img src={blank} className="icon blank" />;
		if (icon) {
			let colons = '';
			if (icon.match(':')) {
				colons = icon;
			} else {
				const data = getEmojiDataFromNative(icon, 'apple', EmojiData);
				if (data) {
					colons = data.colons;
				};
			};

			if (colons) {
				element = <Emoji native={true} emoji={colons} set="apple" size={size} />;
			};
		} else 
		if (hash) {
			cn.push('withImage');
			element = <img src={commonStore.imageUrl(hash, Constant.size.iconPage)} className="icon image" />;
		};
		
		return (
			<div id={id} className={cn.join(' ')} onClick={this.onClick}>
				{element}
			</div>
		);
	};
	
	onClick (e: any) {
		const { id, canEdit, offsetX, offsetY, onSelect, onUpload } = this.props;
		
		if (!id || !canEdit) {
			return;
		};
		
		commonStore.menuOpen('smile', { 
			element: '#' + id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: offsetY,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				onSelect: (icon: string) => {
					this.setState({ icon: icon, hash: '' });
					onSelect(icon);
				},

				onUpload: (hash: string) => {
					this.setState({ icon: '', hash: hash });
					onUpload(hash);
				}
			}
		});
	};
	
};

export default Smile;