import React, { FC } from 'react';
import { U } from 'Lib';

interface Props {
	object: any;
	className?: string;
};

const ObjectDescription: FC<Props> = ({ 
	object = {}, 
	className = 'descr',
}) => {
	object = object || {};

	let { description } = object;
	if (U.Object.isNoteLayout(object.layout)) {
		description = '';
	};

	if (!description) {
		return null;
	};

	return <div className={className} dangerouslySetInnerHTML={{ __html: U.Common.sanitize(description) }} />;

};

export default ObjectDescription;