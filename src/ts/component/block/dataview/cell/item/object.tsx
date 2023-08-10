import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';

interface Props {
	object: any;
	iconSize: number;
	relation?: any;
	canEdit?: boolean;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
	onRemove?: (e: any, id: string) => void;
};

const ItemObject = observer(class ItemObject extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const { iconSize, relation, canEdit } = this.props;
		const cn = [ 'element' ];
		const object = this.getObject();

		let iconObject = null;
		let iconRemove = null;
		
		if (object.isHidden) {
			cn.push('isHidden');
		};
		if (canEdit) {
			cn.push('canEdit');
			iconRemove = <Icon className="objectRemove" onClick={this.onRemove} />;
		};
		if (relation.relationKey != 'type') {
			iconObject = <IconObject object={object} size={iconSize} />;
		};

		return (
			<div className={cn.join(' ')} onClick={this.onClick}>
				<div className="flex">
					{iconObject}
					<ObjectName object={object} />
					{iconRemove}
				</div>
			</div>
		);
	};

	onClick (e: any) {
		const { onClick, canEdit } = this.props;
		const object = this.getObject();

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

	getObject () {
		const { relation, elementMapper } = this.props;

		let object = this.props.object || {};
		if (elementMapper) {
			object = elementMapper(relation, object);
		};
		return object;
	};

});

export default ItemObject;