import * as React from 'react';
import { observer } from 'mobx-react';
import { I, keyboard } from 'Lib';

interface Props extends I.ViewComponent {
	multiSelectAction?: (e: any, action: string) => void;
};

const Selection = observer(class Selection extends React.Component<Props> {

	render () {
		const { isInline, isCollection, dataset, multiSelectAction } = this.props;
		const { selection } = dataset;
		const cn = [ 'dataviewControls', 'dataviewSelection' ];
		const ids = selection ? selection.get(I.SelectType.Record) : [];

		if (isInline) {
			cn.push('isInline');
		};

		const buttons = [
			{ id: 'archive', text: 'Move to bin' },
			{ id: 'done', text: 'Done', className: [ 'orange' ] },
		];

		if (isCollection) {
			buttons.unshift({ id: 'unlink', text: 'Unlink' });
		};

		return (
			<div className={cn.join(' ')}>
				<div className="sides">
					<div id="sideLeft" className="side left">{ids.length} selected</div>

					<div id="sideRight" className="side right">
						{buttons.map((item: any, i: number) => (
							<div
								key={i}
								className={[ 'element' ].concat(item.className || []).join(' ')}
								onClick={(e: any) => { multiSelectAction(e, item.id); }}
								onMouseEnter={() => { keyboard.isSelectionClearDisabled = true; }}
								onMouseLeave={() => { keyboard.isSelectionClearDisabled = false; }}
							>
								{item.text}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	};

});

export default Selection;