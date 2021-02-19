import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { Icon } from 'ts/component';
import { SortableHandle } from 'react-sortable-hoc';
import { observer } from 'mobx-react';
import { commonStore } from 'ts/store';

interface Props extends I.Relation {};

const $ = require('jquery');

@observer
class HeadHandle extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onMouseDown = this.onMouseDown.bind(this);
	}

	render () {
		const { format, name } = this.props;

		const Handle = SortableHandle(() => (
			<div onMouseDown={this.onMouseDown}>
				<Icon className={'relation ' + DataUtil.relationClass(format)} />
				<div className="name">{name}</div>
			</div>
		));

		return <Handle />;
	};

	onMouseDown (e: any) {
		$('.cell.isEditing').removeClass('isEditing');
		commonStore.menuCloseAll();
	};

};

export default HeadHandle;