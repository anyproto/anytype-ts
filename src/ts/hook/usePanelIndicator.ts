import { useEffect, RefObject } from 'react';
import { FocusedPanel } from 'Lib/keyboard/router';

const HIGHLIGHT_CLASS = 'keyboardHighlight';

export const usePanelIndicator = (ref: RefObject<HTMLElement>, panel: FocusedPanel) => {
	useEffect(() => {
		const onFocusPanelChange = (e: Event) => {
			const el = ref.current;
			if (!el) {
				return;
			};

			const activePanel = (e as CustomEvent).detail as FocusedPanel | null;
			el.classList.toggle(HIGHLIGHT_CLASS, activePanel === panel);
		};

		window.addEventListener('focusPanelChange', onFocusPanelChange);

		return () => {
			window.removeEventListener('focusPanelChange', onFocusPanelChange);

			const el = ref.current;
			if (el) {
				el.classList.remove(HIGHLIGHT_CLASS);
			};
		};
	}, [ panel ]);
};
