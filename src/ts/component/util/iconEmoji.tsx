import * as React from 'react';
import { commonStore, menuStore } from 'Store';
import { UtilSmile } from 'Lib';
import { observer } from 'mobx-react';
const Constant = require('json/constant.json');

interface Props {
	id?: string;
	icon?: string;
	iconClass?: string;
	objectId?: string;
	size?: number;
	asImage?: boolean;
	className?: string;
	canEdit?: boolean;
	offsetX?: number;
	offsetY?: number;
	menuId?: string;
	onSelect?(id: string): void;
	onUpload?(objectId: string): void;
}

const IconSrc = {
};

const IconEmoji = observer(class IconEmoji extends React.Component<Props> {
	
	public static defaultProps = {
		offsetX: 0,
		offsetY: 0,
		size: 18,
		className: '',
		asImage: true,
	};
	
	render () {
		const { id, size, icon, objectId, asImage, className, canEdit, menuId, iconClass } = this.props;
		const cn = [ 'iconEmoji' ];
		const css = { lineHeight: size + 'px' };

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
		if (icon) {
			const code = icon.match(':') ? icon : UtilSmile.getCode(icon);
			if (code) {
				if (asImage) {
					element = <img src={UtilSmile.srcFromColons(code)} className={[ 'smileImage', 'c' + size ].join(' ')} onDragStart={e=> e.preventDefault()} />;
				} else {
					element = <em-emoji shortcodes={code}></em-emoji>;
				};
			};
		} else 
		if (objectId) {
			element = <img src={commonStore.imageUrl(objectId, Constant.size.iconPage)} className={[ 'iconImage', 'c' + size ].join(' ')} onDragStart={e => e.preventDefault()} />;
		} else 
		if (iconClass) {
			element = <img src={IconSrc[iconClass]} className={[ 'iconCommon', iconClass, 'c' + size ].join(' ')} />;
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