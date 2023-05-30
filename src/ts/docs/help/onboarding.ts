import { I } from 'Lib';

export default {
    mainGraph: {
        category: 'Onboarding',
        items: [
            {
                description: `
					<p>
						<b>Welcome to your Anytype Space.</b> Space is essentially a graph, and Anytype aims to provide a natural way of thinking where everything is represented as objects with specific relationships, just like in the real world.
					</p>
					<p>To access your Dashboard, click the icon in the center of your screen.</p>
				`,
                video: './img/help/onboarding/space.mp4',
                noButton: true,
                buttons: [
                    { text: 'Next', action: 'dashboard' }
                ]
            }
        ],

        param: {
            element: '#footer #button-help',
            classNameWrap: 'fixed',
            className: 'wizard',
            vertical: I.MenuDirection.Top,
            horizontal: I.MenuDirection.Right,
            noArrow: true,
			noClose: true,
			passThrough: true,
            offsetY: -4,
        },
    },

    dashboard: {
        category: 'Onboarding',
        showConfetti: true,
        items: [
            {
                description: `
					<p>
						<b>Welcome to your Dashboard.</b> This is your personalized page, which you can customize to your liking.<br />
						We've included some materials to help you get started, but feel free to make adjustments as needed.
					</p>
					<p>Let's take a few minutes to explore the features together.</p>
				`,
                video: './img/help/onboarding/dashboard.mp4',
            },
            {
                description: `
					<p>On the Dashboard page, you'll find <b>Sets, which act as filters for your objects</b> with various viewing options.</p>
					<p>Sets make it easy to navigate and collect specific objects, such as notes, links, tasks, ideas, and more.</p>
					<p>To access different Set views, simply select them.</p>
                `,
                video: './img/help/onboarding/sets.mp4',
            },
            {
                description: `
					<p><b>Objects in Anytype</b> have specific types depending on their purpose. You can use system types or define custom ones. Structure objects with relations and links.</p>
					<p>To add an object to a set, click the <span class="highlight">New</span> button and view its relation as properties in columns.</p>
                `,
                video: './img/help/onboarding/objects.mp4',
            },
            {
                description: `
					<p><b>You'll find the Sidebar on the left.</b> It's a navigation tool that you can customize with multiple widget types.</p>
					<p>Change the widget appearance and see what looks best. Make your Favorites as a Tree Widget.</p>
                `,
                video: './img/help/onboarding/sidebar.mp4',
            },
            {
                description: `
					<p><b>Great job!</b> You have completed this section. Feel free to explore other menus in the interface, such as Library and Sets.</p>
					<p>If you have any questions, don't hesitate to press the <span class="highlight">?</span> button.</p>
					<p>To continue working on your project where you left off, you can import your data and make it your own.</p>
                `,
                buttons: [
                    { text: 'Import', action: 'import' }
                ]
            }
        ],

		param: {
			element: '#footer #button-help',
			classNameWrap: 'fixed',
			className: 'wizard',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
            noArrow: true,
			noClose: true,
			passThrough: true,
			offsetY: -4,
		},
    },

    editor: {
        category: 'Editor',
        items: [
			{
                name: 'Connect your Objects',
				description: `Use the <span class="highlight">@</span> symbol to refer to other objects while writing, and the <span class="highlight">/</span> symbol to create text styles, objects, and more.`,
                param: {
                    element: '#block-featuredRelations #onboardingAnchor',
                    offsetY: 10,
                }
            },
            {
                name: 'Did you know?',
                description: `Drag and drop files and images from your computer into the editor window, or copy and paste text to create new blocks. Try it out!`,
                param: {
                    element: '#block-featuredRelations #onboardingAnchor',
                    offsetY: 10,
                }
            },
			{
                description: 'Click above to view the Relation menu, where you can find object links as properties.',
                param: {
                    element: '#header #button-header-relation',
                    offsetY: 10,
                    classNameWrap: 'fixed fromHeader',
					horizontal: I.MenuDirection.Right,
                }
            },
            {
                name: 'See your Graph grow',
                description: 'Click below to see how new objects are connected in your own graph by links and relations!',
                param: {
                    element: '#navigationPanel #button-navigation-graph',
                    offsetY: -10,
                    classNameWrap: 'fixed fromHeader',
					vertical: I.MenuDirection.Top,
					horizontal: I.MenuDirection.Center,
                }
            },
			{
                name: `Like what you're working on?`,
                description: 'Save this structure for future use by selecting “Save as Template” from the three-dot menu. It will be saved in your Library, very useful for recurring work.',
                param: {
                    element: '#header #button-header-more',
                    offsetY: 10,
                    classNameWrap: 'fixed fromHeader',
					horizontal: I.MenuDirection.Right,
                }
            },
        ]
    },

    typeDeleted: {
		items: [
			{
				name: 'This Type has been deleted',
				description: 'If you want to keep using this Object, change this Object Type.',
				param: {
					element: '#block-featuredRelations',
					offsetY: 10,
				}
			},
		],
	},

	sourceDeleted: {
		items: [
			{
				name: 'Please check your Installed Types & Relations',
				description: 'Some Objects in this Set use Types or Relations that have been removed from your Space. Visit the Marketplace to re-install these entities and continue using your Set.',
				param: {
					element: '#block-featuredRelations',
					offsetY: 10,
				}
			},
		],
	},

	inlineSet: {
		items: [
			{
				name: 'This is inline set',
				description: 'Congratulations! You can embed a set or collection and modify it using filters and views without altering the original instance.',
				param: {
					element: '#head-title-wrapper #value',
					offsetY: 10,
				}
			},
			{
				name: 'Views',
				description: 'Adjust rules and views to suit the current context.',
				param: {
					element: '#dataviewControls #sideLeft',
					offsetY: 10,
				}
			},
		],
	},

}
