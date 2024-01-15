import { I, Onboarding, keyboard, translate } from 'Lib';

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
			className: 'wizard',
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
            className: 'wizard',
            vertical: I.MenuDirection.Top,
            horizontal: I.MenuDirection.Right,
            noArrow: true,
            noClose: true,
            passThrough: true,
            offsetY: -4
        },
    }),

    storeType: () => ({
        category: translate('onboardingStoreType'),
        items: [
            {
                description: `
					<p>${translate('onboardingStoreType11')}</p>
				`,
                video: './img/help/onboarding/library-1-add-type.mp4',
            },
            {
                description: `
					<p>${translate('onboardingStoreType21')}</p>
					<p>${translate('onboardingStoreType22')}</p>
				`,
                video: './img/help/onboarding/library-2-new-type.mp4',
                buttonText: translate('commonOk'),
            },
        ],
        param: {
            element: '#page.isFull #footer #button-help',
            classNameWrap: 'fixed',
            className: 'wizard',
            vertical: I.MenuDirection.Top,
            horizontal: I.MenuDirection.Right,
            noArrow: true,
            noClose: true,
            passThrough: true,
            offsetY: -4
        },
    }),

    storeRelation: () => ({
        category: translate('onboardingStoreRelation'),
        items: [
            {
                description: `
					<p>${translate('onboardingStoreRelation11')}</p>
				`,
                video: './img/help/onboarding/library-3-relation.mp4',
                buttonText: translate('onboardingStoreRelation1Button'),
            },
            {
                description: `
					<p>${translate('onboardingStoreRelation21')}</p>
				`,
				buttonText: translate('onboardingStoreRelation2Button'),
            },
        ],
        param: {
            element: '#page.isFull #footer #button-help',
            classNameWrap: 'fixed',
            className: 'wizard',
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
            className: 'wizard',
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
            className: 'wizard',
            vertical: I.MenuDirection.Top,
            horizontal: I.MenuDirection.Right,
            noArrow: true,
            noClose: true,
            passThrough: true,
            offsetY: -4,
        },
    }),

    dashboard: () => ({
        category: translate('onboardingDashboard'),
        showConfetti: true,
		onComplete: (force: boolean) => {
			if (!$('#navigationPanel').hasClass('hide')) {
				Onboarding.start('space', keyboard.isPopup(), force);
			};
		},
        items: [
            {
                description: `
					<p>${translate('onboardingDashboard11')}</p>
					<p>${translate('onboardingDashboard12')}</p>
					<p>${translate('onboardingDashboard13')}</p>
				`,
                video: './img/help/onboarding/homepage.mp4',
            },
            {
                description: `
					<p>${translate('onboardingDashboard41')}</p>
					<p>${translate('onboardingDashboard42')}</p>
                `,
                video: './img/help/onboarding/sidebar.mp4',
            },
            {
                description: `
					<p>${translate('onboardingDashboard51')}</p>
					<p>${translate('onboardingDashboard52')}</p>
					<p>${translate('onboardingDashboard53')}</p>
                `,
                buttons: [
                    { text: translate('commonImport'), action: 'import' }
                ]
            }
        ],

		param: {
			element: '#page.isFull #footer #button-help',
			classNameWrap: 'fixed',
			className: 'wizard',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
            noArrow: true,
			noClose: true,
			passThrough: true,
			offsetY: -4,
		},
    }),

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
				param: {
					element: '#block-featuredRelations',
					offsetY: 10,
				},
				noButton: true,
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
					element: '#dataviewControls #sideLeft',
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
					element: '#dataviewControls #sideLeft',
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
				},
			],

			param: {
				element: '#headerBanner',
				horizontal: I.MenuDirection.Center,
				offsetY: 12,
				noButton: true,
			},
		}
	),

	space: () => (
		{
			onComplete: (force: boolean) => {
				if (!$('#navigationPanel').hasClass('hide')) {
					Onboarding.start('quickCapture', keyboard.isPopup(), force);
				};
			},

			items: [
				{
					name: translate('onboardingSpaceSelectTitle'),
					description: translate('onboardingSpaceSelectDescription'),
					param: {
						element: '#navigationPanel #button-navigation-profile',
					}
				},
			],

			param: {
				classNameWrap: 'fixed',
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Center,
				offsetY: -24,
				noButton: true,
			},
		}
	),

	quickCapture: () => (
		{
			items: [
				{
					name: translate('onboardingQuickCaptureTitle'),
					description: translate('onboardingQuickCaptureDescription'),
					param: {
						element: '#navigationPanel #button-navigation-plus',
					}
				},
			],

			param: {
				classNameWrap: 'fixed',
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Center,
				offsetY: -24,
				noButton: true,
			},
		}
	),

};
