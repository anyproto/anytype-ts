import { I, M, Decode, Util, Encode, DataUtil } from 'ts/lib';
import { decorate, observable } from 'mobx';

const Commands = require('lib/pb/protos/commands_pb');
const Constant = require('json/constant.json');
const Model = require('lib/pkg/lib/pb/model/protos/models_pb.js');
const Rpc = Commands.Rpc;
const ContentCase = Model.Block.ContentCase;
const OptionsCase = Model.Block.Content.Dataview.Relation.OptionsCase;
const Schema = {
	page: require('json/schema/page.json'),
	relation: require('json/schema/relation.json'),
};

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
                hasInboundLinks: obj.getHasinboundlinks(),
				pageType: obj.getPagetype(),
            };
        },

        Record: (obj: any) => {
            return Decode.decodeStruct(obj);
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

        LinkPreview: (obj: any) => {
            return {
                type: obj.getType(),
                title: obj.getTitle(),
                description: obj.getDescription(),
                faviconUrl: obj.getFaviconurl(),
                imageUrl: obj.getImageurl(),
                url: obj.getUrl(),
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

		Details: (obj: any) => {
            return {
                id: obj.getId(),
                details: Decode.decodeStruct(obj.getDetails()),
            };
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
    
            if (type == I.BlockType.Dataview) {
                const schemaURL = content.getSchemaurl();
                const schemaId = DataUtil.schemaField(schemaURL);
    
                item.content = {
                    schemaURL: schemaURL,
                    views: (content.getViewsList() || []).map((view: I.View) => {
                        return Mapper.From.View(schemaId, view);
                    }),
                };
            };
    
            return item;
        },

        ViewRelation: (obj: any) => {
            const type = obj.getOptionsCase();
            const ret: any = {
                id: obj.getId(),
                isVisible: obj.getIsvisible(),
                width: obj.getWidth(),
                options: {},
            };

            switch (type) {
                case OptionsCase.DATEOPTIONS:
                    ret.options = obj.getDateoptions() || {};
                    break;
            };

            return ret;
        },

        Filter: (obj: any) => {
            return {
                relationId: obj.getRelationid(),
                operator: obj.getOperator(),
                condition: obj.getCondition(),
                value: Decode.decodeValue(obj.getValue()),
            };
        },

        Sort: (obj: any) => {
            return {
                relationId: obj.getRelationid(),
                type: obj.getType(),
            };
        },

        View: (schemaId: string, obj: any) => {
            let schema = Schema[schemaId] || {};
            let relations = [];
    
            for (let field of (schema.default || [])) {
                if (field.isHidden) {
                    continue;
                };
    
                relations.push({
                    id: String(field.id || ''),
                    name: String(field.name || ''),
                    type: DataUtil.schemaField(field.type),
                    isReadOnly: Boolean(field.isReadonly),
                });
            };

            let view: any = {
                id: obj.getId(),
                type: obj.getType(),
                name: obj.getName(),
            };
    
            view.relations = obj.getRelationsList().map(Mapper.From.ViewRelation);
            view.filters = obj.getFiltersList().map(Mapper.From.Filter);
            view.sorts = obj.getSortsList().map(Mapper.From.Sort);
    
            let order = {};
            for (let i = 0; i < view.relations.length; ++i) {
                order[view.relations[i].id] = i;
            };
    
            view.relations = relations.map((relation: I.Relation) => {
                let rel = view.relations.find((it: any) => { return it.id == relation.id; }) || {};
                return observable({
                    ...relation,
                    isVisible: Boolean(rel.isVisible),
                    order: order[relation.id],
                    width: Number(rel.width || Constant.size.dataview.cell[relation.type] || Constant.size.dataview.cell.default) || 0,
                });
            });

            view.relations.sort((c1: any, c2: any) => {
                if (c1.order > c2.order) return 1;
                if (c1.order < c2.order) return -1;
                return 0;
            });
    
            return observable(new M.View(view));
        },

        HistoryVersion: (obj: any) => {
            return {
                id: obj.getId(),
                previousIds: obj.getPreviousidsList() || [],
                authorId: obj.getAuthorid(),
                authorName: obj.getAuthorname(),
				groupId: obj.getGroupid(),
                time: obj.getTime(),
            };
        },

		ThreadSummary: (obj: any) => {
            return {
                status: Number(obj.getStatus() || I.ThreadStatus.Unknown),
            };
        },

		ThreadCafe: (obj: any) => {
            return {
                status: Number(obj.getStatus() || I.ThreadStatus.Unknown),
                lastPulled: obj.getLastpulled(),
                lastPushSucceed: obj.getLastpushsucceed(),
								files: (obj.getFiles() || []).map(Mapper.From.FilesStatus),
            };
        },

	  FilesStatus: (obj: any) => {
            return {
                pinning: obj.getPinning(),
								pinned: obj.getPinned(),
                failed: obj.getFailed(),
								updated: obj.getUpdated(),
            };
        },

		ThreadDevice: (obj: any) => {
            return {
                name: obj.getName(),
				online: obj.getOnline(),
                lastPulled: obj.getLastpulled(),
                lastEdited: obj.getLastedited(),
            };
        },

		ThreadAccount: (obj: any) => {
            return {
				id: obj.getId(),
				name: obj.getName(),
				imageHash: obj.getImagehash(),
				online: obj.getOnline(),
                lastPulled: obj.getLastpulled(),
                lastEdited: obj.getLastedited(),
				devices: (obj.getDevicesList() || []).map(Mapper.From.ThreadDevice),
            };
        },

    },

    //------------------------------------------------------------

    To: {

        Range: (obj: any) => {
            let ret = new Model.Range();
            ret.setFrom(obj.from);
            ret.setTo(obj.to);
            return ret;
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

            if (obj.type == I.BlockType.Layout) {
                content = new Model.Block.Content.Layout();

                content.setStyle(obj.content.style);
    
                block.setLayout(content);
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

            if (obj.type == I.BlockType.Link) {
                content = new Model.Block.Content.Link();
    
                content.setStyle(obj.content.style);
                content.setTargetblockid(obj.content.targetBlockId);
    
                block.setLink(content);
            };

            if (obj.type == I.BlockType.Div) {
                content = new Model.Block.Content.Div();

                content.setStyle(obj.content.style);
    
                block.setDiv(content);
            };

            return block;
        },

        ViewRelation: (obj: any) => {
            const item = new Model.Block.Content.Dataview.Relation();
            
            item.setId(obj.id);
            item.setIsvisible(obj.isVisible);
            item.setWidth(obj.width);

            if (obj.type == I.RelationType.Date) {
                const options = new Model.Block.Content.Dataview.Relation.DateOptions();

                options.setIncludetime(obj.options.includeTime);
                options.setTimeformat(obj.options.timeFormat);
                options.setDateformat(obj.options.dateFormat);

                item.setDateoptions(options);
            };

            return item;
        },

        Filter: (obj: any) => {
            const item = new Model.Block.Content.Dataview.Filter();
            
            item.setRelationid(obj.relationId);
            item.setOperator(obj.operator);
            item.setCondition(obj.condition);
            item.setValue(Encode.encodeValue(obj.value || ''));

            return item;
        },

        Sort: (obj: any) => {
            const item = new Model.Block.Content.Dataview.Sort();
            
            item.setRelationid(obj.relationId);
            item.setType(obj.type);

            return item;
        },

        View: (obj: I.View) => {
            obj = Util.objectCopy(new M.View(obj));

            const item = new Model.Block.Content.Dataview.View();

            item.setId(obj.id);
            item.setName(obj.name);
            item.setType(obj.type);
            item.setRelationsList(obj.relations.map(Mapper.To.ViewRelation));
            item.setFiltersList(obj.filters.map(Mapper.To.Filter));
            item.setSortsList(obj.sorts.map(Mapper.To.Sort));

            return item;
        },

        PasteFile: (obj: any) => {
            const item = new Rpc.Block.Paste.Request.File();

            item.setName(obj.name);
            item.setLocalpath(obj.path);

            return item;
        },

    }

};

export default Mapper;