import { I, Decode, Util, Encode } from 'ts/lib';

const Commands = require('lib/pb/protos/commands_pb');
const Model = require('lib/vendor/github.com/anytypeio/go-anytype-library/pb/model/protos/models_pb.js');
const Rpc = Commands.Rpc;
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

    },

    To: {

        Range: (obj: any) => {
            return new Model.Range().setFrom(obj.from).setTo(obj.to);
        },

        Mark: (obj: any) => {
            const item = new Model.Block.Content.Text.Mark();
            item.setType(obj.type);
            item.setParam(obj.param);
            item.setRange(Mapper.To.Range(obj.range));
            return item;
        },

        Details: (obj: any) => {
            const item = new Rpc.Block.Set.Details.Detail();
            item.setKey(obj.key);
            item.setValue(Encode.encodeValue(obj.value));
            return item;
        },

        Fields: (obj: any) => {
            const item = new Rpc.BlockList.Set.Fields.Request.BlockField();
            item.setBlockid(obj.blockId);
            item.setFields(Encode.encodeStruct(obj.fields || {}));
            return item;
        },

        Block: (obj: any) => {
            obj.content = Util.objectCopy(obj.content || {});
    
            let block = new Model.Block();
            let content: any = null;
    
            block.setId(obj.id);
            block.setAlign(obj.align);
            block.setBackgroundcolor(obj.bgColor);
    
            if (obj.childrenIds) {
                block.setChildrenidsList(obj.childrenIds);
            };
    
            if (obj.fields) {
                block.setFields(Encode.encodeStruct(obj.fields || {}));
            };
    
            if (obj.type == I.BlockType.Text) {
                const marks = (obj.content.marks || []).map(Mapper.To.Mark);
    
                content = new Model.Block.Content.Text();
    
                content.setText(obj.content.text);
                content.setStyle(obj.content.style);
                content.setChecked(obj.content.checked);
                content.setColor(obj.content.color);
                content.setMarks(new Model.Block.Content.Text.Marks().setMarksList(marks));
    
                block.setText(content);
            };
    
            if (obj.type == I.BlockType.File) {
                content = new Model.Block.Content.File();
    
                content.setHash(obj.content.hash);
                content.setName(obj.content.name);
                content.setType(obj.content.type);
                content.setMime(obj.content.mime);
                content.setSize(obj.content.size);
                content.setAddedat(obj.content.addedAt);
                content.setState(obj.content.state);
    
                block.setFile(content);
            };
    
            if (obj.type == I.BlockType.Bookmark) {
                content = new Model.Block.Content.Bookmark();
    
                content.setUrl(obj.content.url);
                content.setTitle(obj.content.title);
                content.setDescription(obj.content.description);
                content.setImagehash(obj.content.imageHash);
                content.setFaviconhash(obj.content.faviconHash);
                content.setType(obj.content.type);
    
                block.setBookmark(content);
            };
    
            return block;
        }

    }

};

export default Mapper;