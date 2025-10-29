import React, { forwardRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

interface Props {
	data?: any;
	readonly?: boolean;
	onChange?: (elements: any[], appState: any, files: any) => void;
}

const MediaExcalidraw = forwardRef<{}, Props>(({
	data = {},
	readonly = false,
	onChange = () => {},
}, ref) => {

	console.log('DATA', data);
	data.elements = data.elements || [];
	data.appState = data.appState || {};
	data.appState.collaborators = new Map();

	return (
		<div className="mediaExcalidraw">
			<Excalidraw
				isCollaborating={false}
				initialData={data}
				viewModeEnabled={readonly}
				onChange={onChange}
			/>
		</div>
	);

});

export default MediaExcalidraw;