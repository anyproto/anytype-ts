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
                ],
                forceButtons: [
                    { text: 'Close', action: 'close' }
                ],
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

    mainSet: {
        category: 'Set & Collection',
        items: [
            {
                description: `
					<p>
						<b>Anytype has two basic formats: Sets and Collections.</b> As in computer science, a Set is a data structure that contains only unique elements, while a Collection is any group of objects that are stored together. You can convert any set into a collection, but not the other way around.
					</p>
				`,
                video: './img/help/onboarding/set-1-to-collection.mp4',
            },
            {
                description: `
					<p>
						<b>Sets</b> contain no duplicates and can be used to filter specific objects or relation types, such as all my bookmarks. <b>Collections</b>, however, can contain duplicates and are used for more general-purpose data storage; they can store anything.
					</p>
				`,
                video: './img/help/onboarding/set-2-new-object.mp4',
            },
            {
                description: `
					<p>
						<b>View sets or collections as an entire object, or place them inline in documents.</b> The first column will contain the collecting objects, and the others will show their relations.
					</p>
					<p>Filter and adjust objects by any relation, such as today’s notes (filter by date) or project documents (filter by project).</p>
				`,
                buttonText: 'Great! I will try',
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
            offsetY: -4
        },
    },

    objectCreationStart: {
        category: 'Creating objects',
        items: [
            {
                description: `
					<p>
						<b>Let’s create an object from scratch.</b> The default object type is now ‘Note’, meaning that each new object is referred to as a Note unless you choose a different type. You can change the default object type anytime in the settings menu.
					</p>
				`,
                video: './img/help/onboarding/object-1-default-object-type.mp4',
            },
            {
                description: `
					<p>
						<b>Choose here from the most popular object types</b>, such as Page, Task, or Collection. You can also select an object from the Type menu, which shows all object types installed from the Library.
					</p>
				`,
                video: './img/help/onboarding/object-2-type-menu.mp4',
                buttonText: 'I got it!',
            },
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

    objectCreationFinish: {
        category: 'Creating objects',
        items: [
            {
                description: `
					<p>
						<b>For the object you created, you can adjust it using the top menu.</b> Change the cover, layout, or set up a relations to build the graph.
					</p>
				`,
                video: './img/help/onboarding/object-layout.mp4',
                buttonText: 'Ok! I like it',
            },
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
                description: `Use the <span class="highlight">@</span> key to reference other Objects as you're writing.`,
                param: {
                    element: '#block-featuredRelations',
                    offsetY: 10,
                }
            },
            {
                name: 'Did you know?',
                description: `You can drag &amp; drop files from your computer into the editor window to create new blocks. Give it a try!`,
                param: {
                    element: '#block-featuredRelations',
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
