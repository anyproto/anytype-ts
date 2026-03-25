import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, translate, Action, analytics } from 'Lib';

const HeaderMainArchive = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { renderLeftIcons, menuOpen, isPopup } = props;
	const isOwner = U.Space.isMyOwner();

	const onMore = () => {
		const options: any[] = [];

		if (isOwner) {
			options.push({ id: 'emptyBin', name: translate('commonEmptyBin'), iconParam: { name: 'menu/action/remove' } });
		};

		if (!options.length) {
			return;
		};

		S.Menu.open('select', {
			element: '#button-header-more',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options,
				onSelect: (_e: any, item: any) => {
					switch (item.id) {
						case 'emptyBin': {
							Action.emptyBin(analytics.route.archive);
							break;
						};
					};
				},
			},
		});
	};

	return (
		<>
			<div className="side left">{renderLeftIcons(true, true)}</div>
			<div className="side center" />
			<div className="side right">
				{isOwner ? (
					<Icon
						id="button-header-more"
						tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
						name="common/more"
						withBackground={true}
						onClick={onMore}
						onDoubleClick={e => e.stopPropagation()}
					/>
				) : ''}
			</div>
		</>
	);

}));

export default HeaderMainArchive;
