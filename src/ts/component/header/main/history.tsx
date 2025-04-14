import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon, Button } from 'Component';
import { I, S, U, J, keyboard, translate, analytics } from 'Lib';

interface HeaderMainHistoryRefProps {
	setVersion: (version: I.HistoryVersion) => void;
};

const HeaderMainHistory = observer(forwardRef<HeaderMainHistoryRefProps, I.HeaderComponent>((props, ref) => {

	const { rootId, match, isPopup, renderLeftIcons, onRelation, menuOpen } = props;
	const [ version, setVersion ] = useState<I.HistoryVersion | null>(null);
	const [ dummyState, setDummyState ] = useState(0);
	const object = S.Detail.get(rootId, rootId, []);
	const root = S.Block.getLeaf(rootId, rootId);
	const isDeleted = object._empty_ || object.isDeleted;
	const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
	const isDate = U.Object.isDateLayout(object.layout);
	const showShare = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Publish ], true) && !isDeleted;
	const showRelations = !isTypeOrRelation && !isDate && !isDeleted;
	const showMenu = !isTypeOrRelation && !isDeleted;

	const onMore = () => {
		menuOpen('object', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.object,
			data: {
				rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				match,
				isPopup,
			}
		});
	};

	const onShare = () => {
		menuOpen('publish', '#button-header-share', {
			horizontal: I.MenuDirection.Right,
			data: {
				rootId,
			}
		});

		analytics.event('ClickShareObject', { objectType: object.type });
	};

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
				{showShare ? (
					<Button 
						id="button-header-share" 
						text={translate('commonShare')} 
						color="blank" 
						className="c28" 
						onClick={onShare}
					/> 
				) : ''}

				{showRelations ? (
					<Icon 
						id="button-header-relation" 
						tooltipParam={{ text: translate('commonRelations'), caption: keyboard.getCaption('relation'), typeY: I.MenuDirection.Bottom }}
						className="relation withBackground"
						onClick={() => onRelation({ readonly: object.isArchived || root?.isLocked() })} 
					/> 
				) : ''}

				{showMenu ? (
					<Icon 
						id="button-header-more"
						tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
						className="more withBackground"
						onClick={onMore} 
					/> 
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainHistory;
