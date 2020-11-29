import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

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
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};

		const value = record[relation.key] || [];
		if (!value.length) {
			return null;
		};

		return (
			<React.Fragment>
			</React.Fragment>
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
	
};

export default CellObject;