import { KeyboardEvent } from 'react';
import { U, keyboard } from 'Lib';

/**
 * Enhanced keyboard event handler with IME support
 * Handles form submission, disabled states, and IME composition
 */
export interface KeyboardHandlerOptions {
	onEnter?: () => void;
	onEscape?: () => void;
	onTab?: () => void;
	onArrowUp?: () => void;
	onArrowDown?: () => void;
	disabled?: boolean;
	allowEnterDuringComposition?: boolean;
}

/**
 * Create a keyboard event handler with IME support
 * @param options Configuration for keyboard handling
 * @returns Event handler function
 */
export function createKeyboardHandler(options: KeyboardHandlerOptions) {
	let isComposing = false;

	const handleCompositionStart = () => {
		isComposing = true;
	};

	const handleCompositionEnd = () => {
		isComposing = false;
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		// Early return if disabled
		if (options.disabled) {
			return;
		};

		// Handle IME composition - don't process keys during composition unless explicitly allowed
		if (isComposing && !options.allowEnterDuringComposition) {
			return;
		};

		const keys = [ 'enter', 'escape', 'tab', 'arrowUp', 'arrowDown' ];

		keys.forEach(k => {
			keyboard.shortcut(k.toLowerCase(), e, () => {
				e.preventDefault();
				e.stopPropagation();

				options[`on${U.String.toUpperCamelCase(k)}`]?.();
			});
		});
	};

	return {
		onKeyDown: handleKeyDown,
		onCompositionStart: handleCompositionStart,
		onCompositionEnd: handleCompositionEnd,
	};
}

/**
 * Simplified keyboard handler for form submission
 * @param onSubmit Function to call on Enter key
 * @param disabled Whether the input is disabled
 * @returns Event handlers object
 */
export function createFormKeyboardHandler(
	onSubmit: () => void,
	disabled: boolean = false
) {
	return createKeyboardHandler({
		onEnter: onSubmit,
		disabled,
		allowEnterDuringComposition: false,
	});
};