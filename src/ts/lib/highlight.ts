import $ from 'jquery';
import {I, Storage} from 'Lib';
import {MenuDirection} from "Interface";

interface highlightParam {
    typeX: I.MenuDirection,
    typeY: I.MenuDirection,
    offsetX?: number,
    offsetY?: number
};

class Highlight {
    show (key: string, node: any, param: highlightParam) {
        const { typeX, typeY, offsetX, offsetY} = param;

        if (!Storage.get(key)) {
            return;
        };

        if (node.css('position') === 'static') {
            node.addClass('highlightWrap');
        };

        const dot = $('<div />').addClass('highlightMark');
        node.append(dot);

        const nW = node.outerWidth();
        const nH = node.outerHeight();
        const w = dot.outerWidth();

        let x = 0;
        let y = 0;
        let oX = offsetX || 0;
        let oY = offsetY || 0;

        switch (typeX) {
            default:
            case I.MenuDirection.Right:
                x = nW - w;
                break;
            case MenuDirection.Center:
                x = nW / 2 - w/2;
                break;
        };

        x += oX;

        switch (typeY) {
            default:
                y = 0;
                break;

            case MenuDirection.Center:
                console.log('HERE?')
                y= nH / 2 - w/2;
                break;

            case I.MenuDirection.Bottom:
                y = nH - w;
                break;
        };

        y += oY;

        dot.css({ left: x, top: y});
    };

    hide (node: any) {
        const el = node.find('.highlightMark');

        node.removeClass('highlightWrap');
        if (el) {
            el.remove();
        };
    };
};

export default new Highlight();