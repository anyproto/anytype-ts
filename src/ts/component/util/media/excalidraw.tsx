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
			onMouseDownCapture={() => {
				isActiveRef.current = true;
				keyboard.setFocus(true);
			}}
		>
			<Excalidraw
				isCollaborating={false}
				initialData={data}
				viewModeEnabled={readonly}
				onChange={(elements, appState, files) => {
					// While the user is interacting with the canvas keep the app keyboard suppressed,
					// otherwise Excalidraw tool shortcuts (v, r, o, delete, arrows, etc.) are consumed
					// by the global handler in Lib/keyboard
					if (isActiveRef.current) {
						keyboard.setFocus(true);
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
						image: true,
					}
				}}
			/>
		</div>
	);

});

export default MediaExcalidraw;