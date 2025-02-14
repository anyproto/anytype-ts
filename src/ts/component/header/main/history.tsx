import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, keyboard, translate } from 'Lib';

interface HeaderMainHistoryRefProps {
	setVersion: (version: I.HistoryVersion) => void;
};

const HeaderMainHistory = observer(forwardRef<HeaderMainHistoryRefProps, I.HeaderComponent>((props, ref) => {
	const { rootId, renderLeftIcons, onRelation } = props;
	const [ version, setVersion ] = useState<I.HistoryVersion | null>(null);
	const [ dummyState, setDummyState ] = useState(0);
	const cmd = keyboard.cmdSymbol();
	const object = S.Detail.get(rootId, rootId, []);
	const showMenu = !U.Object.isTypeOrRelationLayout(object.layout);

	useImperativeHandle(ref, () => ({
		setVersion,
		forceUpdate: () => setDummyState(dummyState + 1),
	}));

	return (
		<>
			<div className="side left">{renderLeftIcons(true)}</div>

			<div className="side center">
				<div className="txt">
					{version ? U.Date.date('M d, Y g:i:s A', version.time) : ''}
				</div>
			</div>

			<div className="side right">
				{showMenu ? (
					<Icon 
						id="button-header-relation" 
						tooltip={translate('commonRelations')}
						tooltipCaption={`${cmd} + Shift + R`} 
						className="relation withBackground"
						onClick={() => onRelation({ readonly: true })} 
					/> 
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainHistory;
