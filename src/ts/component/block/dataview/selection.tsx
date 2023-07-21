import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, translate } from 'Lib';

interface Props extends I.ViewComponent {
	multiSelectAction?: (id: string) => void;
};

const Selection = observer(class Selection extends React.Component<Props> {

	ids: string[] = [];

	render () {
		const { className, isInline, isCollection, multiSelectAction } = this.props;
		const cn = [ 'dataviewControls', 'dataviewSelection' ];

		if (className) {
			cn.push(className);
		};

		if (isInline) {
			cn.push('isInline');
		};

		const buttons: any[] = [
			{ id: 'archive', text: translate('blockDataviewSelectionMoveToBin'), className: [ 'black' ] },
			{ id: 'done', text: translate('blockDataviewSelectionDeselect'), className: [ 'black' ] },
		];

		if (isCollection) {
			buttons.unshift({ id: 'unlink', text: translate('blockDataviewSelectionUnlink'), className: [ 'black' ] });
		};

		return (
			<div id="dataviewSelection" className={cn.join(' ')}>
				<div className="sides">
					<div id="sideLeft" className="side left">{this.ids.length} selected</div>

					<div id="sideRight" className="side right">
						{buttons.map((item: any, i: number) => (
							<div
								key={i}
								className={[ 'element' ].concat(item.className || []).join(' ')}
								onClick={() => multiSelectAction(item.id)}
								onMouseEnter={() => keyboard.setSelectionClearDisabled(true)}
								onMouseLeave={() => keyboard.setSelectionClearDisabled(false)}
							>
								<Icon className={item.id} />
								{item.text}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	};

	setIds (ids: string[]): void {
		this.ids = ids || [];
		this.forceUpdate();
	};

});

export default Selection;