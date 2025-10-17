import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, J, keyboard, translate, analytics, sidebar } from 'Lib';

interface HeaderMainHistoryRefProps {
	setVersion: (version: I.HistoryVersion) => void;
};

const HeaderMainHistory = observer(forwardRef<HeaderMainHistoryRefProps, I.HeaderComponent>((props, ref) => {

	const { rootId, isPopup, renderLeftIcons, menuOpen } = props;
	const { dateFormat, timeFormat } = S.Common;
	const [ version, setVersion ] = useState<I.HistoryVersion | null>(null);
	const [ dummyState, setDummyState ] = useState(0);
	const object = S.Detail.get(rootId, rootId, []);
	const root = S.Block.getLeaf(rootId, rootId);
	const isLocked = root ? root.isLocked() : false;
	const isDeleted = object._empty_ || object.isDeleted;
	const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
	const isDate = U.Object.isDateLayout(object.layout);
	const showShare = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Publish ], true) && !isDeleted;
	const showRelations = !isTypeOrRelation && !isDate && !isDeleted;
	const showMenu = !isTypeOrRelation && !isDeleted;
	const readonly = object.isArchived || isLocked;

	let date = [];

	if (version) {
		date = date.concat([
			U.Date.dateWithFormat(dateFormat, version.time),
			U.Date.timeWithFormat(timeFormat, version.time),
		]);
	};

	const onMore = () => {
		menuOpen('object', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.object,
			data: {
				rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				isPopup,
			}
		});
	};

	const onRelation = () => {
		sidebar.rightPanelToggle(true, isPopup, 'object/relation', { rootId, readonly });
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
			<div className="side left">{renderLeftIcons(true, true)}</div>

			<div className="side center">
				<div className="txt">{date.join(' ')}</div>
			</div>

			<div className="side right">
				{showShare ? (
					<Icon 
						id="button-header-share" 
						tooltipParam={{ text: translate('commonShare'), typeY: I.MenuDirection.Bottom }}
						className={[ 'share', 'withBackground' ].join(' ')}
						onClick={onShare} 
						onDoubleClick={e => e.stopPropagation()}
					/> 
				) : ''}

				{showRelations ? (
					<Icon 
						id="button-header-relation" 
						tooltipParam={{ text: translate('commonRelations'), caption: keyboard.getCaption('relation'), typeY: I.MenuDirection.Bottom }}
						className="relation withBackground"
						onClick={onRelation} 
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
