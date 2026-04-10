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
/**
 * Wraps menu components in the correct DOM hierarchy.
 * Pass an optional menu class name (e.g. 'menuBlockStyle') to add it to the .menu element.
 * In the app: .menus > .menuWrap > .menu.vertical.show > .content > .items > <Component />
 */
export const withMenuClass = (menuClass?: string): Decorator => {
	return (Story) => (
		<div className="menus">
			<div className="menuWrap" style={{ position: 'relative' }}>
				<div className={`menu vertical ${menuClass || ''} show`.trim()} style={{ position: 'relative', opacity: 1, transform: 'none', boxShadow: 'none', width: 280 }}>
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

export const withMenu: Decorator = withMenuClass();

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
 * Wraps horizontal menu toolbar components in the correct DOM hierarchy.
 * In the app: .menus > .menuWrap > .menu.horizontal.show > .content > <Component />
 */
export const withHorizontalMenu = (menuClass: string): Decorator => {
	return (Story) => {
		return (
			<div className="menus">
				<div className="menuWrap" style={{ position: 'relative' }}>
					<div className={`menu horizontal ${menuClass} show`} style={{ position: 'relative', opacity: 1, transform: 'none' }}>
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

/**
 * Wraps widget components in the correct DOM hierarchy.
 * In the app: .widget.{widgetClass} > .contentWrapper > <Component />
 * @param widgetClass - CSS class for the widget type, e.g. 'widgetObject', 'widgetTree', 'widgetView'
 */
export const withWidget = (widgetClass: string): Decorator => {
	return (Story) => {
		return (
			<div className={`widget ${widgetClass}`} style={{ background: 'var(--color-shape-highlight-light)', borderRadius: 12 }}>
				<div className="contentWrapper">
					<Story />
				</div>
			</div>
		);
	};
};

/**
 * Wraps widget view item components in the correct DOM hierarchy.
 * In the app: .widget.widgetView > .contentWrapper > .{viewClass} > .body > .items > <Component />
 * @param viewClass - CSS class for the view type, e.g. 'viewList', 'viewGallery', 'viewBoard'
 * @param bodyClass - Optional extra class for the .body element, e.g. 'isCompact'
 */
export const withWidgetView = (viewClass: string, bodyClass?: string): Decorator => {
	return (Story) => {
		const bodyCn = [ 'body' ];
		if (bodyClass) {
			bodyCn.push(bodyClass);
		};

		return (
			<div className="widget widgetView" style={{ background: 'var(--color-shape-highlight-light)', borderRadius: 12 }}>
				<div className="contentWrapper">
					<div className={viewClass}>
						<div className={bodyCn.join(' ')}>
							<div className="items">
								<Story />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
};
