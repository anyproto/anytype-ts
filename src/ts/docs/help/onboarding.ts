import { I, U, translate, S, Onboarding } from 'Lib';

export default {
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
			element: '#pageFlex.isFull #footer #button-help',
			classNameWrap: 'fixed',
			className: 'isWizard',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			noArrow: true,
			noClose: true,
			passThrough: true,
			offsetY: -4,
		},
	}),

	emailCollection: () => ({
		items: [ { noButton: true } ],
		param: {
			element: '#pageFlex.isFull #footer #button-help',
			classNameWrap: 'fixed',
			className: 'invertedColor',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			noArrow: true,
			noClose: true,
			passThrough: true,
			offsetY: -4,
		},
	}),

	objectCreationStart: () => ({
		category: translate('onboardingObjectCreationStart'),
		items: [
			{
				description: `
					<p>${translate('onboardingObjectCreationStart21')}</p>
				`,
				video: './img/help/onboarding/object-2-type-menu.mp4',
				buttonText: translate('onboardingObjectCreationStart2Button'),
			},
		],
		param: {
			element: '#pageFlex.isFull #footer #button-help',
			classNameWrap: 'fixed',
			className: 'isWizard',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			noArrow: true,
			noClose: true,
			passThrough: true,
			offsetY: -4,
		},
	}),

	objectCreationFinish: () => ({
		category: translate('onboardingObjectCreationFinish'),
		items: [
			{
				description: `
					<p>${translate('onboardingObjectCreationFinish11')}</p>
				`,
				video: './img/help/onboarding/object-layout.mp4',
				buttonText: translate('onboardingObjectCreationFinish1Button'),
			},
		],
		param: {
			element: '#pageFlex.isFull #footer #button-help',
			classNameWrap: 'fixed',
			className: 'isWizard',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			noArrow: true,
			noClose: true,
			passThrough: true,
			offsetY: -4,
		},
	}),

	basics: () => ({
		showDimmer: true,
		param: {
			noArrow: true,
			horizontal: I.MenuDirection.Right,
			stickToElementEdge: I.MenuDirection.Top,
			width: 288,
			offsetX: -312,
			noClose: true,
			highlightElements: [],
			hiddenElements: [ 
				'#widget-buttons', 
				'.widget', 
				'#containerWidget #list > .buttons',
				'#containerWidget #body',
				'.shareBanner',
			],
			/*
			onClose: () => Onboarding.start('emailCollection', false),
			*/
		},
		items: [
			{
				category: translate('onboardingSpacesTitle'),
				description: translate('onboardingSpacesText'),
				param: {
					element: '#widget-space',
				}
			},
			{
				category: translate('onboardingWidgetsTitle'),
				description: translate('onboardingWidgetsText'),
				param: {
					element: '.widgetView',
					highlightElements: [ '#containerWidget .widget.widgetView', '#containerWidget .widget.widgetTree', '#containerWidget .widget.widgetLink' ]
				}
			},
			{
				category: translate('onboardingMultipleSpacesTitle'),
				description: translate('onboardingMultipleSpacesText'),
				cloneElementClassName: 'onboardingVaultItem',
				param: {
					element: '#vault #item-add',
					offsetX: -318,
				}
			},
			{
				category: translate('onboardingGalleryTitle'),
				description: translate('onboardingGalleryText'),
				cloneElementClassName: 'onboardingVaultItem',
				param: {
					element: '#vault #item-gallery',
					offsetX: -318,
				}
			},
		]
	}),

	membership: () => ({
		showDimmer: true,
		param: {
			noArrow: true,
			horizontal: I.MenuDirection.Right,
			width: 288,
			offsetX: -304,
			offsetY: () => {
				const $element = $('#containerSettings #item-membership');
				return -$element.outerHeight();
			},
			noClose: true,
		},
		items: [
			{
				category: translate('onboardingMembershipTitle'),
				description: translate('onboardingMembershipText'),
				buttonText: translate('onboardingMembershipButton'),
				cloneElementClassName: 'onboardingSettingsItem',
				param: {
					element: '#containerSettings #item-membership',
				}
			}
		]
	}),

	syncStatus: () => ({
		showDimmer: true,
		param: {
			noArrow: true,
			width: 288,
			noClose: true,
			highlightElements: [],
			classNameWrap: 'fixed',
		},
		items: [
			{
				category: translate('onboardingSyncStatusTitle'),
				description: translate('onboardingSyncStatusText'),
				cloneElementClassName: 'onboardingHeaderSync',
				param: {
					element: '#menuSyncStatus',
					vertical: I.MenuDirection.Bottom,
					horizontal: I.MenuDirection.Right,
					stickToElementEdge: I.MenuDirection.None,
					highlightElements: [ '#menuSyncStatus', '#sidebarSync' ],
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
			noClose: true,
		},
		items: [
			{
				category: translate('onboardingCollectionsTitle'),
				description: translate('onboardingCollectionsText'),
				buttonText: translate('onboardingCollectionsButton'),
				cloneElementClassName: 'onboardingDataviewEmptyButton',
				param: {
					element: '#emptyButton',
					vertical: I.MenuDirection.Bottom,
					horizontal: I.MenuDirection.Left,
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

	collaboration: () => {
		const width = 432;
		return {
			items: [
				{
					name: translate('onboardingCollaborationTitle'),
					description: translate('onboardingCollaborationText'),
					noButton: true,
					param: {
						element: '#popupUsecase #category-collaboration',
						className: 'isSpace',
						classNameWrap: 'fixed',
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Left,
						width,
						offsetY: 14,
					}
				},
			],
		};
	},

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
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Center,
				passThrough: true,
				noClose: true,
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
			element: '#pageFlex.isFull .headSimple .side.right',
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left,
			noClose: true,
			offsetX: -304,
			offsetY: 45,
		},
	}),

};
