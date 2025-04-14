import { MenuDirection } from './menu';

export * from './account';
export * from './space';
export * from './animation';
export * from './common';
export * from './progress';
export * from './popup';
export * from './preview';
export * from './menu';
export * from './object';
export * from './restriction';
export * from './notification';
export * from './payment';
export * from './history';
export * from './syncStatus';
export * from './publish';

export * from './block';
export * from './block/dataview';
export * from './block/layout';
export * from './block/link';
export * from './block/text';
export * from './block/file';
export * from './block/bookmark';
export * from './block/div';
export * from './block/relation';
export * from './block/embed';
export * from './block/table';
export * from './block/widget';
export * from './block/chat';

export interface TooltipParam {
    text: string;
    element: any;
    typeX: MenuDirection.Left | MenuDirection.Center | MenuDirection.Right;
    typeY: MenuDirection.Top | MenuDirection.Center | MenuDirection.Bottom;
    offsetX: number;
    offsetY: number;
    delay: number;
    className?: string;
    title?: string;
}