import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Tag } from 'ts/component';
import { I, C, keyboard, Util, DataUtil } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellSelect extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);
	};

	render () {
		const { rootId, block, relation, getRecord, index } = this.props;
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		let value = this.getValue();
		value = value.map((id: string, i: number) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });

		const placeHolder = relation.format == I.RelationType.Status ? 'Select status' : 'Select tags';

		return (
			<div className="wrap">
				{value.length ? (
					<React.Fragment>
						{value.map((item: any, i: number) => {
							return <Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />;
						})}
					</React.Fragment>
				) : (
					<div className="empty">{placeHolder}</div>
				)}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
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

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.relationKey] || [];
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		return Util.objectCopy(value);
	};

};

export default CellSelect;