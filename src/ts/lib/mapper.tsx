import { I, Decode, Util } from 'ts/lib';

const Model = require('lib/vendor/github.com/anytypeio/go-anytype-library/pb/model/protos/models_pb.js');
const ContentCase = Model.Block.ContentCase;

const Mapper = {

    From: {

        Account: (obj: any) => {
            return {
                id: obj.getId(),
            };
        },
        
        PageInfo: (obj: any) => {
            return {
                id: obj.getId(),
                details: Decode.decodeStruct(obj.getDetails()),
                snippet: obj.getSnippet(),
                state: obj.getState(),
                lastOpened: obj.getLastopened(),
                hasInboundLinks: obj.getHasinboundlinks(),
            };
        },

        Range: (obj: any) => {
            return {
                from: obj.getFrom(),
                to: obj.getTo(),
            };
        },

        Mark: (obj: any) => {
            return {
                type: obj.getType(),
                param: obj.getParam(),
                range: Mapper.From.Range(obj.getRange()),
            };
        },

        BlockType: (v: number): I.BlockType => {
            let t = I.BlockType.Empty;
            if (v == ContentCase.SMARTBLOCK) t = I.BlockType.Page;
            if (v == ContentCase.TEXT)		 t = I.BlockType.Text;
            if (v == ContentCase.FILE)		 t = I.BlockType.File;
            if (v == ContentCase.LAYOUT)	 t = I.BlockType.Layout;
            if (v == ContentCase.DIV)		 t = I.BlockType.Div;
            if (v == ContentCase.BOOKMARK)	 t = I.BlockType.Bookmark;
            if (v == ContentCase.LINK)		 t = I.BlockType.Link;
            if (v == ContentCase.DATAVIEW)	 t = I.BlockType.Dataview;
            return t;
        },
    
        Block: (obj: any): I.Block => {
            let type = Mapper.From.BlockType(obj.getContentCase());
            let fn = 'get' + Util.ucFirst(type);
            let content = obj[fn] ? obj[fn]() : {};
    
            let item: I.Block = {
                id: obj.getId(),
                type: type,
                childrenIds: obj.getChildrenidsList() || [],
                fields: Decode.decodeStruct(obj.getFields()),
                content: {} as any,
                align: obj.getAlign(),
                bgColor: obj.getBackgroundcolor(),
            };
    
            if (type == I.BlockType.Layout) {
                item.content = {
                    style: content.getStyle(),
                };
            };
    
            if (type == I.BlockType.Link) {
                item.content = {
                    style: content.getStyle(),
                    targetBlockId: content.getTargetblockid(),
                    fields: Decode.decodeStruct(content.getFields()),
                };
            };
    
            if (type == I.BlockType.Div) {
                item.content = {
                    style: content.getStyle(),
                };
            };
    
            if (type == I.BlockType.Bookmark) {
                item.content = {
                    url: content.getUrl(),
                    title: content.getTitle(),
                    description: content.getDescription(),
                    imageHash: content.getImagehash(),
                    faviconHash: content.getFaviconhash(),
                    type: content.getType(),
                };
            };
    
            if (type == I.BlockType.Text) {
                item.content = {
                    text: content.getText(),
                    style: content.getStyle(),
                    checked: content.getChecked(),
                    color: content.getColor(),
                    marks: (content.getMarks().getMarksList() || []).map(Mapper.From.Mark),
                };
            };
    
            if (type == I.BlockType.File) {
                item.content = {
                    hash: content.getHash(),
                    name: content.getName(),
                    type: content.getType(),
                    mime: content.getMime(),
                    size: content.getSize(),
                    addedAt: content.getAddedat(),
                    state: content.getState(),
                };
            };
    
            /*
                if (type == I.BlockType.Dataview) {
                    const schemaId = DataUtil.schemaField(item.content.schemaURL);
    
                    item.content.offset = 0;
                    item.content.total = 0;
                    item.content.data = item.content.data || [];
                    item.content.views = item.content.views || [];
                    item.content.views = item.content.views.map((view: I.View) => {
                        return this.prepareViewFromProto(schemaId, view);
                    });
    
                    decorate(item.content, {
                        viewId: observable,
                        views: observable,
                        data: observable,
                    });
                };
            */
    
            return item;
        },

    }

};

export default Mapper;