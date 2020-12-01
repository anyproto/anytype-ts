import * as React from 'react';
import { I, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';

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

	render () {
		const { block, readOnly, getRecord, index, viewType } = this.props;
		const relation = dbStore.getRelation(block.id, this.props.relation.key);
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		const canEdit = !readOnly && !relation.isReadOnly && (viewType == I.ViewType.Grid);

		let value: any = this.getValue();
		value = value.map((id: string, i: number) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });

		const Item = (item: any) => (
			<div className="item">
			</div>
		);

		return (
			<div className="wrap">
				{canEdit ? (
					<React.Fragment>
						{value.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
						<div className="filter tagItem">
							<div 
								id="filter" 
								contentEditable={!readOnly} 
								suppressContentEditableWarning={true} 
								onKeyDown={this.onKeyDown} 
								onKeyUp={this.onKeyUp}
								onFocus={this.onFocus} 
								onBlur={this.onBlur}
							/>
							<div id="placeHolder">Find an option</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						{value.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</React.Fragment>
				)}
			</div>
		);
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id } = this.props;
		const cell = $('#' + id);

		editing ? cell.addClass('isEditing') : cell.removeClass('isEditing');
	};

	setEditing (v: boolean) {
		const { viewType, readOnly } = this.props;
		const { editing } = this.state;
		const canEdit = !readOnly && (viewType == I.ViewType.Grid);

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	onFocus (e: any) {
	};

	onBlur (e: any) {
	};

	onKeyDown (e: any) {
	};

	onKeyUp (e: any) {
	};
	
	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.key];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};
		return Util.objectCopy(value);
	};

};

export default CellObject;