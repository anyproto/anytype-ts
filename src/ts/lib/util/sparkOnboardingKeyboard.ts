import { Key } from 'Lib';

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

	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Early return if disabled
		if (options.disabled) {
			return;
		}

		// Handle IME composition - don't process keys during composition unless explicitly allowed
		if (isComposing && !options.allowEnterDuringComposition) {
			return;
		}

		const key = e.key.toLowerCase();

		// Handle different keys
		if ((key === Key.enter || key === 'enter') && options.onEnter && !e.shiftKey) {
			e.preventDefault();
			e.stopPropagation();
			options.onEnter();
			return;
		}

		if ((key === Key.escape || key === 'escape') && options.onEscape) {
			e.preventDefault();
			e.stopPropagation();
			options.onEscape();
			return;
		}

		if ((key === Key.tab || key === 'tab') && options.onTab) {
			e.preventDefault();
			e.stopPropagation();
			options.onTab();
			return;
		}

		if ((key === Key.up || key === 'arrowup') && options.onArrowUp) {
			e.preventDefault();
			e.stopPropagation();
			options.onArrowUp();
			return;
		}

		if ((key === Key.down || key === 'arrowdown') && options.onArrowDown) {
			e.preventDefault();
			e.stopPropagation();
			options.onArrowDown();
			return;
		}
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
}