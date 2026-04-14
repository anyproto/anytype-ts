import React, { useState } from 'react';
import { Icon } from 'Component';

interface Props {
	object: any;
	rootId: string;
	typeName: string;
};

const MediaState = ({ object, rootId, typeName }: Props) => {

	const { id, isDeleted, isArchived } = object;
	const fileName = U.File.name(object);
	const [ isRestored, setIsRestored ] = useState(false);

	const openMenu = (e: React.MouseEvent) => {
		if (id) {
			U.Menu.archivedContext(e, id, () => setIsRestored(true));
		};
	};

	if (isRestored || (rootId == id)) {
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
