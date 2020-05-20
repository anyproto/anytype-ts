import * as React from 'react';
import { Emoji } from 'emoji-mart';
import { commonStore } from 'ts/store';
import { I, Util } from 'ts/lib';

interface Props {
	id?: string;
	icon: string;
	hash?: string;
	size?: number;
	native?: boolean;
	asImage?: boolean;
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

const Constant = require('json/constant.json');
const blank20 = require('img/blank/smile/20.svg');
const blank24 = require('img/blank/smile/24.svg');

class Smile extends React.Component<Props, State> {
	
	private static defaultProps = {
		offsetX: 0,
		offsetY: 0,
		size: 16,
		className: 'c20',
		native: true,
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
		const { id, size, native, asImage, className, canEdit } = this.props;
		const icon = String(this.state.icon || this.props.icon || '');
		const hash = String(this.state.hash || this.props.hash || '');
		
		let cn = [ 'smile' ];
		if (className) {
			cn.push(className);
		};
		if (canEdit) {
			cn.push('canEdit');
		};

		let blank = blank20;
		if (className.match(/c48/)) {
			blank = blank24;
		};
		
		let element = <img src={blank} className="icon blank" />;
		let skin = 0;

		if (icon) {
			let colons = '';
			if (icon.match(':')) {
				colons = icon;
			} else {
				const data = Util.smileData(icon);
				if (data) {
					colons = data.colons;
					skin = data.skin;
				};
			};

			if (colons) {
				if (asImage) {
					element = <img src={Util.smileSrcFromColons(colons, skin)} className="smileImage" />;
				} else {
					element = <Emoji native={native} emoji={colons} set="apple" size={size} />;
				};
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