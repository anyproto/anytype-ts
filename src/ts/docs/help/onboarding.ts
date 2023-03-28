import { I } from 'Lib';

export default {
    wizardDashboard: {
        category: 'Dashboard',
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
                video: './img/help/31/1-inline-set.mp4'
            },
            {
                description: `
					<p>On the Dashboard page, you'll find <b>Sets, which act as filters for your objects</b> with various viewing options.</p>
					<p>Sets make it easy to navigate and collect specific objects, such as notes, links, tasks, ideas, and more.</p>
					<p>To access different Set views, simply select them.</p>
                `
            },
            {
                description: `
					<p><b>Objects in Anytype</b> have specific types depending on their purpose. You can use system types or define custom ones. Structure objects with relations and links.</p>
					<p>To add an object to a set, click the <span class="highlight">New</span> button and view its relation as properties in columns.</p>
                `
            },
            {
                description: `
					<p><b>You'll find the Sidebar on the left.</b> It's a navigation tool that you can customize with multiple widget types.</p>
					<p>Change the widget appearance and see what looks best. Make your Favorites as a Tree Widget.</p>
                `
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
			offsetY: -4,
		},
    },

    editor: {
        category: 'Editor',
        items: [
			{
                name: 'Connect your Objects',
                description: `Use the <span class="highlight">@</span> key to reference other Objects as you're writing.`,
                param: {
                    element: '#block-featuredRelations #blockFeatured-type-0',
                    offsetY: 10,
                }
            },
            {
                name: 'Did you know?',
                description: `You can drag &amp; drop files from your computer into the editor window to create new blocks. Give it a try!`,
                param: {
                    element: '#block-featuredRelations #blockFeatured-type-0',
                    offsetY: 10,
                }
            },
            {
                name: 'See your Graph grow',
                description: 'Click above to see how your new Objects are linked',
                param: {
                    element: '#header .side.left .icon.graph',
                    offsetY: 10,
                    classNameWrap: 'fixed fromHeader',
                }
            },
			{
                name: `Like what you're working on?`,
                description: 'Save this format for future use by selecting Save as Template from the three-dots menu',
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
					element: '#block-featuredRelations #blockFeatured-type-0',
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
					element: '#block-featuredRelations #blockFeatured-setOf-0',
					offsetY: 10,
				}
			},
		],
	},

	inlineSet: {
		items: [
			{
				name: 'This is inline set',
				description: 'Set query and name are synced with the source set you selected. You can change source by clicking on the set name.',
				param: {
					element: '#head-title-wrapper #value',
					offsetY: 10,
				}
			},
			{
				name: 'Views',
				description: 'Views are not synced, but copied. You can tweak them to the needs of your current context. No worries, source set will not be affected.',
				param: {
					element: '.dataviewControls #sideLeft',
					offsetY: 10,
				}
			},
		],
	},

}
