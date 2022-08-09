import * as React from 'react';
import { Emoji } from 'emoji-mart';
import { commonStore, menuStore } from 'Store';
import { SmileUtil } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	id?: string;
	icon?: string;
	iconClass?: string;
	hash?: string;
	size?: number;
	native?: boolean;
	asImage?: boolean;
	className?: string;
	canEdit?: boolean;
	offsetX?: number;
	offsetY?: number;
	menuId?: string;
	onSelect?(id: string): void;
	onUpload?(hash: string): void;
}

const Constant = require('json/constant.json');
const IconSrc = {
};

const IconEmoji = observer(class IconEmoji extends React.Component<Props, {}> {
	
	public static defaultProps = {
		offsetX: 0,
		offsetY: 0,
		size: 18,
		className: '',
		native: true,
		asImage: true,
	};
	
	render () {
		const { id, size, icon, hash, native, asImage, className, canEdit, menuId, iconClass } = this.props;
		
		let cn = [ 'iconEmoji' ];
		let css = { lineHeight: size + 'px' };

		if (className) {
			cn.push(className);
		};
		if (canEdit) {
			cn.push('canEdit');
		};
		if (menuId && menuStore.isOpen(menuId)) {
			cn.push('active');
		};

		let element = null;
		let skin = 0;

		if (icon) {
			let colons = '';
			if (icon.match(':')) {
				colons = icon;
			} else {
				const data = SmileUtil.data(icon);
				if (data) {
					colons = data.colons;
					skin = data.skin;
				};
			};

			if (colons) {
				if (asImage) {
					element = <img src={SmileUtil.srcFromColons(colons, skin)} className={[ 'smileImage', 'c' + size ].join(' ')} onDragStart={(e: any) => { e.preventDefault(); }} />;
				} else {
					element = <Emoji native={native} emoji={colons} set="apple" size={size} />;
				};
			};
		} else 
		if (hash) {
			element = <img src={commonStore.imageUrl(hash, Constant.size.iconPage)} className={[ 'iconImage', 'c' + size ].join(' ')}  onDragStart={(e: any) => { e.preventDefault(); }} />;
		} else 
		if (iconClass) {
			element = <img src={IconSrc[iconClass]} className={[ 'iconCommon', iconClass, 'c' + size ].join(' ')} />
		};

		if (!element) {
			return null;
		};
		
		return (
			<div id={id} style={css} className={cn.join(' ')}>
				{element}
			</div>
		);
	};

});

export default IconEmoji;