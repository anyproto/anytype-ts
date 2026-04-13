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
		if (objectId) {
			U.Menu.archivedContext(e, objectId, () => setIsRestored(true));
		};
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
