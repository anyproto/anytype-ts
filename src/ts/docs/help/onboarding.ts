import { I, U, translate, S, Onboarding } from 'Lib';
import $ from 'jquery';

const Data = {
	mainGraph: () => ({
		category: translate('onboardingMainGraph'),
		items: [
			{
				description: translate('onboardingMainGraph11'),
				video: './img/help/onboarding/space.mp4',
				buttonText: translate('commonFinish'),
			}
		],

		param: {
			recalcRect: () => {
				const { ww, wh } = U.Common.getWindowDimensions();
				return { x: 0, y: 0, width: ww, height: wh };
			},
			classNameWrap: 'fixed fromSidebar',
			className: 'isWizard',
			horizontal: I.MenuDirection.Right,
			noArrow: true,
			passThrough: true,
			offsetY: -4,
		},
	}),

	chat: () => {
		return {
			showDimmer: true,
			withCounter: true,
			param: {
				noArrow: true,
				noClose: true,
				horizontal: I.MenuDirection.Left,
			},
			items: [
				{
					name: translate('onboardingMainChatTitle1'),
					description: translate('onboardingCommonText1'),
					param: {
						vertical: I.MenuDirection.Center,
						horizontal: I.MenuDirection.Center,
						element: '#page.pageMainChat',
					}
				},
				{
					name: translate('onboardingMainChatTitle2'),
					description: translate('onboardingCommonText2'),
					param: {
						element: '#page.pageMainChat #button-chat-attachment',
						vertical: I.MenuDirection.Top,
						offsetY: -8,
					}
				},
				{
					name: translate('onboardingMainChatTitle3'),
					description: translate('onboardingCommonText3'),
					param: {
						element: '#sidebarPageWidget',
						vertical: I.MenuDirection.Center,
						offsetX: $('#sidebarPageWidget').width() + 8,
					}
				},
			],
		};
	},

	common: () => {
		const theme = S.Common.getThemeClass();
		const path = theme == 'dark' ? './img/help/onboarding/common/dark/' : './img/help/onboarding/common/';
		const elements = {
			vault: '#appContainer #sidebarPageVault #body',
			channel: '#appContainer #sidebarPageVault #button-create-space',
			profile: '#appContainer #sidebarPageVault .bottom .appSettings',
			gallery: '#appContainer #sidebarPageVault .bottom .icon.gallery',
			pin: '#sidebarPageWidget > #body > .content > .section-pin > .items',
			type: '#sidebarPageWidget > #body > .content > .section-type > .items',
			relation: '#header #button-header-relation',
			widgetSpace: '#widget-space .spaceData .head',
		};

		const getOffset = (el: string) => {
			let offset = 8;
			if (el == 'widgetSpace') {
				offset = 20;
			};

			return $(elements[el]).width() + offset;
		};

		const getSrc = (el: string) => {
			return `${path}${el}.png`;
		};

		return {
			showDimmer: true,
			withCounter: true,
			param: {
				noArrow: true,
				noClose: true,
				noBorderY: false,
				horizontal: I.MenuDirection.Left,
				highlightElements: [ '#sidebarLeft > #pageWrapper' ],
				stickToElementEdge: I.MenuDirection.Top,
			},
			items: [
				{
					name: translate('onboardingCommonTitleVault'),
					description: translate('onboardingCommonTextVault'),
					param: {
						element: elements.vault,
						offsetX: getOffset('vault'),
					}
				},
				{
					name: translate('onboardingCommonTitleChannels'),
					description: translate('onboardingCommonTextChannels'),
					param: {
						noBorderY: true,
						element: elements.channel,
						offsetX: getOffset('channel'),
					}
				},
				{
					name: translate('onboardingCommonTitleProfile'),
					description: translate('onboardingCommonTextProfile'),
					param: {
						element: elements.profile,
						stickToElementEdge: null,
						vertical: I.MenuDirection.Top,
						offsetY: -8,
					}
				},
				{
					name: translate('onboardingCommonTitleGallery'),
					description: translate('onboardingCommonTextGallery'),
					param: {
						element: elements.gallery,
						stickToElementEdge: null,
						vertical: I.MenuDirection.Top,
						offsetY: -8,
					}
				},
				{
					name: translate('onboardingCommonTitleSpace'),
					description: translate('onboardingCommonTextSpace'),
					param: {
						element: '.onboardingDimmer',
						highlightElements: [],
						stickToElementEdge: null,
						vertical: I.MenuDirection.Center,
						horizontal: I.MenuDirection.Center,
					}
				},
				{
					name: translate('onboardingCommonTitlePin'),
					description: translate('onboardingCommonTextPin'),
					param: {
						element: elements.pin,
						highlightElements: [ '#sidebarPageWidget > #body > .content > .section-pin' ],
						offsetX: getOffset('pin'),
					}
				},
				{
					name: translate('onboardingCommonTitleTypes'),
					description: translate('onboardingCommonTextTypes'),
					img: {
						src: getSrc('type'),
					},
					param: {
						element: elements.type,
						highlightElements: [ '#sidebarPageWidget > #body > .content > .section-type' ],
						offsetX: getOffset('type'),
					}
				},
				{
					name: translate('onboardingCommonTitleProperties'),
					description: translate('onboardingCommonTextProperties'),
					img: {
						src: getSrc('relation'),
						caption: translate('onboardingCommonTextPropertiesImgCaption'),
					},
					param: {
						element: elements.relation,
						highlightElements: [ elements.relation ],
						horizontal: I.MenuDirection.Right,
						offsetX: 0,
					}
				},
				{
					name: translate('onboardingCommonTitleSettings'),
					description: translate('onboardingCommonTextSettings'),
					cloneElementClassName: 'widgetSpaceHead',
					param: {
						element: elements.widgetSpace,
						highlightElements: [ elements.widgetSpace ],
						stickToElementEdge: null,
						vertical: I.MenuDirection.Bottom,
						offsetY: -$(elements.widgetSpace).height() - 24,
						offsetX: getOffset('widgetSpace'),
					}
				},
			]
		};
	},

	membership: () => ({
		showDimmer: true,
		param: {
			noArrow: true,
			horizontal: I.MenuDirection.Right,
			width: 288,
			offsetX: -304,
			offsetY: () => {
				const $element = $('.containerSettings #item-membership');
				return -$element.outerHeight();
			},
		},
		items: [
			{
				category: translate('onboardingMembershipTitle'),
				description: translate('onboardingMembershipText'),
				buttonText: translate('onboardingMembershipButton'),
				cloneElementClassName: 'onboardingSettingsItem',
				param: {
					element: '.containerSettings #item-membership',
				}
			}
		]
	}),

	syncStatus: () => ({
		showDimmer: true,
		param: {
			noArrow: true,
			width: 288,
			highlightElements: [],
			classNameWrap: 'fixed',
		},
		items: [
			{
				category: translate('onboardingSyncStatusTitle'),
				description: translate('onboardingSyncStatusText'),
				cloneElementClassName: 'onboardingHeaderSync',
				param: {
					element: '#header #headerSync',
					horizontal: I.MenuDirection.Right,
					highlightElements: [ '#header #headerSync' ],
					offsetY: 14,
				}
			},
			{
				category: translate('onboardingMobileTitle'),
				description: translate('onboardingMobileText'),
				buttonText: translate('onboardingMobileButton'),
				cloneElementClassName: 'onboardingIconP2P',
				param: {
					className: 'qrDownload',
					element: '#icon-p2p',
					horizontal: I.MenuDirection.Right,
					stickToElementEdge: I.MenuDirection.Top,
					offsetX: -295,
				}
			},
		]
	}),

	collections: () => ({
		showDimmer: true,
		param: {
			noArrow: true,
		},
		items: [
			{
				category: translate('onboardingCollectionsTitle'),
				description: translate('onboardingCollectionsText'),
				buttonText: translate('onboardingCollectionsButton'),
				cloneElementClassName: 'onboardingCollectionNewButton',
				param: {
					element: '#button-dataview-add-record',
					offsetY: 8,
				}
			}
		]
	}),

	typeDeleted: () => ({
		items: [
			{
				name: translate('onboardingTypeDeleted1Title'),
				description: translate('onboardingTypeDeleted1Description'),
				noButton: true,
				param: {
					element: '#block-featuredRelations',
					offsetY: 10,
				},
				buttons: [
					{ text: translate('blockFeaturedTypeMenuChangeType'), action: 'changeType' },
				],
			},
		],
	}),

	sourceDeleted: () => ({
		items: [
			{
				name: translate('onboardingSourceDeleted1Title'),
				description: translate('onboardingSourceDeleted1Description'),
				param: {
					element: '#block-featuredRelations',
					offsetY: 10,
				}
			},
		],
	}),

	inlineSet: () => ({
		items: [
			{
				name: translate('onboardingInlineSet1Title'),
				description: translate('onboardingInlineSet1Description'),
				param: {
					element: '.dataviewHead #value',
					offsetY: 32,
				}
			},
			{
				name: translate('onboardingInlineSet2Title'),
				description: translate('onboardingInlineSet2Description'),
				param: {
					element: '#dataviewControls #dataviewControlsSideLeft',
					offsetY: 10,
				}
			},
		],
	}),

	inlineCollection: () => ({
		items: [
			{
				name: translate('onboardingInlineCollection1Title'),
				description: translate('onboardingInlineCollection1Description'),
				param: {
					element: '.dataviewHead #value',
					offsetY: 36,
				}
			},
			{
				name: translate('onboardingInlineCollection2Title'),
				description: translate('onboardingInlineCollection2Description'),
				param: {
					element: '#dataviewControls #dataviewControlsSideLeft',
					offsetY: 10,
				}
			},
		],
	}),

	setSettings: () => (
		{
			items: [
				{
					name: translate('onboardingDefaultTypeTitle'),
					description: translate('onboardingDefaultTypeDescription'),
					param: {
						element: '#button-dataview-add-record-select',
						horizontal: I.MenuDirection.Right,
						offsetX: -4,
						offsetY: 12,
					},
				},
			],
		}
	),

	templateSelect: () => (
		{
			items: [
				{
					name: translate('onboardingTemplateSelectTitle'),
					description: translate('onboardingTemplateSelectDescription'),
					noButton: true,
				},
			],

			param: {
				element: '#headerBanner',
				horizontal: I.MenuDirection.Center,
				offsetY: 12,
			},
		}
	),

	objectDescriptionButton: () => {
		const controls = '#page.isFull .editorControls';
		const btn = `${controls} #button-description`;

		if (!$(btn).length) {
			return;
		};

		return {
			items: [
				{
					description: translate('onboardingMainObject'),
					buttonText: translate('commonOk'),
				}
			],
			param: {
				element: btn,
				horizontal: I.MenuDirection.Center,
				passThrough: true,
				offsetY: 16,
				onOpen: () => $(controls).addClass('active'),
				onClose: () => $(controls).removeClass('active'),
			},
		};
	},

	typeResetLayout: () => ({
		items: [
			{
				description: translate('onboardingMainType'),
				buttonText: translate('commonOk'),
			}
		],

		param: {
			element: '#pageFlex.isFull .headSimple #button-edit',
			horizontal: I.MenuDirection.Center,
			offsetY: 16,
		},
	}),

};

export default Data;
