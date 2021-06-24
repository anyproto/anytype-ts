import * as React from 'react';
import { detailStore } from 'ts/store';
import { Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { IconObject } from 'ts/component';

interface Props {
	rootId: string;
	id: string;
	iconSize: number;
	onClick?: (e: any, item: any) => void;
};

@observer
class ItemObject extends React.Component<Props, {}> {

	render () {
		const { rootId, id, iconSize, onClick } = this.props;
		const object = detailStore.get(rootId, id, []);

		if (object._empty_) {
			return null;
		};

		return (
			<div 
				className={[ 'element', (object.isHidden ? 'isHidden' : '') ].join(' ')} 
				onClick={(e: any) => { onClick(e, object); }}
			>
				<div className="flex">
					<IconObject object={object} size={iconSize} />
					<div className="name">{Util.shorten(object.name, 32)}</div>
				</div>
			</div>
		);
	};

};

export default ItemObject;