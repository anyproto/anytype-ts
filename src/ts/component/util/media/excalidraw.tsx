import React, { forwardRef, useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { keyboard } from 'Lib/keyboard';

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

	const theme = S.Common.getThemeClass();
	const nodeRef = useRef<HTMLDivElement>(null);
	const isActiveRef = useRef(false);

	useEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) {
				isActiveRef.current = false;
				keyboard.setFocus(false);
			};
		};

		U.Dom.addEvent(window, 'mousedown', onMouseDown);
		return () => {
			U.Dom.removeEvent(window, 'mousedown', onMouseDown);
			keyboard.setFocus(false);
		};
	}, []);

	data.elements = data.elements || [];
	data.appState = data.appState || {};
	data.appState.collaborators = new Map();
	data.appState.viewBackgroundColor = J.Theme[theme]?.graph?.bg || '#ffffff';

	return (
		<div
			className="mediaExcalidraw"
			ref={nodeRef}
			onMouseDownCapture={() => { isActiveRef.current = true; }}
		>
			<Excalidraw
				isCollaborating={false}
				initialData={data}
				viewModeEnabled={readonly}
				onChange={(elements, appState, files) => {
					if (isActiveRef.current) {
						if ([ 'selection', 'text' ].includes(appState.activeTool.type)) {
							keyboard.setFocus(true);
						} else {
							keyboard.setFocus(false);
						};
					};

					onChange(elements as any[], appState, files);
				}}
				theme={(theme ? 'dark' : 'light')}
				validateEmbeddable={(url: string | URL) => {
					const s = typeof url === 'string' ? url : url.toString();
					return s.startsWith('anytype://') || /^https?:\/\/object\.any\.coop(\/|$|\?)/.test(s);
				}}
				UIOptions={{
					tools: {
						image: false,
					}
				}}
			/>
		</div>
	);

});

export default MediaExcalidraw;