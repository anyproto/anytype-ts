import { I } from 'ts/lib';

const Constant = require('json/constant.json');

export default {
    mainIndex: [
        {
            name: 'Welcome onboard!',
            description: 'Here is a few tips to understand the basics of Anytype',
            param: {
                element: '#title .side.left span',
                offsetY: 10,
            }
        },
        {
            name: 'Tabs',
            description: 'Contains your favorite objects and others matching some criteria',
            param: {
                element: '#tabWrap .tabs',
                vertical: I.MenuDirection.Top,
                horizontal: I.MenuDirection.Center,
                offsetY: -10,
            }
        },
        {
            name: 'Need help?',
            description: 'Docs, Feedback, Shortcuts are here',
            param: {
                element: '#button-help',
                vertical: I.MenuDirection.Top,
                horizontal: I.MenuDirection.Right,
                offsetY: -14,
            }
        },
        {
            name: 'Settings',
            description: 'Keychain phrase, themes, import and export are here',
            param: {
                element: '#header .icon.settings',
                classNameWrap: 'fixed fromHeader',
                horizontal: I.MenuDirection.Right,
                offsetY: 14,
            }
        },
        {
            name: 'Search',
            description: 'Works with all objects and content available in Anytype',
            param: {
                element: '#header .side.center',
                classNameWrap: 'fromHeader',
                horizontal: I.MenuDirection.Center,
                offsetY: 16,
            }
        },
        {
            name: 'Library',
            description: 'Use it to create and manage Types, Templates and Relations',
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
                element: '#button-add',
                horizontal: I.MenuDirection.Center,
                offsetY: 18,
            }
        }
    ],

    mainType: [
        {
            name: 'Meet the Type',
            description: 'Types bring definition to your objects. Here you can manage layout, templates, and relations.<br/><a href="#">Click for more information</a>',
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
            description: 'Use a bi-directional connections to navigate up and down from the current opened object',
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
            description: 'Here are all objects which meet a specific criteria: same type and relation. Sets don\'t store objects.<br/><a href="#">Click for more information</a>',
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
            description: 'Show objects in Grid, List and Gallery views. Use separate filters and sorts for different workflows',
            param: {
                element: '.dataviewControls #sideLeft span',
                offsetY: 10,
            }
        },
        {
            name: 'Set it up',
            description: 'Manage Filters, Sorts, Relations and columns here',
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
            description: 'Set up blocks, their styles and structure on canvas, save relations with values.<br/><a href="#">Click for more information</a>',
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
            description: 'You can write text, use blocks to create media, change Type, and manage objects specific relations',
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
                element: '#header .side.left .icon.home.big',
                offsetY: 10,
                classNameWrap: 'fixed fromHeader',
            }
        },
        {
            name: 'Object’s Relations',
            description: 'Here you can find the list of all relations coming from this object and some suggested from Type and Sets',
            param: {
                element: '.editorControls #button-relation',
                offsetY: 10,
                onClose: () => {
                    $('.editorControls').removeClass('active');
                },
                data: {
                    onShow: () => {
                        $('.editorControls').addClass('active');
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
            description: 'Use it to create and manage Types, Templates and Relations.<br/><a href="#">Click for more information</a>',
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
            description: 'Use Relations to add significance to connections between objects. They provide name, direction and type of values. They can be applied to every object.<br/><a href="#">Click for more information</a>',
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
            description: 'Types bring meaning to your objects. They manage relations and define the look provided by templates',
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