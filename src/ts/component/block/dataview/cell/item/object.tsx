import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'ts/component';

interface Props {
	object: any;
	iconSize: number;
	relation?: any;
	canEdit?: boolean;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
	onRemove?: (e: any, id: string) => void;
};

const ItemObject = observer(class ItemObject extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		let { object, iconSize, relation, elementMapper, canEdit } = this.props;
		let cn = [ 'element' ];
		let icon = null;
		
		if (elementMapper) {
			object = elementMapper(relation, object);
		};
		if (object.isHidden) {
			cn.push('isHidden');
		};
		if (canEdit) {
			cn.push('canEdit');
			icon = <Icon className="objectRemove" onMouseDown={this.onRemove} />;
		};

		return (
			<div className={cn.join(' ')} onClick={this.onClick}>
				<div className="flex">
					<IconObject object={object} size={iconSize} />
					<ObjectName object={object} />
					{icon}
				</div>
			</div>
		);
	};

	onClick (e: any) {
		let { object, relation, elementMapper, onClick, canEdit } = this.props;

		if (elementMapper) {
			object = elementMapper(relation, object);
		};

		if (!canEdit && onClick) {
			onClick(e, object);
		};
	};

	onRemove (e: any) {
		e.stopPropagation();

		const { object, canEdit, onRemove } = this.props;

		if (canEdit && onRemove) {
			onRemove(e, object.id);
		};
	};

});

export default ItemObject;