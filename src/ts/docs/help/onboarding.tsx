import { I } from 'ts/lib';

const Constant = require('json/constant.json');

export default {
    mainIndex: [
        {
            name: 'Welcome aboard!',
            description: 'Here are some tips to help you get started with Anytype. Use the ← → keys to navigate between these',
            param: {
                element: '#title .side.left span',
                offsetY: 10,
            }
        },
        {
            name: 'Tabs',
            description: 'Contain your favourite objects, recently-used objects, your Sets, and objects you plan to delete',
            param: {
                element: '#tabWrap .tabs',
                vertical: I.MenuDirection.Top,
                horizontal: I.MenuDirection.Center,
                offsetY: -20,
            }
        },
        {
            name: 'Settings',
            description: 'See your recovery phrase, switch to dark mode, import/export, and much more...',
            param: {
                element: '#header .icon.settings',
                classNameWrap: 'fixed fromHeader',
                horizontal: I.MenuDirection.Right,
                offsetY: 14,
            }
        },
        {
            name: 'Search',
            description: 'Easily find objects by searching for their name, contents, or even their relations',
            param: {
                element: '#header .side.center',
                classNameWrap: 'fromHeader',
                horizontal: I.MenuDirection.Center,
                offsetY: 16,
            }
        },
        {
            name: 'Library',
            description: 'A place to discover and manage your Types, Templates and Relations',
            param: {
                horizontal: I.MenuDirection.Center,
                offsetY: 18,
                element: '#button-store',
            }
        },
        {
            name: 'Create a new object',
            description: 'Choose from Types including Notes and Tasks. Capture thoughts and ideas when inspiration hits',
            param: {
                element: '#title #button-add',
                horizontal: I.MenuDirection.Center,
                offsetY: 18,
            }
        },
        {
            name: 'Want to learn more?',
            description: 'Here you will find links to our docs, handy shortcuts, and an easy way to submit feedback',
            param: {
                element: '#footer #button-help',
                vertical: I.MenuDirection.Top,
                horizontal: I.MenuDirection.Right,
                offsetY: -14,
            }
        }
    ],

    mainIndexReminder: [
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
    ],

    mainType: [
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
    ],

    mainNavigation: [
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
    ],

    mainGraph: [
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
    ],

    set: [
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
                element: '.dataviewControls #sideLeft span',
                offsetY: 10,
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
                element: '.dataviewControls #button-manager',
                vertical: I.MenuDirection.Top,
                horizontal: I.MenuDirection.Right,
                offsetY: -18,
            }
        }
    ],

    template: [
        {
            name: 'Template',
            description: 'Sample objects which have blocks, styles, and relations in-place. <br/><a href="https://doc.anytype.io/d/fundamentals/type/template">Learn more...</a>',
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
    ],

    editor: [
        {
            name: 'This is an object',
            description: 'Write text, add media blocks, and manage your object’s relations',
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
            name: 'Navigation',
            description: 'You can go Home and navigate back/forward in your "browsing" history. Here you will find navigation, graph and search',
            param: {
                element: '#header .side.left',
                offsetY: 10,
                classNameWrap: 'fixed fromHeader',
            }
        },
        {
            name: 'Relations',
            description: 'Here you‘ll see all the relations for this object. They are coming along with suggested relations based on the object Type and related Sets',
            param: {
                element: '.editorControlElements #button-relation',
                offsetY: 10,
                onClose: () => { $('.editorControlElements').removeClass('active'); },
                data: {
                    onShow: () => {
                        $('.editorControlElements').addClass('active');
                    }
                },
            }
        },
        {
            name: 'Featured relations',
            description: 'You can change Type and show any other relations here. Click “Relations” above and click ☆ on the right',
            param: {
                element: '#block-featuredRelations #blockFeatured-type-0',
                offsetY: 10,
            }
        },
    ],

    storeType: [
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
    ],

    storeRelation: [
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
    ],

    typeSelect: [
        {
            name: 'Choose a Type for Object',
            description: 'Types define objects through layouts, templates, and relations. You have Note by default',
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
    ],
}
