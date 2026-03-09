export type AnytypeRelationType = 'text' | 'number' | 'tag_single' | 'tag_multi' | 'date' | 'checkbox' | 'url' | 'email' | 'phone' | 'file' | 'object';
export type AnytypeBlockType = 'text' | 'header1' | 'header2' | 'header3' | 'bullet' | 'numbered' | 'checkbox' | 'toggle' | 'code' | 'quote' | 'callout' | 'divider' | 'image' | 'video' | 'audio' | 'file' | 'bookmark' | 'latex' | 'table' | 'tableRow' | 'link' | 'columns' | 'column' | 'toc';

export type NotionPropertyType = 'title' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone_number' | 'files' | 'relation' | 'status' | 'formula' | 'rollup' | 'created_time' | 'last_edited_time' | 'created_by' | 'last_edited_by' | 'people' | 'unique_id' | 'verification';

export type NotionBlockType = 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'bulleted_list_item' | 'numbered_list_item' | 'to_do' | 'toggle' | 'code' | 'quote' | 'callout' | 'divider' | 'image' | 'video' | 'audio' | 'file' | 'pdf' | 'bookmark' | 'equation' | 'table' | 'table_row' | 'child_page' | 'child_database' | 'synced_block' | 'link_preview' | 'column_list' | 'column' | 'breadcrumb' | 'table_of_contents' | 'unsupported' | 'embed';

export const NOTION_PROPERTY_TYPE_MAP: Record<NotionPropertyType, AnytypeRelationType> = {
  title:            'text',
  rich_text:        'text',
  number:           'number',
  select:           'tag_single',
  multi_select:     'tag_multi',
  date:             'date',
  checkbox:         'checkbox',
  url:              'url',
  email:            'email',
  phone_number:     'phone',
  files:            'file',
  relation:         'object',
  status:           'tag_single',   // use status option colors
  formula:          'text',         // with _notion_formula marker
  rollup:           'text',         // with _notion_rollup marker
  created_time:     'date',
  last_edited_time: 'date',
  created_by:       'text',
  last_edited_by:   'text',
  people:           'text',
  unique_id:        'text',
  verification:     'text',
};

export const NOTION_BLOCK_TYPE_MAP: Record<NotionBlockType, AnytypeBlockType> = {
  paragraph:            'text',
  heading_1:            'header1',
  heading_2:            'header2',
  heading_3:            'header3',
  bulleted_list_item:   'bullet',
  numbered_list_item:   'numbered',
  to_do:                'checkbox',
  toggle:               'toggle',
  code:                 'code',
  quote:                'quote',
  callout:              'callout',
  divider:              'divider',
  image:                'image',
  video:                'video',
  audio:                'audio',
  file:                 'file',
  pdf:                  'file',
  bookmark:             'bookmark',
  equation:             'latex',
  table:                'table',
  table_row:            'tableRow',
  child_page:           'link',
  child_database:       'link',
  synced_block:         'link',
  link_preview:         'bookmark',
  column_list:          'columns',
  column:               'column',
  breadcrumb:           'text',   // render as plain text
  table_of_contents:    'toc',
  unsupported:          'text',   // render as '[unsupported block]'
  embed:                'bookmark',
};

export interface NotionRichTextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

export type NotionRichText = NotionRichTextText | NotionRichTextMention | NotionRichTextEquation;

export interface NotionRichTextBase {
  plain_text: string;
  href: string | null;
  annotations: NotionRichTextAnnotations;
}

export interface NotionRichTextText extends NotionRichTextBase {
  type: 'text';
  text: { content: string; link: { url: string } | null };
}

export interface NotionRichTextEquation extends NotionRichTextBase {
  type: 'equation';
  equation: { expression: string };
}

export interface NotionRichTextMention extends NotionRichTextBase {
  type: 'mention';
  mention: NotionMention;
}

export type NotionMention =
  | { type: 'page'; page: { id: string } }
  | { type: 'database'; database: { id: string } }
  | { type: 'date'; date: { start: string; end?: string; time_zone?: string } }
  | { type: 'user'; user: { id: string; name?: string } }
  | { type: 'link_preview'; link_preview: { url: string } }
  | { type: 'template_mention'; template_mention: { type: string; template_mention_date?: string; template_mention_user?: string } };

export type PageParent =
  | { type: 'database_id'; database_id: string }
  | { type: 'page_id'; page_id: string }
  | { type: 'workspace'; workspace: true }
  | { type: 'block_id'; block_id: string };

export type PropertyMap = Record<string, unknown>;

export interface NotionPage {
  _parsedBlocks?: any[];
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  parent: PageParent;
  archived: boolean;
  properties: PropertyMap;
  url: string;
}

export interface NotionDatabase {
  object: 'database';
  id: string;
  title: NotionRichText[];
  description: NotionRichText[];
  properties: PropertyMap;
}

export interface NotionBlock {
  object: 'block';
  id: string;
  parent: PageParent;
  type: NotionBlockType;
  has_children: boolean;
  [key: string]: unknown; // Strict base payload
}

export type AnytypeMarkType = 'bold' | 'italic' | 'strikethrough' | 'underline' | 'code' | 'color' | 'link' | 'date' | 'object';

export function mapNotionColor(notionColor: string): string {
  const map: Record<string, string> = {
    'default': '#37352f', // Neutral text color default
    'gray': '#787774',
    'brown': '#9F6B53',
    'orange': '#D9730D',
    'yellow': '#CB912F',
    'green': '#448361',
    'blue': '#337EA9',
    'purple': '#9065B0',
    'pink': '#C14C8A',
    'red': '#D44C47',
    'gray_background': '#F1F1EF',
    'brown_background': '#F4EEEE',
    'orange_background': '#FBECDD',
    'yellow_background': '#FBF3DB',
    'green_background': '#EDF3EC',
    'blue_background': '#E7F3F8',
    'purple_background': '#F6F3F9',
    'pink_background': '#FAF1F5',
    'red_background': '#FDEBEC',
  };
  return map[notionColor] || map['default'];
}
