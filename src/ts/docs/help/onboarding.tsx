import { I } from 'ts/lib';

const Constant = require('json/constant.json');

export default {
    mainIndex: [
        {
            name: 'Welcome onboard!',
            description: 'A few tips to understand the basics of Anytype. Use ← → keybord arrows to switch faster',
            param: {
                element: '#title .side.left span',
                offsetY: 10,
            }
        },
        {
            name: 'Tabs',
            description: 'Contains your favorite objects, browsing history, all Sets and items in the Bin',
            param: {
                element: '#tabWrap .tabs',
                vertical: I.MenuDirection.Top,
                horizontal: I.MenuDirection.Center,
                offsetY: -10,
            }
        },
        {
            name: 'Need help?',
            description: 'Docs, Feedback, Shortcuts and other useful information',
            param: {
                element: '#footer #button-help',
                vertical: I.MenuDirection.Top,
                horizontal: I.MenuDirection.Right,
                offsetY: -14,
            }
        },
        {
            name: 'Settings',
            description: 'Keychain phrase, Dark theme, import, export and many more',
            param: {
                element: '#header .icon.settings',
                classNameWrap: 'fixed fromHeader',
                horizontal: I.MenuDirection.Right,
                offsetY: 14,
            }
        },
        {
            name: 'Search',
            description: 'Works within all objects and content in Anytype',
            param: {
                element: '#header .side.center',
                classNameWrap: 'fromHeader',
                horizontal: I.MenuDirection.Center,
                offsetY: 16,
            }
        },
        {
            name: 'Library',
            description: 'A place to manage your Types, Templates and Relations',
            param: {
                horizontal: I.MenuDirection.Center,
                offsetY: 18,
                element: '#button-store',
            }
        },
        {
            name: 'Create an object',
            description: 'Note, Task and other Types available. Capture thoughts and ideas when inspiration hits',
            param: {
                element: '#title #button-add',
                horizontal: I.MenuDirection.Center,
                offsetY: 18,
            }
        }
    ],

    mainIndexReminder: [
        {
            name: 'You can restart hints later',
            description: 'Click <img class="icon" src="./img/icon/help.svg" /> → "Show Hints" to go through onboarding at any time',
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
            name: 'Meet the Type',
            description: 'Types bring definition to your objects. Choose Layout, Template, and Relations for each object of this Type. <br/><a href="https://doc.anytype.io/d/fundamentals/type">Click for more information</a>',
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
            name: 'Navigation Panel',
            description: 'Navigate using bi-directional connections to or from the current object',
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
            name: 'Graph view',
            description: 'Displays a graph representation of Links and Relations between your objects',
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
            name: 'Manage multiple objects in Set',
            description: 'Collect all objects by specific criteria: same type and relation. Sets don\'t store objects. <br/><a href="https://doc.anytype.io/d/fundamentals/set">Click for more information</a>',
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
            name: 'Add View',
            description: 'Save specific filters and sorts for your workflow. Display them in the most suitable view',
            param: {
                element: '.dataviewControls #sideLeft span',
                offsetY: 10,
            }
        },
        {
            name: 'Source',
              description: 'Source contains criteria for collection. You can click on it and change result at anytime',
            param: {
                element: '#blockFeatured-setOf-0',
                offsetY: 10,
            }
        },
        {
            name: 'Set it up',
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
            description: 'Sample object that has blocks, styles, relation values in place. <br/><a href="https://doc.anytype.io/d/fundamentals/type/template">Click for more information</a>',
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
            name: 'This is object',
            description: 'Write text, add media blocks, and manage object’s relations',
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
            name: 'Navigation bar',
            description: 'You can open Home, go back and forward in “browsing” history. Use navigation, graph and search',
            param: {
                element: '#header .side.left',
                offsetY: 10,
                classNameWrap: 'fixed fromHeader',
            }
        },
        {
            name: 'Object’s Relations',
            description: 'Here you can find the list of all relations coming from this object and some suggested from Type and Sets',
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
            description: 'You can change Type and feature any other relations here. Click “Relations” above for management',
            param: {
                element: '#block-featuredRelations #blockFeatured-type-0',
                offsetY: 10,
            }
        },
    ],

    storeType: [
        {
            name: 'Library',
            description: 'Use it to create and manage Types, Templates and Relations. <br/><a href="https://doc.anytype.io/d/features/library">Click for more information</a>',
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
            description: 'Use Relations and add significance for connections between objects. They provide name, direction and format of values. They can be applied to every object. <br/><a href="https://doc.anytype.io/d/fundamentals/relation">Click for more information</a>',
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
            name: 'Choose a Type to start from',
            description: 'Types bring meaning to your objects. They manage Relations and define the look provided by Templates',
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
