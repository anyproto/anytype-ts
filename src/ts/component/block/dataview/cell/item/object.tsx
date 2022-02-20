import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'ts/component';

interface Props {
	object: any;
	iconSize: number;
	relation?: any;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
};

const ItemObject = observer(class ItemObject extends React.Component<Props, {}> {

	render () {
		let { object, iconSize, relation, elementMapper, onClick } = this.props;
		if (elementMapper) {
			object = elementMapper(relation, object);
		};

		return (
			<div 
				className={[ 'element', (object.isHidden ? 'isHidden' : '') ].join(' ')} 
				onClick={(e: any) => { onClick(e, object); }}
			>
				<div className="flex">
					<IconObject object={object} size={iconSize} />
					<ObjectName object={object} />
				</div>
			</div>
		);
	};

});

export default ItemObject;