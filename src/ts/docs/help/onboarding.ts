import { I } from 'Lib';

export default {
    wizardDashboard: {
        category: 'Dashboard',
        isWizard: true,
        items: [
            {
                description: `
					<div class="paragraph">
					<b>Welcome to your Dashboard.</b> This is your personalized page, which you can customize to your liking.
					<br />
					We've included some materials to help you get started, but feel free to make adjustments as needed.
					</div>
					<div class="paragraph">
					Let's take a few minutes to explore the features together.
					</div>
				`,
                video: './img/help/31/1-inline-set.mp4'
            },
            {
                description: `
					<div class="paragraph">
                    On the Dashboard page, you'll find <b>Sets, which act as filters for your objects</b> with various viewing options.
                    </div>
					<div class="paragraph">
                    Sets make it easy to navigate and collect specific objects, such as notes, links, tasks, ideas, and more.
                    </div>
					<div class="paragraph">
                    To access different Set views, simply select them.
                    </div>
                `
            },
            {
                description: `
					<div class="paragraph">
                    <b>Objects in Anytype</b> have specific types depending on their purpose. You can use system types or define custom ones. Structure objects with relations and links.
                    </div>
					<div class="paragraph">
                    To add an object to a set, click the <span class="highlight">New</span> button and view its relation as properties in columns.
                    </div>
                `
            },
            {
                description: `
					<div class="paragraph">
                    <b>You'll find the Sidebar on the left.</b> It's a navigation tool that you can customize with multiple widget types.
                    </div>
					<div class="paragraph">
                    Change the widget appearance and see what looks best. Make your Favorites as a Tree Widget.
                    </div>
                `
            },
            {
                description: `
					<div class="paragraph">
                    <b>Great job!</b> You have completed this section. Feel free to explore other menus in the interface, such as Library and Sets.
                    </div>
					<div class="paragraph">
                    If you have any questions, don't hesitate to press the <span class="highlight">?</span> button.
                    </div>
					<div class="paragraph">
                    To continue working on your project where you left off, you can import your data and make it your own.
                    </div>
                `,
                buttons: [
                    { text: 'Import', action: 'import' }
                ]
            }
        ]
    },
    mainIndex: {
        category: 'Dashboard',
        items: [
            {
                name: 'Welcome aboard!',
                description: 'Here are some tips to help you get started with Anytype. Use your arrow keys to navigate from one to the next.',
                param: {
                    element: '#title .side.left span',
                    offsetY: 10,
                }
            },
            {
                name: 'Make yourself at Home',
                description: 'Choose your wallpaper, play with light or dark settings, and spellcheck language.',
                param: {
                    element: '#header .icon.settings',
                    classNameWrap: 'fixed fromHeader',
                    horizontal: I.MenuDirection.Right,
                    offsetY: 14,
                }
            },
			{
                name: 'Never miss an update',
                description: 'Check this menu for the latest release notes and tooltips to help you on your Anytype journey.',
                param: {
                    element: '#footer #button-help',
                    vertical: I.MenuDirection.Top,
                    horizontal: I.MenuDirection.Right,
                    offsetY: -14,
                }
            },
            {
                name: 'Create your first Object',
                description: 'Hit the plus button or <span class="highlight">⌘ + N</span> to create a new Object. If you get stuck, check the Get Started and Advanced pages below.',
                param: {
                    element: '#title #button-add',
                    horizontal: I.MenuDirection.Center,
                    offsetY: 18,
                }
            },
        ]
    },

    mainIndexReminder: {
        items: [
            {
                name: 'Want to see these again?',
                description: 'Click <img class="icon" src="./img/icon/help.svg" /> → "Show Hints" to view these any time',
                param: {
                    element: '#footer #button-help',
                    horizontal: I.MenuDirection.Right,
                    vertical: I.MenuDirection.Top,
                    offsetY: -10,
                }
            },
        ]
    },

    mainType: {
        category: 'Types',
        items: [
            {
                name: 'Meet Types',
                description: 'Types define objects through layouts, templates, and relations. <br/><a href="https://doc.anytype.io/d/fundamentals/type">Click for more information</a>',
                param: {
                    common: {
                        container: true,
                        containerVertical: I.MenuDirection.Center,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Center,
                        vertical: I.MenuDirection.Center,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            }
        ]
    },

    mainNavigation: {
        category: 'Navigation',
        items: [
            {
                name: 'Navigation',
                description: 'Navigate between objects by seeing the bi-directional connections which link to, or from, the current object',
                param: {
                    common: {
                        container: true,
                        containerVertical: I.MenuDirection.Center,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Center,
                        vertical: I.MenuDirection.Center,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            }
        ]
    },

    mainGraph: {
        category: 'Graph',
        items: [
            {
                name: 'Graph View',
                description: 'Visualise and navigate own "digital brain" of the links and relations which connect your objects',
                param: {
                    common: {
                        container: true,
                        containerVertical: I.MenuDirection.Center,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Center,
                        vertical: I.MenuDirection.Center,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            }
        ]
    },

    set: {
        category: 'Sets',
        items: [
            {
                name: 'Meet Sets',
                description: 'Work with multiple objects and relations at once! Sets collect all the objects of the same Type. They show, not store, all objects which meet this specific criterion. <br/><a href="https://doc.anytype.io/d/fundamentals/set">Learn more...</a>',
                param: {
                    common: {
                        container: true,
                        containerVertical: I.MenuDirection.Center,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Center,
                        vertical: I.MenuDirection.Center,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            },
            {
                name: 'View',
                description: 'Save specific filters and sorts for your workflow. Display them in one of several representations including List, Gallery, and Grid',
                param: {
                    element: '.dataviewControls #sideLeft .viewSelect',
                    horizontal: I.MenuDirection.Left,
                    vertical: I.MenuDirection.Top,
                    offsetY: -18,
                }
            },
            {
                name: 'Source',
                description: 'Source contains matching criteria for objects coming into Set. Click here to change the Source at any time',
                param: {
                    element: '#blockFeatured-setOf-0',
                    offsetY: 10,
                }
            },
            {
                name: 'Set it up!',
                description: 'Manage Filters, Sorts, Relations with columns',
                param: {
                    element: '.dataviewControls #sideRight .sort',
                    vertical: I.MenuDirection.Top,
                    horizontal: I.MenuDirection.Right,
                    offsetY: -18,
                }
            }
        ]
    },

    template: {
        category: 'Templates',
        items: [
            {
                name: 'Template',
                description: 'Sample objects which have blocks, styles, and relations in-place. <br/><a href="https://doc.anytype.io/d/fundamentals/type/template">Learn more...</a>',
                param: {
                    common: {
                        container: true,
                        containerVertical: I.MenuDirection.Center,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Center,
                        vertical: I.MenuDirection.Center,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            }
        ]
    },

    editor: {
        category: 'Editor',
        items: [
			{
                name: 'Welcome to your first object',
                description: 'Type <span class="highlight">/</span> to explore all of our different block types.',
                param: {
                    element: '#block-featuredRelations #blockFeatured-type-0',
                    offsetY: 10,
                }
            },
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

    storeType: {
        category: 'Library',
        items: [
            {
                name: 'Library',
                description: 'Use it to create and manage Types, Templates and Relations. <br/><a href="https://doc.anytype.io/d/features/library">Learn more...</a>',
                param: {
                    common: {
                        container: true,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Left,
                        offsetX: 8,
                        offsetY: 8,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            }
        ]
    },

    storeRelation: {
        category: 'Relations',
        items: [
            {
                name: 'Relations',
                description: 'Use Relation to draw connections and add values to objects. They provide name, direction, and format of the values like Text, Tag, or Object and can be used everywhere. <br/><a href="https://doc.anytype.io/d/fundamentals/relation">Learn more...</a>',
                param: {
                    common: {
                        container: true,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Left,
                        offsetX: 8,
                        offsetY: 8,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            }
        ]
    },

	typeSelect: {
        items: [
            {
                name: 'Give this Object a Type',
                description: 'Types define objects through layouts, templates, and relations. Select one from the dropdown - you can always change it later.',
                param: {
                    common: {
                        container: true,
                        containerVertical: I.MenuDirection.Top,
                        classNameWrap: 'fixed',
                        horizontal: I.MenuDirection.Center,
                        offsetY: 8,
                    },
                    popup: {
                        classNameWrap: 'fixed fromPopup',
                    }
                }
            }
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
