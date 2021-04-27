import * as React from 'react';
import { I, Util, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

import ItemObject from './item/object';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellObject extends React.Component<Props, State> {

	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);
	
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, getRecord, index, relation, iconSize } = this.props;
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		const value = this.getValue();

		return (
			<div className="wrap">
				{value.length ? (
					<React.Fragment>
						{value.map((id: string) => {
							return <ItemObject key={id} rootId={rootId} id={id} iconSize={iconSize} onClick={this.onClick} />;
						})}
					</React.Fragment>
				) : (
					<div className="empty">Select objects</div>
				)}
			</div>
		);
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id } = this.props;
		const cell = $('#' + id);

		if (editing) {
			cell.addClass('isEditing');
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { editing } = this.state;

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	onClick (e: any, item: any) {
		const { canEdit } = this.props;

		if (!canEdit) {
			e.stopPropagation();
			DataUtil.objectOpenPopup(item);
		};
	};

	onSort (value: any[]) {
		const { onChange } = this.props;
		onChange(value.map((it: any) => { return it.id; }));
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.relationKey] || [];
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		return Util.objectCopy(Util.arrayUnique(value));
	};

};

export default CellObject;