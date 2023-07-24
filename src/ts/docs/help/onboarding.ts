import { I } from 'Lib';

export default {
    mainGraph: {
        category: 'Onboarding',
        items: [
            {
                description: `
					<p><b>Welcome to your Anytype Space.</b> Space is a graph of interconnected objects, providing a natural way to organize information.</p>
					<p>To access your Homepage, click on its icon in the graph or the <span class="highlight">Next</span> button.</p>
				`,
                video: './img/help/onboarding/space.mp4',
                noButton: true,
                buttons: [
                    { text: 'Next', action: 'dashboard' },
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
					<p>Filter and adjust objects by any relation, such as today's notes (filter by date) or project documents (filter by project).</p>
				`,
                buttonText: 'Great! I will try',
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
    },

    storeType: {
        category: 'Library',
        items: [
            {
                description: `
					<p>
						<b>This Library contains all types of objects and relations.</b> It comes with preinstalled types, as well as types that can be uploaded to Anytype for different use cases.
					</p>
				`,
                video: './img/help/onboarding/library-1-add-type.mp4',
            },
            {
                description: `
					<p>
						<b>You can create your own types with any object layout for your own purposes.</b> Additionally, you can save any existing object as a Library template if you need to use it frequently.
					</p>
					<p>Now, let’s take a look at the Relations menu.</p>
				`,
                video: './img/help/onboarding/library-2-new-type.mp4',
                buttonText: 'Ok',
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
    },

    storeRelation: {
        category: 'Library',
        items: [
            {
                description: `
					<p>
						<b>Relations are reusable links with meaning.</b> Here you can see some examples of relations, but the idea is that you can create your own relations which are valuable to you and connect the objects through them.
					</p>
				`,
                video: './img/help/onboarding/library-3-relation.mp4',
                buttonText: 'Go ahead',
            },
            {
                description: `
					<p>
						<b>Establishing relations helps you to understand the graph</b> and its structure better. You can also create collections or sets based on the relationships for quick access.
					</p>
				`,
                buttonText: 'Great!',
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
    },

    dashboard: {
        category: 'Onboarding',
        showConfetti: true,
        items: [
            {
                description: `
					<p>
						<b>Welcome to your Homepage.</b> This is your personalized page, which you can customize to your liking.<br />
						We've included some materials to help you get started, but feel free to make adjustments as needed.
					</p>
					<p>Let's take a few minutes to explore the features together.</p>
				`,
                video: './img/help/onboarding/homepage.mp4',
            },
            {
                description: `
					<p><b>Sets, acting as filters for your objects</b>, are featured on your Homepage.</p>
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
					element: '.dataviewHead #value',
					offsetY: 32,
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

	inlineCollection: {
		items: [
			{
				name: 'This is inline collection',
				description: 'Congratulations! You can embed a set or collection and modify it using filters and views without altering the original instance.',
				param: {
					element: '.dataviewHead #value',
					offsetY: 36,
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
