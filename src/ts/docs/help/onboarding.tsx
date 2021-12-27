import { I } from 'ts/lib';

export default {
    'main/index': [
        {
            element: '#title .side.left span',
            name: 'Welcome onboard!',
            description: 'Here is a few tips to understand the basics of Anytype',
            offsetY: 10,
        },
        {
            element: '#tabWrap .tabs',
            name: 'Tabs',
            description: 'Contains your favorite objects and others matching some criteria',
            vertical: I.MenuDirection.Top,
            horizontal: I.MenuDirection.Center,
            offsetY: -10,
        },
        {
            element: '#button-help',
            name: 'Need help?',
            description: 'Docs, Feedback, Shortcuts are here',
            vertical: I.MenuDirection.Top,
            horizontal: I.MenuDirection.Right,
            offsetY: -14,
        },
        {
            element: '#header .icon.settings',
            name: 'Settings',
            description: 'Keychain phrase, themes, import and export are here',
            horizontal: I.MenuDirection.Right,
            offsetY: 14,
            classNameWrap: 'fromHeader',
        },
        {
            element: '#header .side.center',
            name: 'Search',
            description: 'Works with all objects and content available in Anytype',
            horizontal: I.MenuDirection.Center,
            offsetY: 16,
            classNameWrap: 'fromHeader',
        },
        {
            element: '#button-store',
            name: 'Library',
            description: 'Use it to create and manage Types, Templates and Relations',
            horizontal: I.MenuDirection.Center,
            offsetY: 18,
        },
        {
            element: '#button-add',
            name: 'Create an object',
            description: 'Note, Task and other Types available. Capture thoughts and ideas when inspiration hits',
            horizontal: I.MenuDirection.Center,
            offsetY: 18,
        }
    ]
}