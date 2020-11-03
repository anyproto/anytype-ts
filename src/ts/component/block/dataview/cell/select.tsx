import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Tag } from 'ts/component';
import { I, keyboard, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellSelect extends React.Component<Props, State> {

	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);
	
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
	};

	render () {
		const { index, relation, readOnly } = this.props;
		const data = this.props.data[index];
		
		return (
			<div contentEditable={!readOnly} suppressContentEditableWarning={true} onKeyDown={this.onKeyDown} onFocus={this.onFocus} onBlur={this.onBlur}>
			</div>
		);
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id, relation } = this.props;
		const cellId = DataUtil.cellId('cell', relation.key, id);
		const cell = $('#' + cellId);

		if (editing) {
			cell.addClass('isEditing');
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { viewType, readOnly } = this.props;
		const { editing } = this.state;
		const canEdit = !readOnly && (viewType == I.ViewType.Grid);

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
	};

	onKeyDown (e: any) {
		const { index, relation, onChange } = this.props;
		const data = this.props.data[index];
		const node = $(ReactDOM.findDOMNode(this));
		const dict = relation.selectDict;

		console.log(relation, dict);

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
		});
	};
	
};

export default CellSelect;