import * as React from 'react';
import { detailStore } from 'ts/store';
import { I, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { IconObject } from 'ts/component';

interface Props {
	rootId: string;
	id: string;
	iconSize: number;
	relation?: any;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
}

const ItemObject = observer(class ItemObject extends React.Component<Props, {}> {

	render () {
		const { rootId, id, iconSize, relation, elementMapper, onClick } = this.props;
		let object = detailStore.get(rootId, id, []);

		if (object._empty_) {
			return null;
		};

		if (elementMapper) {
			object = elementMapper(relation, object);
		};

		let name = object.name || DataUtil.defaultName('page');
		if (object.layout == I.ObjectLayout.Note) {
			name = object.snippet || <span className="empty">Empty</span>;
		};

		return (
			<div 
				className={[ 'element', (object.isHidden ? 'isHidden' : '') ].join(' ')} 
				onClick={(e: any) => { onClick(e, object); }}
			>
				<div className="flex">
					<IconObject object={object} size={iconSize} />
					<div className="name">{name}</div>
				</div>
			</div>
		);
	};

});

export default ItemObject;