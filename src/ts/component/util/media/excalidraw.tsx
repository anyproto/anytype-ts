import React, { forwardRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { observer } from 'mobx-react';
import { S, keyboard } from 'Lib';

interface Props {
	data?: any;
	readonly?: boolean;
	onChange?: (elements: any[], appState: any, files: any) => void;
}

const MediaExcalidraw = observer(forwardRef<{}, Props>(({
	data = {},
	readonly = false,
	onChange = () => {},
}, ref) => {

	const theme = S.Common.getThemeClass();

	data.elements = data.elements || [];
	data.appState = data.appState || {};
	data.appState.collaborators = new Map();

	return (
		<div className="mediaExcalidraw">
			<Excalidraw
				isCollaborating={false}
				initialData={data}
				viewModeEnabled={readonly}
				onChange={(elements, appState, files) => {
					if ([ 'selection', 'text' ].includes(appState.activeTool.type)) {
						keyboard.setFocus(true);
					} else {
						keyboard.setFocus(false);
					};

					onChange(elements as any[], appState, files);
				}}
				theme={(theme ? 'dark' : 'light')}
				UIOptions={{
					tools: {
						image: false,
					}
				}}
			/>
		</div>
	);

}));

export default MediaExcalidraw;