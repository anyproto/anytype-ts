import * as React from 'react';
import { I } from 'Lib';
import { IconObject } from 'Component';
import { SortableHandle } from 'react-sortable-hoc';
import { observer } from 'mobx-react';
import { menuStore } from 'Store';

interface Props extends I.Relation {
	onClick?: (e: any) => void;
}

const $ = require('jquery');

const HeadHandle = observer(class HeadHandle extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onMouseDown = this.onMouseDown.bind(this);
	}

	render () {
		const { format, name, onClick } = this.props;

		const Handle = SortableHandle(() => (
			<div className="flex" onMouseDown={this.onMouseDown} onClick={onClick}>
				<IconObject object={{ relationFormat: format, layout: I.ObjectLayout.Relation }} tooltip={name} />
				<div className="name">{name}</div>
			</div>
		));

		return <Handle />;
	};

	onMouseDown (e: any) {
		$('.cell.isEditing').removeClass('isEditing');
		menuStore.closeAll();
	};

});

export default HeadHandle;