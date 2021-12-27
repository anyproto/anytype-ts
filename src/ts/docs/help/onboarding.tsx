import { I } from 'ts/lib';

export default {
    'main/index': [
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
                classNameWrap: 'fromHeader',
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

    'main/type': [
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

    'main/navigation': [
        {
            name: 'Navigation Panel',
            description: 'Use a bi-directional connections to navigate up and down from the current opened object.',
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

    'set': [

    ],

    'storeType': [
        {
            name: 'Library',
            description: 'Use it to create and manage Types, Templates and Relations.<br/><a href="#">Click for more information</a>',
            param: {
                common: {
                    container: true,
                    horizontal: I.MenuDirection.Left,
                    offsetX: 8,
                    offsetY: 8,
                },
                popup: {
                    classNameWrap: 'fromPopup',
                }
            }
        }
    ],

    'storeRelation': [
        {
            name: 'Relations',
            description: 'Use Relations to add significance to connections between objects. They provide name, direction and type of values. They can be applied to every object.<br/><a href="#">Click for more information</a>',
            param: {
                common: {
                    container: true,
                    horizontal: I.MenuDirection.Left,
                    offsetX: 8,
                    offsetY: 8,
                },
                popup: {
                    classNameWrap: 'fromPopup',
                }
            }
        }
    ],

    'typeSelect': [
        {
            name: 'Choose a Type to start from',
            description: 'Types bring meaning to your objects. They manage relations and define the look provided by templates',
            param: {
                common: {
                    container: true,
                    containerVertical: I.MenuDirection.Top,
                    horizontal: I.MenuDirection.Center,
                    offsetY: 8,
                },
                popup: {
                    classNameWrap: 'fromPopup',
                }
            }
        }
    ],
}