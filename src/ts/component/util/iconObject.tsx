import * as React from 'react';
import { Icon, Smile } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	id?: string;
	layout?: I.ObjectLayout;
	object?: any;
	className?: string;
	iconClass?: string;
	canEdit?: boolean;
	native?: boolean;
	asImage?: boolean;
	size?: number;
	offsetX?: number;
	offsetY?: number;
	menuId?: string;
	onSelect?(id: string): void;
	onUpload?(hash: string): void;
};

@observer
class IconObject extends React.Component<Props, {}> {

	public static defaultProps = {
		size: 20,
	};
	
	render () {
		const { object, className, size } = this.props;
		const { id, iconEmoji, iconImage } = object || {};
		const type = DataUtil.schemaField(object.type);
		const cn = [ 'icon-object', type ];

		if (className) {
			cn.push(className);
		};

		let icon = null;
		switch (type) {
			default:
				icon = <Smile {...this.props} icon={iconEmoji} hash={iconImage} />;
				break;

			case 'image':
				if (id) {
					icon = <img className="img" src={commonStore.imageUrl(id, size * 2)} />;
				} else {
					icon = <Icon className={[ 'file-type', Util.fileIcon(object) ].join(' ')} />;
					cn.push('no-br');
				};
				break;

			case 'file':
				icon = <Icon className={[ 'file-type', Util.fileIcon(object) ].join(' ')} />;
				cn.push('no-br');
				break;
		};

		return (
			<div className={cn.join(' ')}>
				{icon}
			</div>
		);
	};
	
};

export default IconObject;