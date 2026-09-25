import React, { FC } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

interface Props {
	objectCount?: number;
};

const ExportFilesHelp: FC<Props> = ({ objectCount = 0 }) => {
	let textKey = 'popupExportIncludeFilesDataSpaceTooltip';
	if (objectCount == 1) {
		textKey = 'popupExportIncludeFilesDataObjectTooltip';
	} else if (objectCount > 1) {
		textKey = 'popupExportIncludeFilesDataObjectsTooltip';
	};

	const tooltipParam: Partial<I.TooltipParam> = {
		text: translate(textKey),
		className: 'big exportFiles',
		typeY: I.MenuDirection.Bottom,
		delay: 0,
	};

	return (
		<Icon
			name="common/question"
			size={16}
			tooltipParam={tooltipParam}
			onClick={e => {
				e.stopPropagation();
				Preview.tooltipShow({ ...tooltipParam, element: e.currentTarget as HTMLElement });
			}}
		/>
	);
};

export default ExportFilesHelp;
