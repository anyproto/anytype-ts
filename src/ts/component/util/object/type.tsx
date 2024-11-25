import React, { FC } from 'react';
import { U, translate } from 'Lib';

interface Props {
	object: any;
};

const ObjectType: FC<Props> = ({
	object = {},
}) => {

	return !object._empty_ && !object.isDeleted ? (
		<>{U.Common.shorten(object.name, 32)}</>
	): (
		<span className="textColor-red">
			{translate('commonDeletedType')}
		</span>
	);

};

export default ObjectType;