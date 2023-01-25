import $ from 'jquery';
import { Storage } from 'Lib';

const HIGHLIGHTS_MAP = {
    whatsNew: ['#button-help', '#menuHelp #item-whatsNew'],
    shortcut: ['#button-help', '#menuHelp #item-shortcut'],
    hints: ['#button-help', '#menuHelp #item-hints']
};

class Highlight {
    showAll () {
        const highlights = Storage.get('highlights') || {};

        Object.keys(highlights).forEach((el) => {
            if (highlights[el]) {
                this.show(el);
            };
        });
    };

    show (key: string) {
        const highlights = Storage.get('highlights') || {};

        if (!HIGHLIGHTS_MAP[key] || !highlights[key]) {
            return;
        };

        HIGHLIGHTS_MAP[key].forEach((e) => {
            $(e).each(this.add);
        });
    };

    hide (key: string) {
        const highlights = Storage.get('highlights');

        if (!HIGHLIGHTS_MAP[key] || !highlights[key]) {
            return;
        };

        highlights[key] = false;
        Storage.set('highlights', highlights);

        HIGHLIGHTS_MAP[key].forEach((e) => {
            $(e).each(this.remove);
        });
    };

    add (idx: number, node: any) {
        if ($(node).find('.highlightMark').length) {
            return;
        };

        const dot = $('<div />').addClass('highlightMark');

        $(node).append(dot);
    };

    remove (idx: number, node: any) {
        $(node).find('.highlightMark').remove();
    };
};

export default new Highlight();