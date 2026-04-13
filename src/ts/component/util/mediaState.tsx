import React, { useState } from 'react';
import { Icon } from 'Component';

interface Props {
	isDeleted: boolean;
	isArchived: boolean;
	typeName: string;
	fileName?: string;
	objectId?: string;
	rootId?: string;
};

const MediaState = ({ isDeleted, isArchived, typeName, fileName, objectId, rootId }: Props) => {

	const [ isRestored, setIsRestored ] = useState(false);

	const openMenu = (e: React.MouseEvent) => {
		if (!objectId) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const options = [
			{ id: 'restore', iconParam: { name: 'menu/action/restore' }, name: translate('commonRestore') },
			{ id: 'delete', iconParam: { name: 'menu/action/remove', color: 'destructive' }, name: translate('commonDeleteImmediately'), color: 'destructive' },
		];

		S.Menu.open('select', {
			recalcRect: () => ({ x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 }),
			data: {
				options,
				onSelect: (e, option) => {
					switch (option.id) {
						case 'restore': {
							Action.restore([ objectId ], analytics.route.block, () => setIsRestored(true));
							break;
						};

						case 'delete': {
							Action.delete([ objectId ], analytics.route.block);
							break;
						};
					};
				},
			},
		});
	};

	if (isRestored || (rootId && (rootId == objectId))) {
		return null;
	};

	if (isDeleted) {
		return (
			<div className="mediaState isDeleted">
				<Icon name="common/ghost" />
				<div className="name">{U.String.sprintf(translate('commonObjectRemovedShort'), typeName)}</div>
			</div>
		);
	};

	if (isArchived) {
		return (
			<div className="mediaState isArchived" onClick={openMenu} onContextMenu={openMenu}>
				<Icon name="common/ghost" />
				<div className="name">{U.String.sprintf(translate('commonObjectInBin'), typeName, fileName)}</div>
			</div>
		);
	};

	return null;
};

export default MediaState;
