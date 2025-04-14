import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject } from 'Component';
import { I, S } from 'Lib';

interface Props {
	format: I.RelationType;
	name: string;
	readonly: boolean;
	onClick?: (e: any) => void;
};

const HeadHandle = observer(class HeadHandle extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onMouseDown = this.onMouseDown.bind(this);
	};

	render () {
		const { format, name, onClick } = this.props;

		const Handle = SortableHandle(() => (
			<div 
				className="flex" 
				onMouseDown={this.onMouseDown} 
				onClick={onClick}
				onContextMenu={onClick}
			>
				<IconObject object={{ relationFormat: format, layout: I.ObjectLayout.Relation }} tooltipParam={{ text: name }} />
				<div className="name">{name}</div>
			</div>
		));

		return <Handle />;
	};

	onMouseDown (e: any) {
		$('.cell.isEditing').removeClass('isEditing');
		S.Menu.closeAll();
	};

});

export default HeadHandle;