import {commonStore, authStore, blockStore, detailStore, menuStore, popupStore} from 'Store';
import {UtilCommon} from 'Lib/index';

interface KeyboardShortcut {
    defaultShortcuts: string[];
    isFixedKeybind: boolean;
    description: string;
}

interface UserKeyboardShortcut {
    userSetShortcuts: string[];
    disabled?: boolean;
}

enum ShortcutActionConstants {
    ToggleSidebar = 'toggleSidebar',
    HistoryBack = 'historyBack',
    HistoryNext = 'historyNext',
    GoToLineStart = 'goToLineStart',
    GoToLineEnd = 'goToLineEnd',
    OpenShortcuts = 'openShortcuts',
    SwitchSpaces = 'switchSpaces',
    Print = 'print',
    SearchPane = 'searchPane',
    LibraryPane = 'libraryPane',
    TextSearch = 'textSearch',
    NavigationPane = 'navigationPane',
    GraphPane = 'graphPane',
    ReturnToHome = 'returnToHome',
    OpenSettings = 'openSettings',
    CreateRelation = 'createRelation',
    OpenStore = 'openStore',
    CreateNewPage = 'newPage',
    QuickCapture = 'quickCapture',
    LockUnlock = 'lockUnlock',
};

const isMac = UtilCommon.isPlatformMac();
const cmdKey = UtilCommon.isPlatformMac() ? 'cmd' : 'ctrl';

const ShortcutActionList: Record<string,KeyboardShortcut>= {
    'toggleSidebar': {
        defaultShortcuts: [`${cmdKey}+\\`, `${cmdKey}+.`],
        isFixedKeybind: false,
        description: 'Create a relation',

    },
    'historyBack': {
        defaultShortcuts: isMac ? ['cmd+['] : ['alt+arrowleft'],
        isFixedKeybind: false,
        description: 'Create a relation',
    },
    'historyNext': {
        defaultShortcuts: isMac ? ['cmd+]'] : ['alt+arrowright'],
        isFixedKeybind: false,
        description: 'Create a relation',
    },
    'goToLineStart': {
        defaultShortcuts:  [`${cmdKey}+arrowleft`] ,
        isFixedKeybind: true,
        description: 'Create a relation',

    },
    'goToLineEnd': {
        defaultShortcuts: [`${cmdKey}+arrowright`],
        isFixedKeybind: true,
        description: 'Create a relation',
    },
    'openShortcuts': {
        defaultShortcuts: ['ctrl+space'],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'switchSpaces': {
        defaultShortcuts: ['ctrl+tab'],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'print': {
        defaultShortcuts: [`${cmdKey}+p`],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'searchPane': {
        defaultShortcuts: [`${cmdKey}+k, ${cmdKey}+s`],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'libraryPane': {
        defaultShortcuts: [`${cmdKey}+l`],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'textSearch': {
        defaultShortcuts: [`${cmdKey}+f`],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'navigationPane': {
        defaultShortcuts: [`${cmdKey}+o`],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'graphPane': {
        defaultShortcuts: [`${cmdKey}+alt+o`],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'returnHomeScreen': {
        defaultShortcuts: ['alt+h'],
        isFixedKeybind: false,
        description: 'Open shortcuts popup',
    },
    'openSettings': {
        defaultShortcuts: [`${cmdKey}+comma`],
        isFixedKeybind: false,
        description: 'Open settings',
    },
    'createRelation': {
        defaultShortcuts: [`${cmdKey}+shift+r`],
        isFixedKeybind: false,
        description: 'Create a relation',
    },
    'openStore': {
        defaultShortcuts: [`${cmdKey}+alt+l`],
        isFixedKeybind: false,
        description: 'Create a relation',
    },
    'newPage': {
        defaultShortcuts: [`${cmdKey}+n`],
        isFixedKeybind: false,
        description: 'Create a relation',
    },
    'quickCapture': {
        defaultShortcuts: [`${cmdKey}+alt+n`],
        isFixedKeybind: false,
        description: 'Create a relation',
    },
    'lockUnlock': {
        defaultShortcuts: ['ctrl+shift+l'],
        isFixedKeybind: false,
        description: 'Create a relation',
    },
};

export {KeyboardShortcut, UserKeyboardShortcut, ShortcutActionConstants, ShortcutActionList};
