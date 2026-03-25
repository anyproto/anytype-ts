import React, { useEffect } from 'react';
import type { Decorator } from '@storybook/react';

/**
 * Global decorator that sets html/body classes to match the real app environment.
 * In the app, keyboard.setBodyClass() adds platformMac, bodyMain, etc. to <html>.
 */
export const withAppClass: Decorator = (Story) => {
	useEffect(() => {
		const html = document.documentElement;
		html.classList.add('platformMac');
		return () => {
			html.classList.remove('platformMac');
		};
	}, []);

	return <Story />;
};

/**
 * Decorator that wraps stories in a container with standard padding.
 */
export const withContainer: Decorator = (Story, context) => {
	const { width, padding } = context.parameters.container || {};

	return (
		<div style={{
			width: width || 'auto',
			padding: padding ?? 16,
		}}>
			<Story />
		</div>
	);
};

/**
 * Decorator that provides a dark background option for components.
 */
export const withBackground: Decorator = (Story, context) => {
	const bg = context.parameters.background || 'transparent';

	return (
		<div style={{ background: bg, padding: 16, borderRadius: 8 }}>
			<Story />
		</div>
	);
};

/**
 * Wraps popup components in the correct DOM hierarchy.
 * In the app: .popups > .popup.popup{Name}.show.showDimmer > .innerWrap > .content > <Component />
 */
export const withPopup = (popupId: string, className?: string): Decorator => {
	return (Story) => {
		const cn = [ 'popup', `popup${popupId}`, 'show' ];
		if (className) {
			cn.push(className);
		};

		return (
			<div className="popups">
				<div className={cn.join(' ')} style={{ position: 'relative', width: '100%', height: '100%' }}>
					<div className="innerWrap" style={{ position: 'relative', opacity: 1, transform: 'none' }}>
						<div className="content">
							<Story />
						</div>
					</div>
				</div>
			</div>
		);
	};
};

/**
 * Wraps menu item components in the correct DOM hierarchy.
 * In the app: .menus > .menuWrap > .menu.show > .content > .items > <Component />
 */
export const withMenu: Decorator = (Story) => {
	return (
		<div className="menus">
			<div className="menuWrap" style={{ position: 'relative' }}>
				<div className="menu show" style={{ position: 'relative', opacity: 1, transform: 'none', boxShadow: 'none', width: 280 }}>
					<div className="content">
						<div className="items">
							<Story />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

/**
 * Wraps block components in the correct DOM hierarchy.
 * In the app: .blocks > .block.{blockClass} > .wrapContent > <Component />
 * @param blockClass - CSS classes for the .block element, e.g. 'blockText textParagraph'
 */
export const withBlock = (blockClass: string): Decorator => {
	return (Story) => {
		return (
			<div className="blocks" style={{ padding: 16, maxWidth: 700 }}>
				<div className={`block ${blockClass} align0`}>
					<div className="wrapMenu" />
					<div className="wrapContent">
						<Story />
					</div>
				</div>
			</div>
		);
	};
};

/**
 * Wraps header components in the correct DOM hierarchy.
 * In the app: .header.{component}.isCommon > <Component />
 */
export const withHeader = (component: string): Decorator => {
	return (Story) => {
		const cn = [ 'header', component, 'isCommon' ];

		return (
			<div className={cn.join(' ')} style={{ position: 'relative', width: '100%' }}>
				<Story />
			</div>
		);
	};
};

/**
 * Wraps notification components in the correct DOM hierarchy.
 * In the app: .notifications > <Component />
 */
export const withNotification: Decorator = (Story) => {
	return (
		<div className="notifications" style={{ position: 'relative', right: 'auto', bottom: 'auto' }}>
			<Story />
		</div>
	);
};
