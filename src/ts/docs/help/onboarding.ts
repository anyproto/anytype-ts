import { I, U, translate } from 'Lib';

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
			element: '#page.isFull #footer #button-help',
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

    mainSet: () => ({
        category: translate('onboardingMainSet'),
        items: [
            {
                description: `
					<p>${translate('onboardingMainSet11')}</p>
				`,
                video: './img/help/onboarding/set-1-to-collection.mp4',
            },
            {
                description: `
					<p>${translate('onboardingMainSet21')}</p>
				`,
                video: './img/help/onboarding/set-2-new-object.mp4',
            },
            {
                description: `
					<p>${translate('onboardingMainSet31')}</p>
					<p>${translate('onboardingMainSet32')}</p>
				`,
                buttonText: translate('onboardingMainSet3Button'),
            }
        ],
        param: {
            element: '#page.isFull #footer #button-help',
            classNameWrap: 'fixed',
            className: 'isWizard',
            vertical: I.MenuDirection.Top,
            horizontal: I.MenuDirection.Right,
            noArrow: true,
            noClose: true,
            passThrough: true,
            offsetY: -4
        },
    }),

    objectCreationStart: () => ({
        category: translate('onboardingObjectCreationStart'),
        items: [
            {
                description: `
					<p>${translate('onboardingObjectCreationStart11')}</p>
				`,
                video: './img/help/onboarding/object-1-default-object-type.mp4',
            },
            {
                description: `
					<p>${translate('onboardingObjectCreationStart21')}</p>
				`,
                video: './img/help/onboarding/object-2-type-menu.mp4',
                buttonText: translate('onboardingObjectCreationStart2Button'),
            },
        ],
        param: {
            element: '#page.isFull #footer #button-help',
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
            element: '#page.isFull #footer #button-help',
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

	basics: () => {

		return ({
			showDimmer: true,
			param: {
				noArrow: true,
				horizontal: I.MenuDirection.Right,
				topline: true,
				width: 288,
				offsetX: -312,
				noClose: true,
				highlightNodes: null,
				hiddenElements: [ '#widget-buttons', '.widgetView', '.widgetTree' ]
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
					category: translate('onboardingAllObjectTitle'),
					description: translate('onboardingAllObjectText'),
					param: {
						element: '#widget-buttons',
					}
				},
				{
					category: translate('onboardingWidgetsTitle'),
					description: translate('onboardingWidgetsText'),
					param: {
						element: '.widgetView',
						highlightNodes: $('#containerWidget').find('.widget.widgetView, .widget.widgetTree')
					}
				},
				{
					category: translate('onboardingMultipleSpacesTitle'),
					description: translate('onboardingMultipleSpacesText'),
					param: {
						element: '#vault #item-add',
						offsetX: -318,
					}
				},
				{
					category: translate('onboardingGalleryTitle'),
					description: translate('onboardingGalleryText'),
					param: {
						element: '#vault #item-gallery',
						offsetX: -318,
					}
				},
			]
		});
	},

    dashboard: () => {
		const canWrite = U.Space.canMyParticipantWrite();

		return {
			category: translate('onboardingDashboard'),
			showConfetti: true,
			showDimmer: true,
			items: [
				{
					name: translate('onboardingDashboard1Title'),
					description: translate('onboardingDashboard1Text'),
					param: {
						element: '#page.isFull #footer #button-help',
						classNameWrap: 'fixed',
						vertical: I.MenuDirection.Top,
						horizontal: I.MenuDirection.Right,
						offsetY: () => -($('#notifications').height() + 12),
					}
				},
				{
					name: translate('onboardingQuickCaptureTitle'),
					description: translate('onboardingQuickCaptureDescription'),
					param: {
						element: '#navigationPanel #button-navigation-plus',
						classNameWrap: 'fixed',
						vertical: I.MenuDirection.Top,
						horizontal: I.MenuDirection.Center,
						offsetY: -24,
					}
				},
				{
					name: translate('onboardingDashboard2Title'),
					description: translate('onboardingDashboard2Text'),
					video: './img/help/onboarding/sidebar.mp4',
					param: {
						element: '#widget-space',
						classNameWrap: 'fixed',
						vertical: I.MenuDirection.Center,
						horizontal: I.MenuDirection.Right,
						width: 288,
						offsetX: -298,
					}
				},
				{
					description: `
						<p>${translate('onboardingDashboard31')}</p>
						<p>${translate('onboardingDashboard32')}</p>
					`,
					buttons: [
						canWrite ? { text: translate('commonImport'), action: 'import' } : null
					],
					param: {
						element: '#page.isFull #footer #button-help',
						classNameWrap: 'fixed',
						vertical: I.MenuDirection.Top,
						horizontal: I.MenuDirection.Right,
						offsetY: () => -($('#notifications').height() + 12),
					},
				}
			],
		};
	},

    editor: () => ({
        category: translate('onboardingEditor'),
        items: [
			{
                name: translate('onboardingEditor1Title'),
				description: translate('onboardingEditor1Description'),
                param: {
                    element: '#block-featuredRelations #onboardingAnchor',
                    offsetY: 10,
                }
            },
            {
				name: translate('onboardingEditor2Title'),
				description: translate('onboardingEditor2Description'),
                param: {
                    element: '#block-featuredRelations #onboardingAnchor',
                    offsetY: 10,
                }
            },
			{
				description: translate('onboardingEditor3Description'),
                param: {
                    element: '#header #button-header-relation',
                    offsetY: 10,
                    classNameWrap: 'fixed fromHeader',
					horizontal: I.MenuDirection.Right,
                }
            },
            {
				name: translate('onboardingEditor4Title'),
				description: translate('onboardingEditor4Description'),
                param: {
                    element: '#navigationPanel #button-navigation-graph',
                    offsetY: -10,
                    classNameWrap: 'fixed fromHeader',
					vertical: I.MenuDirection.Top,
					horizontal: I.MenuDirection.Center,
                }
            },
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

				{
					name: translate('onboardingCalendarTitle'),
					description: translate('onboardingCalendarDescription'),
					param: {
						element: '#button-dataview-settings',
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

	space: () => {
		const width = 505;
		return {
			items: [
				{
					name: translate('onboardingShareSpaceTitle'),
					description: translate('onboardingShareSpaceDescription'),
					video: './img/help/onboarding/share-space.mp4',
					noButton: true,
					param: {
						element: '#widget-space',
						className: 'isSpace',
						classNameWrap: 'fixed',
						vertical: I.MenuDirection.Center,
						horizontal: I.MenuDirection.Right,
						width,
						offsetX: -(width + 10),
					}
				},
			],
		};
	},

};
