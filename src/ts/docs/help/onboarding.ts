import { I, U, translate, S, Onboarding } from 'Lib';

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

	basicsNew: () => {
		const theme = S.Common.getThemeClass();
		const spaceview = U.Space.getSpaceview();
		const elementHead = spaceview.isChat ? '#sidebarPageWidget .spaceHeader' : '#sidebarPageWidget #widget-space';
		const isDark = theme == 'dark';
		const scn = isDark ? 'onboardingClonedSectionDark' : 'onboardingClonedSection';

		return {
			showDimmer: true,
			category: translate('onboardingBasicsTitle'),
			onComplete: Onboarding.completeBasics,
			param: {
				noArrow: true,
				noClose: true,
				horizontal: spaceview.isChat ? I.MenuDirection.Left : I.MenuDirection.Right,
				stickToElementEdge: I.MenuDirection.Top,
				width: 288,
				offsetX: -312,
				highlightElements: [],
				hiddenElements: [
					elementHead,
					'#sidebarPageWidget .section-pin',
					'#sidebarPageWidget .section-type',
					'#sidebarPageWidget > .bottom',
				]
			},
			items: [
				{
					description: translate('onboardingSpacesText'),
					param: {
						element: elementHead,
					}
				},
				{
					description: translate('onboardingPinnedNewText'),
					cloneElementClassName: scn,
					param: {
						element: '#sidebarPageWidget .section-pin',
					}
				},
				{
					description: translate('onboardingObjectsNewText'),
					cloneElementClassName: scn,
					param: {
						element: '#sidebarPageWidget .section-type',
					}
				},
			]
		};
	},

	basicsOld: () => {
		const theme = S.Common.getThemeClass();
		const spaceview = U.Space.getSpaceview();
		const isDark = theme == 'dark';
		const scn = isDark ? 'onboardingClonedSectionDark' : 'onboardingClonedSection';

		return {
			showDimmer: true,
			category: translate('onboardingBasicsTitle'),
			onComplete: Onboarding.completeBasics,
			param: {
				noArrow: true,
				noClose: true,
				horizontal: spaceview.isChat ? I.MenuDirection.Left : I.MenuDirection.Right,
				stickToElementEdge: I.MenuDirection.Top,
				width: 288,
				offsetX: -312,
				highlightElements: [],
				hiddenElements: [
					'#sidebarPageWidget .section-pin',
					'#sidebarPageWidget .section-type',
					'#sidebarPageWidget > .bottom',
				]
			},
			items: [
				{
					description: translate('onboardingPinnedOldText'),
					cloneElementClassName: scn,
					param: {
						element: '#sidebarPageWidget .section-pin .nameWrap',
					}
				},
				{
					description: translate('onboardingObjectsOldText'),
					cloneElementClassName: scn,
					param: {
						element: '#sidebarPageWidget .section-type .nameWrap',
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
					element: '#menuSyncStatus',
					horizontal: I.MenuDirection.Right,
					highlightElements: [ '#menuSyncStatus' ],
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
