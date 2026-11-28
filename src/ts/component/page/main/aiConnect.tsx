import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { Loader, Frame, Title } from 'Component';
import * as I from 'Interface';
import { isCatalogId } from 'Lib/aiConnect/catalog';
import { aiAppsObject } from 'Lib/aiConnect/entry';

/**
 * `/ai/connect?app=<id>` reached as a route (links themselves arrive through Lib/aiConnect/link and never get
 * here): this entry becomes Settings ▸ AI apps with that card as its target, in place — no extra history entry,
 * no dashboard detour, the same tab. The route carries only a catalog id; nothing is created here.
 */
const PageMainAiConnect = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;

	const init = () => {
		const { app } = keyboard.getMatch(false).params;

		U.Router.replaceCurrent(U.Object.route(aiAppsObject({ app: isCatalogId(app) ? app : '' }, analytics.route.deeplink)));
		resize();
	};

	const resize = () => {
		const obj = U.Dom.getPageFlexContainer(isPopup);
		const h = isPopup ? (obj?.clientHeight || 0) : window.innerHeight;

		if (nodeRef.current) {
			U.Dom.css(nodeRef.current, { height: `${h}px` });
		};
	};

	useEffect(() => {
		init();
	}, []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div
			ref={nodeRef}
			className="wrapper"
		>
			<Frame>
				<Title text={translate('aiAppsTitle')} />
				<Loader />
			</Frame>
		</div>
	);

});

export default PageMainAiConnect;
