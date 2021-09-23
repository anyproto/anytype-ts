import * as React from 'react';
import { I, Util, DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';

import ItemObject from './item/object';
import { data } from 'jquery';

interface Props extends I.Cell {}
interface State { 
	isEditing: boolean; 
}

const $ = require('jquery');

const CellObject = observer(class CellObject extends React.Component<Props, State> {

	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);
	
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, getRecord, index, relation, iconSize, placeholder, elementMapper, arrayLimit } = this.props;
		const record = getRecord(index);
		const cn = [ 'wrap' ];

		if (!relation || !record) {
			return null;
		};

		let value = DataUtil.getRelationArrayValue(record[relation.relationKey]);
		let length = value.length;

		if (length >= 3) {
			cn.push('column3'); 
		};

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
		};

		return (
			<div className={cn.join(' ')}>
				{value.length ? (
					<React.Fragment>
						{value.map((id: string) => (
							<ItemObject key={id} rootId={rootId} id={id} iconSize={iconSize} onClick={this.onClick} relation={relation} elementMapper={elementMapper} />
						))}
						{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
					</React.Fragment>
				) : (
					<div className="empty">{placeholder || translate(`placeholderCell${relation.format}`)}</div>
				)}
			</div>
		);
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id } = this.props;
		const cell = $('#' + id);

		if (isEditing) {
			cell.addClass('isEditing');
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { isEditing } = this.state;

		if (canEdit && (v != isEditing)) {
			this.setState({ isEditing: v });
		};
	};

	onClick (e: any, item: any) {
		const { canEdit, canOpen } = this.props;

		if (canOpen && !canEdit) {
			e.stopPropagation();
			DataUtil.objectOpenPopup(item);
		};
	};

	onSort (value: any[]) {
		const { onChange } = this.props;
		onChange(value.map((it: any) => { return it.id; }));
	};

});

export default CellObject;