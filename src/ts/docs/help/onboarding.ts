import { I, translate } from 'Lib';

export default {
    mainGraph: () => ({
        category: translate('onboardingMainGraph'),
        items: [
            {
                description: `
					<p>${translate('onboardingMainGraph11')}</p>
					<p>${translate('onboardingMainGraph12')}</p>
				`,
                video: './img/help/onboarding/space.mp4',
                noButton: true,
                buttons: [
                    { text: translate('commonNext'), action: 'dashboard' },
                ],
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
        items: [
            {
                description: `
					<p>${translate('onboardingDashboard11')}</p>
					<p>${translate('onboardingDashboard12')}</p>
				`,
                video: './img/help/onboarding/homepage.mp4',
            },
            {
                description: `
					<p>${translate('onboardingDashboard21')}</p>
					<p>${translate('onboardingDashboard22')}</p>
					<p>${translate('onboardingDashboard23')}</p>
                `,
                video: './img/help/onboarding/sets.mp4',
            },
            {
                description: `
					<p>${translate('onboardingDashboard31')}</p>
					<p>${translate('onboardingDashboard32')}</p>
                `,
                video: './img/help/onboarding/objects.mp4',
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
				name: translate('onboardingEditor3Title'),
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
				}
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

}
