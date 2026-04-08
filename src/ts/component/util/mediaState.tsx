import React from 'react';
import { Icon } from 'Component';

interface Props {
	isDeleted: boolean;
	isArchived: boolean;
	typeName: string;
	fileName?: string;
};

const MediaState = ({ isDeleted, isArchived, typeName, fileName }: Props) => {
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
			<div className="mediaState isArchived">
				<Icon name="common/ghost" />
				<div className="name">{U.String.sprintf(translate('commonObjectInBin'), typeName, fileName)}</div>
			</div>
		);
	};

	return null;
};

export default MediaState;
