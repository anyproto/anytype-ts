import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import { Title, Label, Button, Icon } from 'Component';
import { I, U, S, J, translate } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation, EffectFade } from 'swiper/modules';

const PopupOnboarding = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const nodeRef = useRef(null);
	const [ step, setStep ] = useState(0);
	const [ types, setTypes ] = useState([]);
	const [ swiperControl, setSwiperControl ] = useState(null);
	const slides = [ 0, 1, 2, 3 ];

	const typeIcon = (id: string) => {
		return U.Common.updateSvg(require(`img/icon/type/default/${id}.svg`), { id, size: 20, fill: '#909cdf' });
	};

	const initTypes = (types) => {
		const wrapper = $(nodeRef.current).find('.step0');

		let typeIds = types.map(it => it.id);

		const interval = window.setInterval(() => {
			const idx = Math.floor(Math.random() * typeIds.length);

			wrapper.find(`.type-${typeIds[idx]}`).removeClass('hidden');
			typeIds.splice(idx, 1);

			if (!typeIds.length) {
				clearInterval(interval);

				window.setTimeout(() => {
					wrapper.removeClass('init');
				}, 300);
			};
		}, 100);
	};

	const initGallery = () => {
		const wrapper = $(nodeRef.current).find('.step1');

		setStep(1);

		window.setTimeout(() => {
			wrapper.removeClass('init');
		}, 600);
	};

	const loadTypes = () => {
		const storeIds = S.Record.getRecordIds(J.Constant.subId.typeStore, '');

		U.Data.search({
			filters: [
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
				{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.type ] }
			],
			sorts: [
				{ type: I.SortType.Desc, relationKey: 'lastUsedDate' },
				{ type: I.SortType.Asc, relationKey: 'name' },
			],
			keys: J.Relation.default.concat([ 'lastModifiedDate', 'sourceObject' ]),
			limit: 14,
		}, (message) => {
			const types = (message.records || []).filter(it => storeIds.includes(it.sourceObject));

			setTypes(types);
			initTypes(types);
		});
	};

	useEffect(() => {
		loadTypes();
	}, []);

	return (
		<div ref={nodeRef} className={[ 'steps', `s${step}` ].join(' ')}>
			<div className="step0 init">
				<div className="types">
					{types.map((type) => {
						const src = typeIcon(type.iconName);

						return (
							<div className={[ 'type', `type-${type.id}`, 'hidden' ].join(' ')} key={type.id}>
								<img className="icon" src={src} />
								<Label text={type.pluralName} />
							</div>
						);
					})}
				</div>

				<Title text={translate('onboardingPrimitivesTitle')} />
				<Label text={translate('onboardingPrimitivesDescription')} />
				<Button onClick={initGallery} text={translate('onboardingPrimitivesButton')} className="c42" />
			</div>

			<div className="step1 init">
				<Icon onClick={() => close()} className="close" />
				<Swiper
					onSwiper={setSwiperControl}
					spaceBetween={0}
					slidesPerView={1}
					keyboard={{ enabled: true }}
					navigation={true}
					effect={'fade'}
					loop={true}
					modules={[ Keyboard, Navigation, EffectFade ]}
				>
					{slides.map((idx: number) => (
						<SwiperSlide key={idx}>
							<div className={[ 'slide', `slide${idx}` ].join(' ')}>
								<div className="text">
									<Title className="hidden" text={translate(`onboardingPrimitivesSlide${idx}Title`)} />
									<Label className="description hidden" text={translate(`onboardingPrimitivesSlide${idx}Text`)} />
									<Label className="count hidden" text={`${idx + 1} / ${slides.length}`} />
								</div>

								<img onClick={() => swiperControl.slideNext()} src={`./img/help/onboarding/primitives/${idx}.png`} />
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);

});

export default PopupOnboarding;
