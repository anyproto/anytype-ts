import * as React from 'react';
import { SortableHandle } from 'react-sortable-hoc';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Icon, IconObject } from 'Component';
import { I } from 'Lib';
import { menuStore } from 'Store';

interface Props {
	format: I.RelationType;
	name: string;
	readonly: boolean;
	onClick?: (e: any) => void;
}

const HeadHandle = observer(class HeadHandle extends React.Component<Props> {

	constructor (props: any) {
		super(props);

		this.onMouseDown = this.onMouseDown.bind(this);
	}

	render () {
		const { format, name, readonly, onClick } = this.props;

		const Handle = SortableHandle(() => (
			<div className="flex" onMouseDown={this.onMouseDown} onClick={onClick}>
				{readonly ? <Icon className="lock" /> : ''}
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