import React, { forwardRef, useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, Label, IconObject, EmptySearch, Button, Loader } from 'Component';
import * as I from 'Interface';

const MenuParticipant = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {

	const { param, close } = props;
	const { data } = param;
	const { object } = data;
	const { space } = S.Common;
	const { account } = S.Auth;
	const iconRef = useRef(null);
	const [ isLoaded, setIsLoaded ] = useState(!object?.iconImage);
	const oneToOne = U.Space.getList().filter(it => it.isOneToOne && (it.oneToOneIdentity == object.identity))[0];
	const showButton = (oneToOne && oneToOne.targetSpaceId != space) || !oneToOne || (object.identity == account.id);
	const globalName = object.globalName || U.String.shortMask(object.identity, 6);

	let text = '';
	let color = 'blank';

	if (object.identity == account.id) {
		text = translate('menuParticipantProfile');
	} else
	if (oneToOne && (oneToOne.targetSpaceId != space)) {
		text = translate('menuParticipantMessage');
		color = 'accent';
	} else 
	if (!oneToOne) {
		text = translate('menuParticipantConnect');
	};

	const load = () => {
		U.Object.getById(object.id, { keys: U.Subscription.participantRelationKeys() }, (object: any) => {
			if (object) {
				props.param.data.object = object;
			};
		});
	};

	const onClick = () => {
		if (object.identity == account.id) {
			Action.openSettings('account', analytics.route.menuParticipant);
		} else {
			U.Space.openOneToOne(object.identity, '', analytics.route.menuParticipant, () => close());
			analytics.event('ClickConnectOneToOne', { route: analytics.route.menuParticipant });
		};
	};

	useEffect(() => load(), []);

	useEffect(() => {
		if (isLoaded) {
			return;
		};

		const node = $(iconRef.current);
		const img = node.find('.iconImage');

		if (!img.length) {
			setIsLoaded(true);
			return;
		};

		const onImageLoad = () => setIsLoaded(true);

		img.on('load', onImageLoad);
		img.on('error', onImageLoad);

		if ((img.get(0) as HTMLImageElement)?.complete) {
			setIsLoaded(true);
		};

		return () => {
			img.off('load', onImageLoad);
			img.off('error', onImageLoad);
		};
	});

	return object ? (
		<>
			<div className="head">
				<Label
					text={globalName}
					onClick={() => U.Common.copyToast(translate('blockFeaturedIdentity'), object.identity)}
				/>
			</div>
			<div ref={iconRef} className={[ 'iconWrapper', (isLoaded ? 'isLoaded' : '') ].join(' ')}>
				<Loader type={I.LoaderType.Loader} />
				<IconObject object={object} size={128} />
			</div>
			<div className="nameWrapper">
				<ObjectName object={object} withBadge={true} />
			</div>
			<ObjectDescription object={object} />

			{showButton ? (
				<div className="buttonsWrapper">
					<Button color={color} text={text} onClick={onClick} />
				</div>
			) : ''}
		</>
	) : <EmptySearch text={translate('commonNotFound')} />;

}));

export default MenuParticipant;
