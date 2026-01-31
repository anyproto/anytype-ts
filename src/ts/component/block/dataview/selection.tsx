import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, U, keyboard, translate } from 'Lib';

interface Props extends I.ViewComponent {
	multiSelectAction?: (id: string) => void;
};

interface Ref {
	setIds: (ids: string[]) => void;
	getNode: () => any;
};

const BlockDataviewSelection = observer(forwardRef<Ref, Props>((props, ref) => {

	const { className, isInline, isCollection, multiSelectAction } = props;
	const [ ids, setIds ] = useState<string[]>([]);
	const nodeRef = useRef(null);
	const cn = [ 'dataviewControls', 'dataviewSelection' ];

	if (className) {
		cn.push(className);
	};

	if (isInline) {
		cn.push('isInline');
	};

	const buttons: any[] = [
		{ id: 'archive', text: translate('commonMoveToBin') },
		{ id: 'done', text: translate('commonDeselectAll') },
	];

	if (isCollection) {
		buttons.unshift({ id: 'unlink', text: translate('commonUnlink') });
	};

	useImperativeHandle(ref, () => ({
		setIds,
		getNode: () => nodeRef.current,
	}));

	return (
		<div ref={nodeRef} id="dataviewSelection" className={cn.join(' ')}>
			<div className="sides">
				<div id="sideLeft" className="side left">{U.String.sprintf(translate('blockDataviewSelectionSelected'), ids.length)}</div>

				<div id="sideRight" className="side right">
					{buttons.map((item: any, i: number) => (
						<div
							key={i}
							className="element"
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

}));

export default BlockDataviewSelection;