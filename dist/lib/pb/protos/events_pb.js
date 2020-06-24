// source: pb/protos/events.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb = require('../../vendor/github.com/anytypeio/go-anytype-library/pb/model/protos/models_pb.js');
goog.object.extend(proto, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb);
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
goog.object.extend(proto, google_protobuf_struct_pb);
goog.exportSymbol('proto.anytype.Event', null, global);
goog.exportSymbol('proto.anytype.Event.Account', null, global);
goog.exportSymbol('proto.anytype.Event.Account.Details', null, global);
goog.exportSymbol('proto.anytype.Event.Account.Show', null, global);
goog.exportSymbol('proto.anytype.Event.Block', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Add', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Delete', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Delete.Dataview', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Delete.Dataview.View', null, global);
goog.exportSymbol('proto.anytype.Event.Block.FilesUpload', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Align', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.BackgroundColor', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Bookmark', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Bookmark.Description', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Bookmark.FaviconHash', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Bookmark.ImageHash', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Bookmark.Title', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Bookmark.Type', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Bookmark.Url', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.ChildrenIds', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.DatabaseRecords', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Details', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Div', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Div.Style', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Fields', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File.Hash', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File.Mime', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File.Name', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File.Size', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File.State', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File.Type', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.File.Width', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Link', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Link.Fields', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Link.Style', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Link.TargetBlockId', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Restrictions', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Text', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Text.Checked', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Text.Color', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Text.Marks', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Text.Style', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Fill.Text.Text', null, global);
goog.exportSymbol('proto.anytype.Event.Block.MarksInfo', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Align', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.BackgroundColor', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Bookmark', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Bookmark.Description', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Bookmark.FaviconHash', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Bookmark.ImageHash', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Bookmark.Title', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Bookmark.Type', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Bookmark.Url', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.ChildrenIds', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Dataview', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Dataview.Records', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Dataview.View', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Details', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Div', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Div.Style', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Fields', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File.Hash', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File.Mime', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File.Name', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File.Size', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File.State', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File.Type', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.File.Width', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Link', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Link.Fields', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Link.Style', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Link.TargetBlockId', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Restrictions', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Text', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Text.Checked', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Text.Color', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Text.Marks', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Text.Style', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Set.Text.Text', null, global);
goog.exportSymbol('proto.anytype.Event.Block.Show', null, global);
goog.exportSymbol('proto.anytype.Event.Message', null, global);
goog.exportSymbol('proto.anytype.Event.Message.ValueCase', null, global);
goog.exportSymbol('proto.anytype.Event.Ping', null, global);
goog.exportSymbol('proto.anytype.Event.Process', null, global);
goog.exportSymbol('proto.anytype.Event.Process.Done', null, global);
goog.exportSymbol('proto.anytype.Event.Process.New', null, global);
goog.exportSymbol('proto.anytype.Event.Process.Update', null, global);
goog.exportSymbol('proto.anytype.Event.User', null, global);
goog.exportSymbol('proto.anytype.Event.User.Block', null, global);
goog.exportSymbol('proto.anytype.Event.User.Block.Join', null, global);
goog.exportSymbol('proto.anytype.Event.User.Block.Left', null, global);
goog.exportSymbol('proto.anytype.Event.User.Block.SelectRange', null, global);
goog.exportSymbol('proto.anytype.Event.User.Block.TextRange', null, global);
goog.exportSymbol('proto.anytype.Model', null, global);
goog.exportSymbol('proto.anytype.Model.Process', null, global);
goog.exportSymbol('proto.anytype.Model.Process.Progress', null, global);
goog.exportSymbol('proto.anytype.Model.Process.State', null, global);
goog.exportSymbol('proto.anytype.Model.Process.Type', null, global);
goog.exportSymbol('proto.anytype.ResponseEvent', null, global);
goog.exportSymbol('proto.anytype.SmartBlockType', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.displayName = 'proto.anytype.Event';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Message = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.anytype.Event.Message.oneofGroups_);
};
goog.inherits(proto.anytype.Event.Message, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Message.displayName = 'proto.anytype.Event.Message';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Account = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Account, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Account.displayName = 'proto.anytype.Event.Account';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Account.Show = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Account.Show, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Account.Show.displayName = 'proto.anytype.Event.Account.Show';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Account.Details = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Account.Details, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Account.Details.displayName = 'proto.anytype.Event.Account.Details';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.displayName = 'proto.anytype.Event.Block';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Add = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.Add.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.Add, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Add.displayName = 'proto.anytype.Event.Block.Add';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Show = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.Show.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.Show, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Show.displayName = 'proto.anytype.Event.Block.Show';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.FilesUpload = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.FilesUpload.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.FilesUpload, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.FilesUpload.displayName = 'proto.anytype.Event.Block.FilesUpload';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Delete = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.Delete.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.Delete, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Delete.displayName = 'proto.anytype.Event.Block.Delete';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Delete.Dataview = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Delete.Dataview, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Delete.Dataview.displayName = 'proto.anytype.Event.Block.Delete.Dataview';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Delete.Dataview.View = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Delete.Dataview.View, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Delete.Dataview.View.displayName = 'proto.anytype.Event.Block.Delete.Dataview.View';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.MarksInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.MarksInfo.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.MarksInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.MarksInfo.displayName = 'proto.anytype.Event.Block.MarksInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.displayName = 'proto.anytype.Event.Block.Set';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Details = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Details, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Details.displayName = 'proto.anytype.Event.Block.Set.Details';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Dataview = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Dataview, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Dataview.displayName = 'proto.anytype.Event.Block.Set.Dataview';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Dataview.Records = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.Set.Dataview.Records.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Dataview.Records, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Dataview.Records.displayName = 'proto.anytype.Event.Block.Set.Dataview.Records';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Dataview.View = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Dataview.View, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Dataview.View.displayName = 'proto.anytype.Event.Block.Set.Dataview.View';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Fields = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Fields, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Fields.displayName = 'proto.anytype.Event.Block.Set.Fields';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.ChildrenIds = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.Set.ChildrenIds.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.Set.ChildrenIds, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.ChildrenIds.displayName = 'proto.anytype.Event.Block.Set.ChildrenIds';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Restrictions = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Restrictions, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Restrictions.displayName = 'proto.anytype.Event.Block.Set.Restrictions';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.BackgroundColor = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.BackgroundColor, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.BackgroundColor.displayName = 'proto.anytype.Event.Block.Set.BackgroundColor';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Align = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Align, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Align.displayName = 'proto.anytype.Event.Block.Set.Align';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Text = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Text, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Text.displayName = 'proto.anytype.Event.Block.Set.Text';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Text.Text = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Text.Text, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Text.Text.displayName = 'proto.anytype.Event.Block.Set.Text.Text';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Text.Style = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Text.Style, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Text.Style.displayName = 'proto.anytype.Event.Block.Set.Text.Style';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Text.Marks = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Text.Marks, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Text.Marks.displayName = 'proto.anytype.Event.Block.Set.Text.Marks';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Text.Checked = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Text.Checked, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Text.Checked.displayName = 'proto.anytype.Event.Block.Set.Text.Checked';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Text.Color = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Text.Color, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Text.Color.displayName = 'proto.anytype.Event.Block.Set.Text.Color';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Div = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Div, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Div.displayName = 'proto.anytype.Event.Block.Set.Div';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Div.Style = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Div.Style, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Div.Style.displayName = 'proto.anytype.Event.Block.Set.Div.Style';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.displayName = 'proto.anytype.Event.Block.Set.File';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File.Name = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File.Name, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.Name.displayName = 'proto.anytype.Event.Block.Set.File.Name';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File.Width = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File.Width, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.Width.displayName = 'proto.anytype.Event.Block.Set.File.Width';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File.State = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File.State, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.State.displayName = 'proto.anytype.Event.Block.Set.File.State';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File.Type = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File.Type, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.Type.displayName = 'proto.anytype.Event.Block.Set.File.Type';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File.Hash = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File.Hash, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.Hash.displayName = 'proto.anytype.Event.Block.Set.File.Hash';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File.Mime = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File.Mime, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.Mime.displayName = 'proto.anytype.Event.Block.Set.File.Mime';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.File.Size = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.File.Size, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.File.Size.displayName = 'proto.anytype.Event.Block.Set.File.Size';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Link = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Link, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Link.displayName = 'proto.anytype.Event.Block.Set.Link';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Link.TargetBlockId, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Link.TargetBlockId.displayName = 'proto.anytype.Event.Block.Set.Link.TargetBlockId';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Link.Style = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Link.Style, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Link.Style.displayName = 'proto.anytype.Event.Block.Set.Link.Style';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Link.Fields = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Link.Fields, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Link.Fields.displayName = 'proto.anytype.Event.Block.Set.Link.Fields';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Bookmark = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Bookmark, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Bookmark.displayName = 'proto.anytype.Event.Block.Set.Bookmark';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Bookmark.Url = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Bookmark.Url, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Bookmark.Url.displayName = 'proto.anytype.Event.Block.Set.Bookmark.Url';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Bookmark.Title = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Bookmark.Title, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Bookmark.Title.displayName = 'proto.anytype.Event.Block.Set.Bookmark.Title';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Bookmark.Description = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Bookmark.Description, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Bookmark.Description.displayName = 'proto.anytype.Event.Block.Set.Bookmark.Description';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Bookmark.ImageHash, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Bookmark.ImageHash.displayName = 'proto.anytype.Event.Block.Set.Bookmark.ImageHash';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Bookmark.FaviconHash, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Bookmark.FaviconHash.displayName = 'proto.anytype.Event.Block.Set.Bookmark.FaviconHash';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Set.Bookmark.Type = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Set.Bookmark.Type, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Set.Bookmark.Type.displayName = 'proto.anytype.Event.Block.Set.Bookmark.Type';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.displayName = 'proto.anytype.Event.Block.Fill';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Details = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Details, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Details.displayName = 'proto.anytype.Event.Block.Fill.Details';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.DatabaseRecords = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.Fill.DatabaseRecords.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.DatabaseRecords, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.DatabaseRecords.displayName = 'proto.anytype.Event.Block.Fill.DatabaseRecords';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Fields = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Fields, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Fields.displayName = 'proto.anytype.Event.Block.Fill.Fields';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.ChildrenIds = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.Block.Fill.ChildrenIds.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.ChildrenIds, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.ChildrenIds.displayName = 'proto.anytype.Event.Block.Fill.ChildrenIds';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Restrictions = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Restrictions, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Restrictions.displayName = 'proto.anytype.Event.Block.Fill.Restrictions';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.BackgroundColor = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.BackgroundColor, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.BackgroundColor.displayName = 'proto.anytype.Event.Block.Fill.BackgroundColor';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Align = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Align, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Align.displayName = 'proto.anytype.Event.Block.Fill.Align';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Text = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Text, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Text.displayName = 'proto.anytype.Event.Block.Fill.Text';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Text.Text = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Text.Text, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Text.Text.displayName = 'proto.anytype.Event.Block.Fill.Text.Text';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Text.Style = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Text.Style, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Text.Style.displayName = 'proto.anytype.Event.Block.Fill.Text.Style';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Text.Marks = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Text.Marks, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Text.Marks.displayName = 'proto.anytype.Event.Block.Fill.Text.Marks';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Text.Checked = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Text.Checked, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Text.Checked.displayName = 'proto.anytype.Event.Block.Fill.Text.Checked';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Text.Color = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Text.Color, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Text.Color.displayName = 'proto.anytype.Event.Block.Fill.Text.Color';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Div = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Div, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Div.displayName = 'proto.anytype.Event.Block.Fill.Div';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Div.Style = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Div.Style, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Div.Style.displayName = 'proto.anytype.Event.Block.Fill.Div.Style';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.displayName = 'proto.anytype.Event.Block.Fill.File';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File.Name = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File.Name, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.Name.displayName = 'proto.anytype.Event.Block.Fill.File.Name';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File.Width = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File.Width, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.Width.displayName = 'proto.anytype.Event.Block.Fill.File.Width';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File.State = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File.State, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.State.displayName = 'proto.anytype.Event.Block.Fill.File.State';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File.Type = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File.Type, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.Type.displayName = 'proto.anytype.Event.Block.Fill.File.Type';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File.Hash = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File.Hash, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.Hash.displayName = 'proto.anytype.Event.Block.Fill.File.Hash';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File.Mime = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File.Mime, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.Mime.displayName = 'proto.anytype.Event.Block.Fill.File.Mime';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.File.Size = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.File.Size, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.File.Size.displayName = 'proto.anytype.Event.Block.Fill.File.Size';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Link = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Link, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Link.displayName = 'proto.anytype.Event.Block.Fill.Link';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Link.TargetBlockId, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Link.TargetBlockId.displayName = 'proto.anytype.Event.Block.Fill.Link.TargetBlockId';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Link.Style = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Link.Style, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Link.Style.displayName = 'proto.anytype.Event.Block.Fill.Link.Style';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Link.Fields = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Link.Fields, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Link.Fields.displayName = 'proto.anytype.Event.Block.Fill.Link.Fields';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Bookmark = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Bookmark, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Bookmark.displayName = 'proto.anytype.Event.Block.Fill.Bookmark';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Bookmark.Url = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Bookmark.Url, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Bookmark.Url.displayName = 'proto.anytype.Event.Block.Fill.Bookmark.Url';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Bookmark.Title = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Bookmark.Title, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Bookmark.Title.displayName = 'proto.anytype.Event.Block.Fill.Bookmark.Title';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Bookmark.Description = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Bookmark.Description, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Bookmark.Description.displayName = 'proto.anytype.Event.Block.Fill.Bookmark.Description';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Bookmark.ImageHash, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Bookmark.ImageHash.displayName = 'proto.anytype.Event.Block.Fill.Bookmark.ImageHash';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Bookmark.FaviconHash, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.displayName = 'proto.anytype.Event.Block.Fill.Bookmark.FaviconHash';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Block.Fill.Bookmark.Type = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Block.Fill.Bookmark.Type, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Block.Fill.Bookmark.Type.displayName = 'proto.anytype.Event.Block.Fill.Bookmark.Type';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.User = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.User, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.User.displayName = 'proto.anytype.Event.User';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.User.Block = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.User.Block, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.User.Block.displayName = 'proto.anytype.Event.User.Block';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.User.Block.Join = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.User.Block.Join, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.User.Block.Join.displayName = 'proto.anytype.Event.User.Block.Join';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.User.Block.Left = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.User.Block.Left, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.User.Block.Left.displayName = 'proto.anytype.Event.User.Block.Left';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.User.Block.TextRange = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.User.Block.TextRange, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.User.Block.TextRange.displayName = 'proto.anytype.Event.User.Block.TextRange';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.User.Block.SelectRange = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.Event.User.Block.SelectRange.repeatedFields_, null);
};
goog.inherits(proto.anytype.Event.User.Block.SelectRange, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.User.Block.SelectRange.displayName = 'proto.anytype.Event.User.Block.SelectRange';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Ping = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Ping, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Ping.displayName = 'proto.anytype.Event.Ping';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Process = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Process, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Process.displayName = 'proto.anytype.Event.Process';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Process.New = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Process.New, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Process.New.displayName = 'proto.anytype.Event.Process.New';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Process.Update = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Process.Update, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Process.Update.displayName = 'proto.anytype.Event.Process.Update';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Event.Process.Done = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Event.Process.Done, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Event.Process.Done.displayName = 'proto.anytype.Event.Process.Done';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.ResponseEvent = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.anytype.ResponseEvent.repeatedFields_, null);
};
goog.inherits(proto.anytype.ResponseEvent, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.ResponseEvent.displayName = 'proto.anytype.ResponseEvent';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Model = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Model, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Model.displayName = 'proto.anytype.Model';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Model.Process = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Model.Process, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Model.Process.displayName = 'proto.anytype.Model.Process';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.anytype.Model.Process.Progress = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.anytype.Model.Process.Progress, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.anytype.Model.Process.Progress.displayName = 'proto.anytype.Model.Process.Progress';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.toObject = function(includeInstance, msg) {
  var f, obj = {
    messagesList: jspb.Message.toObjectList(msg.getMessagesList(),
    proto.anytype.Event.Message.toObject, includeInstance),
    contextid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    initiator: (f = msg.getInitiator()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event}
 */
proto.anytype.Event.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event;
  return proto.anytype.Event.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event}
 */
proto.anytype.Event.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Event.Message;
      reader.readMessage(value,proto.anytype.Event.Message.deserializeBinaryFromReader);
      msg.addMessages(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setContextid(value);
      break;
    case 3:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account.deserializeBinaryFromReader);
      msg.setInitiator(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessagesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.anytype.Event.Message.serializeBinaryToWriter
    );
  }
  f = message.getContextid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getInitiator();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account.serializeBinaryToWriter
    );
  }
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.anytype.Event.Message.oneofGroups_ = [[1,201,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20,30,31,32,33,34,100,101,102,103]];

/**
 * @enum {number}
 */
proto.anytype.Event.Message.ValueCase = {
  VALUE_NOT_SET: 0,
  ACCOUNTSHOW: 1,
  ACCOUNTDETAILS: 201,
  BLOCKADD: 2,
  BLOCKDELETE: 3,
  FILESUPLOAD: 4,
  MARKSINFO: 5,
  BLOCKSETFIELDS: 6,
  BLOCKSETCHILDRENIDS: 7,
  BLOCKSETRESTRICTIONS: 8,
  BLOCKSETBACKGROUNDCOLOR: 9,
  BLOCKSETTEXT: 10,
  BLOCKSETFILE: 11,
  BLOCKSETLINK: 13,
  BLOCKSETBOOKMARK: 14,
  BLOCKSETALIGN: 15,
  BLOCKSETDETAILS: 16,
  BLOCKSETDIV: 17,
  BLOCKSETDATAVIEWRECORDS: 18,
  BLOCKSETDATAVIEWVIEW: 19,
  BLOCKDELETEDATAVIEWVIEW: 20,
  BLOCKSHOW: 30,
  USERBLOCKJOIN: 31,
  USERBLOCKLEFT: 32,
  USERBLOCKSELECTRANGE: 33,
  USERBLOCKTEXTRANGE: 34,
  PING: 100,
  PROCESSNEW: 101,
  PROCESSUPDATE: 102,
  PROCESSDONE: 103
};

/**
 * @return {proto.anytype.Event.Message.ValueCase}
 */
proto.anytype.Event.Message.prototype.getValueCase = function() {
  return /** @type {proto.anytype.Event.Message.ValueCase} */(jspb.Message.computeOneofCase(this, proto.anytype.Event.Message.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Message.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Message.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Message} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Message.toObject = function(includeInstance, msg) {
  var f, obj = {
    accountshow: (f = msg.getAccountshow()) && proto.anytype.Event.Account.Show.toObject(includeInstance, f),
    accountdetails: (f = msg.getAccountdetails()) && proto.anytype.Event.Account.Details.toObject(includeInstance, f),
    blockadd: (f = msg.getBlockadd()) && proto.anytype.Event.Block.Add.toObject(includeInstance, f),
    blockdelete: (f = msg.getBlockdelete()) && proto.anytype.Event.Block.Delete.toObject(includeInstance, f),
    filesupload: (f = msg.getFilesupload()) && proto.anytype.Event.Block.FilesUpload.toObject(includeInstance, f),
    marksinfo: (f = msg.getMarksinfo()) && proto.anytype.Event.Block.MarksInfo.toObject(includeInstance, f),
    blocksetfields: (f = msg.getBlocksetfields()) && proto.anytype.Event.Block.Set.Fields.toObject(includeInstance, f),
    blocksetchildrenids: (f = msg.getBlocksetchildrenids()) && proto.anytype.Event.Block.Set.ChildrenIds.toObject(includeInstance, f),
    blocksetrestrictions: (f = msg.getBlocksetrestrictions()) && proto.anytype.Event.Block.Set.Restrictions.toObject(includeInstance, f),
    blocksetbackgroundcolor: (f = msg.getBlocksetbackgroundcolor()) && proto.anytype.Event.Block.Set.BackgroundColor.toObject(includeInstance, f),
    blocksettext: (f = msg.getBlocksettext()) && proto.anytype.Event.Block.Set.Text.toObject(includeInstance, f),
    blocksetfile: (f = msg.getBlocksetfile()) && proto.anytype.Event.Block.Set.File.toObject(includeInstance, f),
    blocksetlink: (f = msg.getBlocksetlink()) && proto.anytype.Event.Block.Set.Link.toObject(includeInstance, f),
    blocksetbookmark: (f = msg.getBlocksetbookmark()) && proto.anytype.Event.Block.Set.Bookmark.toObject(includeInstance, f),
    blocksetalign: (f = msg.getBlocksetalign()) && proto.anytype.Event.Block.Set.Align.toObject(includeInstance, f),
    blocksetdetails: (f = msg.getBlocksetdetails()) && proto.anytype.Event.Block.Set.Details.toObject(includeInstance, f),
    blocksetdiv: (f = msg.getBlocksetdiv()) && proto.anytype.Event.Block.Set.Div.toObject(includeInstance, f),
    blocksetdataviewrecords: (f = msg.getBlocksetdataviewrecords()) && proto.anytype.Event.Block.Set.Dataview.Records.toObject(includeInstance, f),
    blocksetdataviewview: (f = msg.getBlocksetdataviewview()) && proto.anytype.Event.Block.Set.Dataview.View.toObject(includeInstance, f),
    blockdeletedataviewview: (f = msg.getBlockdeletedataviewview()) && proto.anytype.Event.Block.Delete.Dataview.View.toObject(includeInstance, f),
    blockshow: (f = msg.getBlockshow()) && proto.anytype.Event.Block.Show.toObject(includeInstance, f),
    userblockjoin: (f = msg.getUserblockjoin()) && proto.anytype.Event.User.Block.Join.toObject(includeInstance, f),
    userblockleft: (f = msg.getUserblockleft()) && proto.anytype.Event.User.Block.Left.toObject(includeInstance, f),
    userblockselectrange: (f = msg.getUserblockselectrange()) && proto.anytype.Event.User.Block.SelectRange.toObject(includeInstance, f),
    userblocktextrange: (f = msg.getUserblocktextrange()) && proto.anytype.Event.User.Block.TextRange.toObject(includeInstance, f),
    ping: (f = msg.getPing()) && proto.anytype.Event.Ping.toObject(includeInstance, f),
    processnew: (f = msg.getProcessnew()) && proto.anytype.Event.Process.New.toObject(includeInstance, f),
    processupdate: (f = msg.getProcessupdate()) && proto.anytype.Event.Process.Update.toObject(includeInstance, f),
    processdone: (f = msg.getProcessdone()) && proto.anytype.Event.Process.Done.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Message}
 */
proto.anytype.Event.Message.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Message;
  return proto.anytype.Event.Message.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Message} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Message}
 */
proto.anytype.Event.Message.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Event.Account.Show;
      reader.readMessage(value,proto.anytype.Event.Account.Show.deserializeBinaryFromReader);
      msg.setAccountshow(value);
      break;
    case 201:
      var value = new proto.anytype.Event.Account.Details;
      reader.readMessage(value,proto.anytype.Event.Account.Details.deserializeBinaryFromReader);
      msg.setAccountdetails(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Add;
      reader.readMessage(value,proto.anytype.Event.Block.Add.deserializeBinaryFromReader);
      msg.setBlockadd(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Delete;
      reader.readMessage(value,proto.anytype.Event.Block.Delete.deserializeBinaryFromReader);
      msg.setBlockdelete(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.FilesUpload;
      reader.readMessage(value,proto.anytype.Event.Block.FilesUpload.deserializeBinaryFromReader);
      msg.setFilesupload(value);
      break;
    case 5:
      var value = new proto.anytype.Event.Block.MarksInfo;
      reader.readMessage(value,proto.anytype.Event.Block.MarksInfo.deserializeBinaryFromReader);
      msg.setMarksinfo(value);
      break;
    case 6:
      var value = new proto.anytype.Event.Block.Set.Fields;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Fields.deserializeBinaryFromReader);
      msg.setBlocksetfields(value);
      break;
    case 7:
      var value = new proto.anytype.Event.Block.Set.ChildrenIds;
      reader.readMessage(value,proto.anytype.Event.Block.Set.ChildrenIds.deserializeBinaryFromReader);
      msg.setBlocksetchildrenids(value);
      break;
    case 8:
      var value = new proto.anytype.Event.Block.Set.Restrictions;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Restrictions.deserializeBinaryFromReader);
      msg.setBlocksetrestrictions(value);
      break;
    case 9:
      var value = new proto.anytype.Event.Block.Set.BackgroundColor;
      reader.readMessage(value,proto.anytype.Event.Block.Set.BackgroundColor.deserializeBinaryFromReader);
      msg.setBlocksetbackgroundcolor(value);
      break;
    case 10:
      var value = new proto.anytype.Event.Block.Set.Text;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Text.deserializeBinaryFromReader);
      msg.setBlocksettext(value);
      break;
    case 11:
      var value = new proto.anytype.Event.Block.Set.File;
      reader.readMessage(value,proto.anytype.Event.Block.Set.File.deserializeBinaryFromReader);
      msg.setBlocksetfile(value);
      break;
    case 13:
      var value = new proto.anytype.Event.Block.Set.Link;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Link.deserializeBinaryFromReader);
      msg.setBlocksetlink(value);
      break;
    case 14:
      var value = new proto.anytype.Event.Block.Set.Bookmark;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Bookmark.deserializeBinaryFromReader);
      msg.setBlocksetbookmark(value);
      break;
    case 15:
      var value = new proto.anytype.Event.Block.Set.Align;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Align.deserializeBinaryFromReader);
      msg.setBlocksetalign(value);
      break;
    case 16:
      var value = new proto.anytype.Event.Block.Set.Details;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Details.deserializeBinaryFromReader);
      msg.setBlocksetdetails(value);
      break;
    case 17:
      var value = new proto.anytype.Event.Block.Set.Div;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Div.deserializeBinaryFromReader);
      msg.setBlocksetdiv(value);
      break;
    case 18:
      var value = new proto.anytype.Event.Block.Set.Dataview.Records;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Dataview.Records.deserializeBinaryFromReader);
      msg.setBlocksetdataviewrecords(value);
      break;
    case 19:
      var value = new proto.anytype.Event.Block.Set.Dataview.View;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Dataview.View.deserializeBinaryFromReader);
      msg.setBlocksetdataviewview(value);
      break;
    case 20:
      var value = new proto.anytype.Event.Block.Delete.Dataview.View;
      reader.readMessage(value,proto.anytype.Event.Block.Delete.Dataview.View.deserializeBinaryFromReader);
      msg.setBlockdeletedataviewview(value);
      break;
    case 30:
      var value = new proto.anytype.Event.Block.Show;
      reader.readMessage(value,proto.anytype.Event.Block.Show.deserializeBinaryFromReader);
      msg.setBlockshow(value);
      break;
    case 31:
      var value = new proto.anytype.Event.User.Block.Join;
      reader.readMessage(value,proto.anytype.Event.User.Block.Join.deserializeBinaryFromReader);
      msg.setUserblockjoin(value);
      break;
    case 32:
      var value = new proto.anytype.Event.User.Block.Left;
      reader.readMessage(value,proto.anytype.Event.User.Block.Left.deserializeBinaryFromReader);
      msg.setUserblockleft(value);
      break;
    case 33:
      var value = new proto.anytype.Event.User.Block.SelectRange;
      reader.readMessage(value,proto.anytype.Event.User.Block.SelectRange.deserializeBinaryFromReader);
      msg.setUserblockselectrange(value);
      break;
    case 34:
      var value = new proto.anytype.Event.User.Block.TextRange;
      reader.readMessage(value,proto.anytype.Event.User.Block.TextRange.deserializeBinaryFromReader);
      msg.setUserblocktextrange(value);
      break;
    case 100:
      var value = new proto.anytype.Event.Ping;
      reader.readMessage(value,proto.anytype.Event.Ping.deserializeBinaryFromReader);
      msg.setPing(value);
      break;
    case 101:
      var value = new proto.anytype.Event.Process.New;
      reader.readMessage(value,proto.anytype.Event.Process.New.deserializeBinaryFromReader);
      msg.setProcessnew(value);
      break;
    case 102:
      var value = new proto.anytype.Event.Process.Update;
      reader.readMessage(value,proto.anytype.Event.Process.Update.deserializeBinaryFromReader);
      msg.setProcessupdate(value);
      break;
    case 103:
      var value = new proto.anytype.Event.Process.Done;
      reader.readMessage(value,proto.anytype.Event.Process.Done.deserializeBinaryFromReader);
      msg.setProcessdone(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Message.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Message.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Message} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Message.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccountshow();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Event.Account.Show.serializeBinaryToWriter
    );
  }
  f = message.getAccountdetails();
  if (f != null) {
    writer.writeMessage(
      201,
      f,
      proto.anytype.Event.Account.Details.serializeBinaryToWriter
    );
  }
  f = message.getBlockadd();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Add.serializeBinaryToWriter
    );
  }
  f = message.getBlockdelete();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Delete.serializeBinaryToWriter
    );
  }
  f = message.getFilesupload();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.FilesUpload.serializeBinaryToWriter
    );
  }
  f = message.getMarksinfo();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.anytype.Event.Block.MarksInfo.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetfields();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.anytype.Event.Block.Set.Fields.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetchildrenids();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.anytype.Event.Block.Set.ChildrenIds.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetrestrictions();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      proto.anytype.Event.Block.Set.Restrictions.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetbackgroundcolor();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.anytype.Event.Block.Set.BackgroundColor.serializeBinaryToWriter
    );
  }
  f = message.getBlocksettext();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      proto.anytype.Event.Block.Set.Text.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetfile();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      proto.anytype.Event.Block.Set.File.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetlink();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      proto.anytype.Event.Block.Set.Link.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetbookmark();
  if (f != null) {
    writer.writeMessage(
      14,
      f,
      proto.anytype.Event.Block.Set.Bookmark.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetalign();
  if (f != null) {
    writer.writeMessage(
      15,
      f,
      proto.anytype.Event.Block.Set.Align.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetdetails();
  if (f != null) {
    writer.writeMessage(
      16,
      f,
      proto.anytype.Event.Block.Set.Details.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetdiv();
  if (f != null) {
    writer.writeMessage(
      17,
      f,
      proto.anytype.Event.Block.Set.Div.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetdataviewrecords();
  if (f != null) {
    writer.writeMessage(
      18,
      f,
      proto.anytype.Event.Block.Set.Dataview.Records.serializeBinaryToWriter
    );
  }
  f = message.getBlocksetdataviewview();
  if (f != null) {
    writer.writeMessage(
      19,
      f,
      proto.anytype.Event.Block.Set.Dataview.View.serializeBinaryToWriter
    );
  }
  f = message.getBlockdeletedataviewview();
  if (f != null) {
    writer.writeMessage(
      20,
      f,
      proto.anytype.Event.Block.Delete.Dataview.View.serializeBinaryToWriter
    );
  }
  f = message.getBlockshow();
  if (f != null) {
    writer.writeMessage(
      30,
      f,
      proto.anytype.Event.Block.Show.serializeBinaryToWriter
    );
  }
  f = message.getUserblockjoin();
  if (f != null) {
    writer.writeMessage(
      31,
      f,
      proto.anytype.Event.User.Block.Join.serializeBinaryToWriter
    );
  }
  f = message.getUserblockleft();
  if (f != null) {
    writer.writeMessage(
      32,
      f,
      proto.anytype.Event.User.Block.Left.serializeBinaryToWriter
    );
  }
  f = message.getUserblockselectrange();
  if (f != null) {
    writer.writeMessage(
      33,
      f,
      proto.anytype.Event.User.Block.SelectRange.serializeBinaryToWriter
    );
  }
  f = message.getUserblocktextrange();
  if (f != null) {
    writer.writeMessage(
      34,
      f,
      proto.anytype.Event.User.Block.TextRange.serializeBinaryToWriter
    );
  }
  f = message.getPing();
  if (f != null) {
    writer.writeMessage(
      100,
      f,
      proto.anytype.Event.Ping.serializeBinaryToWriter
    );
  }
  f = message.getProcessnew();
  if (f != null) {
    writer.writeMessage(
      101,
      f,
      proto.anytype.Event.Process.New.serializeBinaryToWriter
    );
  }
  f = message.getProcessupdate();
  if (f != null) {
    writer.writeMessage(
      102,
      f,
      proto.anytype.Event.Process.Update.serializeBinaryToWriter
    );
  }
  f = message.getProcessdone();
  if (f != null) {
    writer.writeMessage(
      103,
      f,
      proto.anytype.Event.Process.Done.serializeBinaryToWriter
    );
  }
};


/**
 * optional Account.Show accountShow = 1;
 * @return {?proto.anytype.Event.Account.Show}
 */
proto.anytype.Event.Message.prototype.getAccountshow = function() {
  return /** @type{?proto.anytype.Event.Account.Show} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Account.Show, 1));
};


/**
 * @param {?proto.anytype.Event.Account.Show|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setAccountshow = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearAccountshow = function() {
  return this.setAccountshow(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasAccountshow = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Account.Details accountDetails = 201;
 * @return {?proto.anytype.Event.Account.Details}
 */
proto.anytype.Event.Message.prototype.getAccountdetails = function() {
  return /** @type{?proto.anytype.Event.Account.Details} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Account.Details, 201));
};


/**
 * @param {?proto.anytype.Event.Account.Details|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setAccountdetails = function(value) {
  return jspb.Message.setOneofWrapperField(this, 201, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearAccountdetails = function() {
  return this.setAccountdetails(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasAccountdetails = function() {
  return jspb.Message.getField(this, 201) != null;
};


/**
 * optional Block.Add blockAdd = 2;
 * @return {?proto.anytype.Event.Block.Add}
 */
proto.anytype.Event.Message.prototype.getBlockadd = function() {
  return /** @type{?proto.anytype.Event.Block.Add} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Add, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Add|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlockadd = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlockadd = function() {
  return this.setBlockadd(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlockadd = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Block.Delete blockDelete = 3;
 * @return {?proto.anytype.Event.Block.Delete}
 */
proto.anytype.Event.Message.prototype.getBlockdelete = function() {
  return /** @type{?proto.anytype.Event.Block.Delete} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Delete, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Delete|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlockdelete = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlockdelete = function() {
  return this.setBlockdelete(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlockdelete = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Block.FilesUpload filesUpload = 4;
 * @return {?proto.anytype.Event.Block.FilesUpload}
 */
proto.anytype.Event.Message.prototype.getFilesupload = function() {
  return /** @type{?proto.anytype.Event.Block.FilesUpload} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.FilesUpload, 4));
};


/**
 * @param {?proto.anytype.Event.Block.FilesUpload|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setFilesupload = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearFilesupload = function() {
  return this.setFilesupload(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasFilesupload = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Block.MarksInfo marksInfo = 5;
 * @return {?proto.anytype.Event.Block.MarksInfo}
 */
proto.anytype.Event.Message.prototype.getMarksinfo = function() {
  return /** @type{?proto.anytype.Event.Block.MarksInfo} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.MarksInfo, 5));
};


/**
 * @param {?proto.anytype.Event.Block.MarksInfo|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setMarksinfo = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearMarksinfo = function() {
  return this.setMarksinfo(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasMarksinfo = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Block.Set.Fields blockSetFields = 6;
 * @return {?proto.anytype.Event.Block.Set.Fields}
 */
proto.anytype.Event.Message.prototype.getBlocksetfields = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Fields} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Fields, 6));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Fields|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetfields = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetfields = function() {
  return this.setBlocksetfields(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetfields = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional Block.Set.ChildrenIds blockSetChildrenIds = 7;
 * @return {?proto.anytype.Event.Block.Set.ChildrenIds}
 */
proto.anytype.Event.Message.prototype.getBlocksetchildrenids = function() {
  return /** @type{?proto.anytype.Event.Block.Set.ChildrenIds} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.ChildrenIds, 7));
};


/**
 * @param {?proto.anytype.Event.Block.Set.ChildrenIds|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetchildrenids = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetchildrenids = function() {
  return this.setBlocksetchildrenids(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetchildrenids = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional Block.Set.Restrictions blockSetRestrictions = 8;
 * @return {?proto.anytype.Event.Block.Set.Restrictions}
 */
proto.anytype.Event.Message.prototype.getBlocksetrestrictions = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Restrictions} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Restrictions, 8));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Restrictions|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetrestrictions = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetrestrictions = function() {
  return this.setBlocksetrestrictions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetrestrictions = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional Block.Set.BackgroundColor blockSetBackgroundColor = 9;
 * @return {?proto.anytype.Event.Block.Set.BackgroundColor}
 */
proto.anytype.Event.Message.prototype.getBlocksetbackgroundcolor = function() {
  return /** @type{?proto.anytype.Event.Block.Set.BackgroundColor} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.BackgroundColor, 9));
};


/**
 * @param {?proto.anytype.Event.Block.Set.BackgroundColor|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetbackgroundcolor = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetbackgroundcolor = function() {
  return this.setBlocksetbackgroundcolor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetbackgroundcolor = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional Block.Set.Text blockSetText = 10;
 * @return {?proto.anytype.Event.Block.Set.Text}
 */
proto.anytype.Event.Message.prototype.getBlocksettext = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Text} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Text, 10));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Text|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksettext = function(value) {
  return jspb.Message.setOneofWrapperField(this, 10, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksettext = function() {
  return this.setBlocksettext(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksettext = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional Block.Set.File blockSetFile = 11;
 * @return {?proto.anytype.Event.Block.Set.File}
 */
proto.anytype.Event.Message.prototype.getBlocksetfile = function() {
  return /** @type{?proto.anytype.Event.Block.Set.File} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.File, 11));
};


/**
 * @param {?proto.anytype.Event.Block.Set.File|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetfile = function(value) {
  return jspb.Message.setOneofWrapperField(this, 11, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetfile = function() {
  return this.setBlocksetfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetfile = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional Block.Set.Link blockSetLink = 13;
 * @return {?proto.anytype.Event.Block.Set.Link}
 */
proto.anytype.Event.Message.prototype.getBlocksetlink = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Link} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Link, 13));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Link|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetlink = function(value) {
  return jspb.Message.setOneofWrapperField(this, 13, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetlink = function() {
  return this.setBlocksetlink(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetlink = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional Block.Set.Bookmark blockSetBookmark = 14;
 * @return {?proto.anytype.Event.Block.Set.Bookmark}
 */
proto.anytype.Event.Message.prototype.getBlocksetbookmark = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Bookmark} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Bookmark, 14));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Bookmark|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetbookmark = function(value) {
  return jspb.Message.setOneofWrapperField(this, 14, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetbookmark = function() {
  return this.setBlocksetbookmark(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetbookmark = function() {
  return jspb.Message.getField(this, 14) != null;
};


/**
 * optional Block.Set.Align blockSetAlign = 15;
 * @return {?proto.anytype.Event.Block.Set.Align}
 */
proto.anytype.Event.Message.prototype.getBlocksetalign = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Align} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Align, 15));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Align|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetalign = function(value) {
  return jspb.Message.setOneofWrapperField(this, 15, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetalign = function() {
  return this.setBlocksetalign(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetalign = function() {
  return jspb.Message.getField(this, 15) != null;
};


/**
 * optional Block.Set.Details blockSetDetails = 16;
 * @return {?proto.anytype.Event.Block.Set.Details}
 */
proto.anytype.Event.Message.prototype.getBlocksetdetails = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Details} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Details, 16));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Details|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetdetails = function(value) {
  return jspb.Message.setOneofWrapperField(this, 16, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetdetails = function() {
  return this.setBlocksetdetails(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetdetails = function() {
  return jspb.Message.getField(this, 16) != null;
};


/**
 * optional Block.Set.Div blockSetDiv = 17;
 * @return {?proto.anytype.Event.Block.Set.Div}
 */
proto.anytype.Event.Message.prototype.getBlocksetdiv = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Div} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Div, 17));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Div|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetdiv = function(value) {
  return jspb.Message.setOneofWrapperField(this, 17, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetdiv = function() {
  return this.setBlocksetdiv(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetdiv = function() {
  return jspb.Message.getField(this, 17) != null;
};


/**
 * optional Block.Set.Dataview.Records blockSetDataviewRecords = 18;
 * @return {?proto.anytype.Event.Block.Set.Dataview.Records}
 */
proto.anytype.Event.Message.prototype.getBlocksetdataviewrecords = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Dataview.Records} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Dataview.Records, 18));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Dataview.Records|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetdataviewrecords = function(value) {
  return jspb.Message.setOneofWrapperField(this, 18, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetdataviewrecords = function() {
  return this.setBlocksetdataviewrecords(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetdataviewrecords = function() {
  return jspb.Message.getField(this, 18) != null;
};


/**
 * optional Block.Set.Dataview.View blockSetDataviewView = 19;
 * @return {?proto.anytype.Event.Block.Set.Dataview.View}
 */
proto.anytype.Event.Message.prototype.getBlocksetdataviewview = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Dataview.View} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Dataview.View, 19));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Dataview.View|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlocksetdataviewview = function(value) {
  return jspb.Message.setOneofWrapperField(this, 19, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlocksetdataviewview = function() {
  return this.setBlocksetdataviewview(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlocksetdataviewview = function() {
  return jspb.Message.getField(this, 19) != null;
};


/**
 * optional Block.Delete.Dataview.View blockDeleteDataviewView = 20;
 * @return {?proto.anytype.Event.Block.Delete.Dataview.View}
 */
proto.anytype.Event.Message.prototype.getBlockdeletedataviewview = function() {
  return /** @type{?proto.anytype.Event.Block.Delete.Dataview.View} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Delete.Dataview.View, 20));
};


/**
 * @param {?proto.anytype.Event.Block.Delete.Dataview.View|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlockdeletedataviewview = function(value) {
  return jspb.Message.setOneofWrapperField(this, 20, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlockdeletedataviewview = function() {
  return this.setBlockdeletedataviewview(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlockdeletedataviewview = function() {
  return jspb.Message.getField(this, 20) != null;
};


/**
 * optional Block.Show blockShow = 30;
 * @return {?proto.anytype.Event.Block.Show}
 */
proto.anytype.Event.Message.prototype.getBlockshow = function() {
  return /** @type{?proto.anytype.Event.Block.Show} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Show, 30));
};


/**
 * @param {?proto.anytype.Event.Block.Show|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setBlockshow = function(value) {
  return jspb.Message.setOneofWrapperField(this, 30, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearBlockshow = function() {
  return this.setBlockshow(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasBlockshow = function() {
  return jspb.Message.getField(this, 30) != null;
};


/**
 * optional User.Block.Join userBlockJoin = 31;
 * @return {?proto.anytype.Event.User.Block.Join}
 */
proto.anytype.Event.Message.prototype.getUserblockjoin = function() {
  return /** @type{?proto.anytype.Event.User.Block.Join} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.User.Block.Join, 31));
};


/**
 * @param {?proto.anytype.Event.User.Block.Join|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setUserblockjoin = function(value) {
  return jspb.Message.setOneofWrapperField(this, 31, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearUserblockjoin = function() {
  return this.setUserblockjoin(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasUserblockjoin = function() {
  return jspb.Message.getField(this, 31) != null;
};


/**
 * optional User.Block.Left userBlockLeft = 32;
 * @return {?proto.anytype.Event.User.Block.Left}
 */
proto.anytype.Event.Message.prototype.getUserblockleft = function() {
  return /** @type{?proto.anytype.Event.User.Block.Left} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.User.Block.Left, 32));
};


/**
 * @param {?proto.anytype.Event.User.Block.Left|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setUserblockleft = function(value) {
  return jspb.Message.setOneofWrapperField(this, 32, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearUserblockleft = function() {
  return this.setUserblockleft(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasUserblockleft = function() {
  return jspb.Message.getField(this, 32) != null;
};


/**
 * optional User.Block.SelectRange userBlockSelectRange = 33;
 * @return {?proto.anytype.Event.User.Block.SelectRange}
 */
proto.anytype.Event.Message.prototype.getUserblockselectrange = function() {
  return /** @type{?proto.anytype.Event.User.Block.SelectRange} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.User.Block.SelectRange, 33));
};


/**
 * @param {?proto.anytype.Event.User.Block.SelectRange|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setUserblockselectrange = function(value) {
  return jspb.Message.setOneofWrapperField(this, 33, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearUserblockselectrange = function() {
  return this.setUserblockselectrange(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasUserblockselectrange = function() {
  return jspb.Message.getField(this, 33) != null;
};


/**
 * optional User.Block.TextRange userBlockTextRange = 34;
 * @return {?proto.anytype.Event.User.Block.TextRange}
 */
proto.anytype.Event.Message.prototype.getUserblocktextrange = function() {
  return /** @type{?proto.anytype.Event.User.Block.TextRange} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.User.Block.TextRange, 34));
};


/**
 * @param {?proto.anytype.Event.User.Block.TextRange|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setUserblocktextrange = function(value) {
  return jspb.Message.setOneofWrapperField(this, 34, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearUserblocktextrange = function() {
  return this.setUserblocktextrange(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasUserblocktextrange = function() {
  return jspb.Message.getField(this, 34) != null;
};


/**
 * optional Ping ping = 100;
 * @return {?proto.anytype.Event.Ping}
 */
proto.anytype.Event.Message.prototype.getPing = function() {
  return /** @type{?proto.anytype.Event.Ping} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Ping, 100));
};


/**
 * @param {?proto.anytype.Event.Ping|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setPing = function(value) {
  return jspb.Message.setOneofWrapperField(this, 100, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearPing = function() {
  return this.setPing(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasPing = function() {
  return jspb.Message.getField(this, 100) != null;
};


/**
 * optional Process.New processNew = 101;
 * @return {?proto.anytype.Event.Process.New}
 */
proto.anytype.Event.Message.prototype.getProcessnew = function() {
  return /** @type{?proto.anytype.Event.Process.New} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Process.New, 101));
};


/**
 * @param {?proto.anytype.Event.Process.New|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setProcessnew = function(value) {
  return jspb.Message.setOneofWrapperField(this, 101, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearProcessnew = function() {
  return this.setProcessnew(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasProcessnew = function() {
  return jspb.Message.getField(this, 101) != null;
};


/**
 * optional Process.Update processUpdate = 102;
 * @return {?proto.anytype.Event.Process.Update}
 */
proto.anytype.Event.Message.prototype.getProcessupdate = function() {
  return /** @type{?proto.anytype.Event.Process.Update} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Process.Update, 102));
};


/**
 * @param {?proto.anytype.Event.Process.Update|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setProcessupdate = function(value) {
  return jspb.Message.setOneofWrapperField(this, 102, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearProcessupdate = function() {
  return this.setProcessupdate(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasProcessupdate = function() {
  return jspb.Message.getField(this, 102) != null;
};


/**
 * optional Process.Done processDone = 103;
 * @return {?proto.anytype.Event.Process.Done}
 */
proto.anytype.Event.Message.prototype.getProcessdone = function() {
  return /** @type{?proto.anytype.Event.Process.Done} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Process.Done, 103));
};


/**
 * @param {?proto.anytype.Event.Process.Done|undefined} value
 * @return {!proto.anytype.Event.Message} returns this
*/
proto.anytype.Event.Message.prototype.setProcessdone = function(value) {
  return jspb.Message.setOneofWrapperField(this, 103, proto.anytype.Event.Message.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Message} returns this
 */
proto.anytype.Event.Message.prototype.clearProcessdone = function() {
  return this.setProcessdone(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Message.prototype.hasProcessdone = function() {
  return jspb.Message.getField(this, 103) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Account.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Account.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Account} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Account.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Account}
 */
proto.anytype.Event.Account.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Account;
  return proto.anytype.Event.Account.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Account} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Account}
 */
proto.anytype.Event.Account.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Account.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Account.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Account} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Account.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Account.Show.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Account.Show.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Account.Show} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Account.Show.toObject = function(includeInstance, msg) {
  var f, obj = {
    index: jspb.Message.getFieldWithDefault(msg, 1, 0),
    account: (f = msg.getAccount()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Account.Show}
 */
proto.anytype.Event.Account.Show.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Account.Show;
  return proto.anytype.Event.Account.Show.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Account.Show} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Account.Show}
 */
proto.anytype.Event.Account.Show.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setIndex(value);
      break;
    case 2:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account.deserializeBinaryFromReader);
      msg.setAccount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Account.Show.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Account.Show.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Account.Show} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Account.Show.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIndex();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getAccount();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account.serializeBinaryToWriter
    );
  }
};


/**
 * optional int32 index = 1;
 * @return {number}
 */
proto.anytype.Event.Account.Show.prototype.getIndex = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Account.Show} returns this
 */
proto.anytype.Event.Account.Show.prototype.setIndex = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional model.Account account = 2;
 * @return {?proto.anytype.model.Account}
 */
proto.anytype.Event.Account.Show.prototype.getAccount = function() {
  return /** @type{?proto.anytype.model.Account} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account, 2));
};


/**
 * @param {?proto.anytype.model.Account|undefined} value
 * @return {!proto.anytype.Event.Account.Show} returns this
*/
proto.anytype.Event.Account.Show.prototype.setAccount = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Account.Show} returns this
 */
proto.anytype.Event.Account.Show.prototype.clearAccount = function() {
  return this.setAccount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Account.Show.prototype.hasAccount = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Account.Details.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Account.Details.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Account.Details} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Account.Details.toObject = function(includeInstance, msg) {
  var f, obj = {
    profileid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    details: (f = msg.getDetails()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Account.Details}
 */
proto.anytype.Event.Account.Details.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Account.Details;
  return proto.anytype.Event.Account.Details.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Account.Details} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Account.Details}
 */
proto.anytype.Event.Account.Details.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setProfileid(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setDetails(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Account.Details.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Account.Details.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Account.Details} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Account.Details.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProfileid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDetails();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string profileId = 1;
 * @return {string}
 */
proto.anytype.Event.Account.Details.prototype.getProfileid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Account.Details} returns this
 */
proto.anytype.Event.Account.Details.prototype.setProfileid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Struct details = 2;
 * @return {?proto.google.protobuf.Struct}
 */
proto.anytype.Event.Account.Details.prototype.getDetails = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 2));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.anytype.Event.Account.Details} returns this
*/
proto.anytype.Event.Account.Details.prototype.setDetails = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Account.Details} returns this
 */
proto.anytype.Event.Account.Details.prototype.clearDetails = function() {
  return this.setDetails(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Account.Details.prototype.hasDetails = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block}
 */
proto.anytype.Event.Block.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block;
  return proto.anytype.Event.Block.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block}
 */
proto.anytype.Event.Block.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.Add.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Add.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Add.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Add} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Add.toObject = function(includeInstance, msg) {
  var f, obj = {
    blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Add}
 */
proto.anytype.Event.Block.Add.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Add;
  return proto.anytype.Event.Block.Add.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Add} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Add}
 */
proto.anytype.Event.Block.Add.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Add.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Add.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Add} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Add.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.serializeBinaryToWriter
    );
  }
};


/**
 * repeated model.Block blocks = 1;
 * @return {!Array<!proto.anytype.model.Block>}
 */
proto.anytype.Event.Block.Add.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.anytype.model.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block, 1));
};


/**
 * @param {!Array<!proto.anytype.model.Block>} value
 * @return {!proto.anytype.Event.Block.Add} returns this
*/
proto.anytype.Event.Block.Add.prototype.setBlocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.anytype.model.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.anytype.model.Block}
 */
proto.anytype.Event.Block.Add.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.anytype.model.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Add} returns this
 */
proto.anytype.Event.Block.Add.prototype.clearBlocksList = function() {
  return this.setBlocksList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.Show.repeatedFields_ = [2,3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Show.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Show.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Show} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Show.toObject = function(includeInstance, msg) {
  var f, obj = {
    rootid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    blocksList: jspb.Message.toObjectList(msg.getBlocksList(),
    vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.toObject, includeInstance),
    detailsList: jspb.Message.toObjectList(msg.getDetailsList(),
    proto.anytype.Event.Block.Set.Details.toObject, includeInstance),
    type: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Show}
 */
proto.anytype.Event.Block.Show.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Show;
  return proto.anytype.Event.Block.Show.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Show} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Show}
 */
proto.anytype.Event.Block.Show.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRootid(value);
      break;
    case 2:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.deserializeBinaryFromReader);
      msg.addBlocks(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Set.Details;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Details.deserializeBinaryFromReader);
      msg.addDetails(value);
      break;
    case 4:
      var value = /** @type {!proto.anytype.SmartBlockType} */ (reader.readEnum());
      msg.setType(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Show.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Show.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Show} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Show.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRootid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBlocksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.serializeBinaryToWriter
    );
  }
  f = message.getDetailsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.anytype.Event.Block.Set.Details.serializeBinaryToWriter
    );
  }
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      4,
      f
    );
  }
};


/**
 * optional string rootId = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Show.prototype.getRootid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Show} returns this
 */
proto.anytype.Event.Block.Show.prototype.setRootid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated model.Block blocks = 2;
 * @return {!Array<!proto.anytype.model.Block>}
 */
proto.anytype.Event.Block.Show.prototype.getBlocksList = function() {
  return /** @type{!Array<!proto.anytype.model.Block>} */ (
    jspb.Message.getRepeatedWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block, 2));
};


/**
 * @param {!Array<!proto.anytype.model.Block>} value
 * @return {!proto.anytype.Event.Block.Show} returns this
*/
proto.anytype.Event.Block.Show.prototype.setBlocksList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.anytype.model.Block=} opt_value
 * @param {number=} opt_index
 * @return {!proto.anytype.model.Block}
 */
proto.anytype.Event.Block.Show.prototype.addBlocks = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.anytype.model.Block, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Show} returns this
 */
proto.anytype.Event.Block.Show.prototype.clearBlocksList = function() {
  return this.setBlocksList([]);
};


/**
 * repeated Set.Details details = 3;
 * @return {!Array<!proto.anytype.Event.Block.Set.Details>}
 */
proto.anytype.Event.Block.Show.prototype.getDetailsList = function() {
  return /** @type{!Array<!proto.anytype.Event.Block.Set.Details>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.anytype.Event.Block.Set.Details, 3));
};


/**
 * @param {!Array<!proto.anytype.Event.Block.Set.Details>} value
 * @return {!proto.anytype.Event.Block.Show} returns this
*/
proto.anytype.Event.Block.Show.prototype.setDetailsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.anytype.Event.Block.Set.Details=} opt_value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Block.Set.Details}
 */
proto.anytype.Event.Block.Show.prototype.addDetails = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.anytype.Event.Block.Set.Details, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Show} returns this
 */
proto.anytype.Event.Block.Show.prototype.clearDetailsList = function() {
  return this.setDetailsList([]);
};


/**
 * optional SmartBlockType type = 4;
 * @return {!proto.anytype.SmartBlockType}
 */
proto.anytype.Event.Block.Show.prototype.getType = function() {
  return /** @type {!proto.anytype.SmartBlockType} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {!proto.anytype.SmartBlockType} value
 * @return {!proto.anytype.Event.Block.Show} returns this
 */
proto.anytype.Event.Block.Show.prototype.setType = function(value) {
  return jspb.Message.setProto3EnumField(this, 4, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.FilesUpload.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.FilesUpload.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.FilesUpload.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.FilesUpload} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.FilesUpload.toObject = function(includeInstance, msg) {
  var f, obj = {
    blockid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    filepathList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.FilesUpload}
 */
proto.anytype.Event.Block.FilesUpload.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.FilesUpload;
  return proto.anytype.Event.Block.FilesUpload.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.FilesUpload} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.FilesUpload}
 */
proto.anytype.Event.Block.FilesUpload.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setBlockid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addFilepath(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.FilesUpload.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.FilesUpload.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.FilesUpload} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.FilesUpload.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBlockid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getFilepathList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
};


/**
 * optional string blockId = 1;
 * @return {string}
 */
proto.anytype.Event.Block.FilesUpload.prototype.getBlockid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.FilesUpload} returns this
 */
proto.anytype.Event.Block.FilesUpload.prototype.setBlockid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string filePath = 2;
 * @return {!Array<string>}
 */
proto.anytype.Event.Block.FilesUpload.prototype.getFilepathList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.anytype.Event.Block.FilesUpload} returns this
 */
proto.anytype.Event.Block.FilesUpload.prototype.setFilepathList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Block.FilesUpload} returns this
 */
proto.anytype.Event.Block.FilesUpload.prototype.addFilepath = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.FilesUpload} returns this
 */
proto.anytype.Event.Block.FilesUpload.prototype.clearFilepathList = function() {
  return this.setFilepathList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.Delete.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Delete.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Delete.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Delete} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Delete.toObject = function(includeInstance, msg) {
  var f, obj = {
    blockidsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Delete}
 */
proto.anytype.Event.Block.Delete.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Delete;
  return proto.anytype.Event.Block.Delete.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Delete} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Delete}
 */
proto.anytype.Event.Block.Delete.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addBlockids(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Delete.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Delete.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Delete} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Delete.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBlockidsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Delete.Dataview.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Delete.Dataview.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Delete.Dataview} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Delete.Dataview.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Delete.Dataview}
 */
proto.anytype.Event.Block.Delete.Dataview.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Delete.Dataview;
  return proto.anytype.Event.Block.Delete.Dataview.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Delete.Dataview} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Delete.Dataview}
 */
proto.anytype.Event.Block.Delete.Dataview.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Delete.Dataview.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Delete.Dataview.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Delete.Dataview} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Delete.Dataview.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Delete.Dataview.View.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Delete.Dataview.View.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Delete.Dataview.View} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Delete.Dataview.View.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    viewid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Delete.Dataview.View}
 */
proto.anytype.Event.Block.Delete.Dataview.View.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Delete.Dataview.View;
  return proto.anytype.Event.Block.Delete.Dataview.View.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Delete.Dataview.View} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Delete.Dataview.View}
 */
proto.anytype.Event.Block.Delete.Dataview.View.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setViewid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Delete.Dataview.View.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Delete.Dataview.View.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Delete.Dataview.View} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Delete.Dataview.View.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getViewid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Delete.Dataview.View.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Delete.Dataview.View} returns this
 */
proto.anytype.Event.Block.Delete.Dataview.View.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string viewId = 2;
 * @return {string}
 */
proto.anytype.Event.Block.Delete.Dataview.View.prototype.getViewid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Delete.Dataview.View} returns this
 */
proto.anytype.Event.Block.Delete.Dataview.View.prototype.setViewid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated string blockIds = 1;
 * @return {!Array<string>}
 */
proto.anytype.Event.Block.Delete.prototype.getBlockidsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.anytype.Event.Block.Delete} returns this
 */
proto.anytype.Event.Block.Delete.prototype.setBlockidsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Block.Delete} returns this
 */
proto.anytype.Event.Block.Delete.prototype.addBlockids = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Delete} returns this
 */
proto.anytype.Event.Block.Delete.prototype.clearBlockidsList = function() {
  return this.setBlockidsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.MarksInfo.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.MarksInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.MarksInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.MarksInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.MarksInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    marksinrangeList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.MarksInfo}
 */
proto.anytype.Event.Block.MarksInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.MarksInfo;
  return proto.anytype.Event.Block.MarksInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.MarksInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.MarksInfo}
 */
proto.anytype.Event.Block.MarksInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!Array<!proto.anytype.model.Block.Content.Text.Mark.Type>} */ (reader.readPackedEnum());
      msg.setMarksinrangeList(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.MarksInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.MarksInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.MarksInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.MarksInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMarksinrangeList();
  if (f.length > 0) {
    writer.writePackedEnum(
      1,
      f
    );
  }
};


/**
 * repeated model.Block.Content.Text.Mark.Type marksInRange = 1;
 * @return {!Array<!proto.anytype.model.Block.Content.Text.Mark.Type>}
 */
proto.anytype.Event.Block.MarksInfo.prototype.getMarksinrangeList = function() {
  return /** @type {!Array<!proto.anytype.model.Block.Content.Text.Mark.Type>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<!proto.anytype.model.Block.Content.Text.Mark.Type>} value
 * @return {!proto.anytype.Event.Block.MarksInfo} returns this
 */
proto.anytype.Event.Block.MarksInfo.prototype.setMarksinrangeList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {!proto.anytype.model.Block.Content.Text.Mark.Type} value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Block.MarksInfo} returns this
 */
proto.anytype.Event.Block.MarksInfo.prototype.addMarksinrange = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.MarksInfo} returns this
 */
proto.anytype.Event.Block.MarksInfo.prototype.clearMarksinrangeList = function() {
  return this.setMarksinrangeList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set}
 */
proto.anytype.Event.Block.Set.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set;
  return proto.anytype.Event.Block.Set.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set}
 */
proto.anytype.Event.Block.Set.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Details.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Details.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Details} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Details.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    details: (f = msg.getDetails()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Details}
 */
proto.anytype.Event.Block.Set.Details.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Details;
  return proto.anytype.Event.Block.Set.Details.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Details} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Details}
 */
proto.anytype.Event.Block.Set.Details.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setDetails(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Details.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Details.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Details} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Details.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDetails();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Details.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Details} returns this
 */
proto.anytype.Event.Block.Set.Details.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Struct details = 2;
 * @return {?proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Set.Details.prototype.getDetails = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 2));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Details} returns this
*/
proto.anytype.Event.Block.Set.Details.prototype.setDetails = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Details} returns this
 */
proto.anytype.Event.Block.Set.Details.prototype.clearDetails = function() {
  return this.setDetails(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Details.prototype.hasDetails = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Dataview.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Dataview.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Dataview} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Dataview.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Dataview}
 */
proto.anytype.Event.Block.Set.Dataview.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Dataview;
  return proto.anytype.Event.Block.Set.Dataview.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Dataview} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Dataview}
 */
proto.anytype.Event.Block.Set.Dataview.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Dataview.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Dataview.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Dataview} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Dataview.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.Set.Dataview.Records.repeatedFields_ = [3,4,6];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Dataview.Records.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Dataview.Records} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Dataview.Records.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    viewid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    updatedList: jspb.Message.toObjectList(msg.getUpdatedList(),
    google_protobuf_struct_pb.Struct.toObject, includeInstance),
    insertedList: jspb.Message.toObjectList(msg.getInsertedList(),
    google_protobuf_struct_pb.Struct.toObject, includeInstance),
    insertposition: jspb.Message.getFieldWithDefault(msg, 5, 0),
    removedList: (f = jspb.Message.getRepeatedField(msg, 6)) == null ? undefined : f,
    total: jspb.Message.getFieldWithDefault(msg, 7, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records}
 */
proto.anytype.Event.Block.Set.Dataview.Records.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Dataview.Records;
  return proto.anytype.Event.Block.Set.Dataview.Records.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Dataview.Records} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records}
 */
proto.anytype.Event.Block.Set.Dataview.Records.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setViewid(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.addUpdated(value);
      break;
    case 4:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.addInserted(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setInsertposition(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.addRemoved(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setTotal(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Dataview.Records.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Dataview.Records} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Dataview.Records.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getViewid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getUpdatedList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getInsertedList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getInsertposition();
  if (f !== 0) {
    writer.writeUint32(
      5,
      f
    );
  }
  f = message.getRemovedList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      6,
      f
    );
  }
  f = message.getTotal();
  if (f !== 0) {
    writer.writeUint32(
      7,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string viewId = 2;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.getViewid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.setViewid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated google.protobuf.Struct updated = 3;
 * @return {!Array<!proto.google.protobuf.Struct>}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.getUpdatedList = function() {
  return /** @type{!Array<!proto.google.protobuf.Struct>} */ (
    jspb.Message.getRepeatedWrapperField(this, google_protobuf_struct_pb.Struct, 3));
};


/**
 * @param {!Array<!proto.google.protobuf.Struct>} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
*/
proto.anytype.Event.Block.Set.Dataview.Records.prototype.setUpdatedList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.google.protobuf.Struct=} opt_value
 * @param {number=} opt_index
 * @return {!proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.addUpdated = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.google.protobuf.Struct, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.clearUpdatedList = function() {
  return this.setUpdatedList([]);
};


/**
 * repeated google.protobuf.Struct inserted = 4;
 * @return {!Array<!proto.google.protobuf.Struct>}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.getInsertedList = function() {
  return /** @type{!Array<!proto.google.protobuf.Struct>} */ (
    jspb.Message.getRepeatedWrapperField(this, google_protobuf_struct_pb.Struct, 4));
};


/**
 * @param {!Array<!proto.google.protobuf.Struct>} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
*/
proto.anytype.Event.Block.Set.Dataview.Records.prototype.setInsertedList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.google.protobuf.Struct=} opt_value
 * @param {number=} opt_index
 * @return {!proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.addInserted = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.google.protobuf.Struct, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.clearInsertedList = function() {
  return this.setInsertedList([]);
};


/**
 * optional uint32 insertPosition = 5;
 * @return {number}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.getInsertposition = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.setInsertposition = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * repeated string removed = 6;
 * @return {!Array<string>}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.getRemovedList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 6));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.setRemovedList = function(value) {
  return jspb.Message.setField(this, 6, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.addRemoved = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 6, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.clearRemovedList = function() {
  return this.setRemovedList([]);
};


/**
 * optional uint32 total = 7;
 * @return {number}
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.getTotal = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.Records} returns this
 */
proto.anytype.Event.Block.Set.Dataview.Records.prototype.setTotal = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Dataview.View.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Dataview.View} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Dataview.View.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    viewid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    view: (f = msg.getView()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Dataview.View.toObject(includeInstance, f),
    offset: jspb.Message.getFieldWithDefault(msg, 4, 0),
    limit: jspb.Message.getFieldWithDefault(msg, 5, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Dataview.View}
 */
proto.anytype.Event.Block.Set.Dataview.View.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Dataview.View;
  return proto.anytype.Event.Block.Set.Dataview.View.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Dataview.View} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Dataview.View}
 */
proto.anytype.Event.Block.Set.Dataview.View.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setViewid(value);
      break;
    case 3:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Dataview.View;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Dataview.View.deserializeBinaryFromReader);
      msg.setView(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setOffset(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setLimit(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Dataview.View.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Dataview.View} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Dataview.View.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getViewid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getView();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Dataview.View.serializeBinaryToWriter
    );
  }
  f = message.getOffset();
  if (f !== 0) {
    writer.writeUint32(
      4,
      f
    );
  }
  f = message.getLimit();
  if (f !== 0) {
    writer.writeUint32(
      5,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.View} returns this
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string viewId = 2;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.getViewid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.View} returns this
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.setViewid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional model.Block.Content.Dataview.View view = 3;
 * @return {?proto.anytype.model.Block.Content.Dataview.View}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.getView = function() {
  return /** @type{?proto.anytype.model.Block.Content.Dataview.View} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Dataview.View, 3));
};


/**
 * @param {?proto.anytype.model.Block.Content.Dataview.View|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.View} returns this
*/
proto.anytype.Event.Block.Set.Dataview.View.prototype.setView = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Dataview.View} returns this
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.clearView = function() {
  return this.setView(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.hasView = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional uint32 offset = 4;
 * @return {number}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.getOffset = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.View} returns this
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.setOffset = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional uint32 limit = 5;
 * @return {number}
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.getLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Set.Dataview.View} returns this
 */
proto.anytype.Event.Block.Set.Dataview.View.prototype.setLimit = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Fields.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Fields.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Fields} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Fields.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    fields: (f = msg.getFields()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Fields}
 */
proto.anytype.Event.Block.Set.Fields.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Fields;
  return proto.anytype.Event.Block.Set.Fields.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Fields} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Fields}
 */
proto.anytype.Event.Block.Set.Fields.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setFields(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Fields.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Fields.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Fields} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Fields.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getFields();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Fields.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Fields} returns this
 */
proto.anytype.Event.Block.Set.Fields.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Struct fields = 2;
 * @return {?proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Set.Fields.prototype.getFields = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 2));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Fields} returns this
*/
proto.anytype.Event.Block.Set.Fields.prototype.setFields = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Fields} returns this
 */
proto.anytype.Event.Block.Set.Fields.prototype.clearFields = function() {
  return this.setFields(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Fields.prototype.hasFields = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.Set.ChildrenIds.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.ChildrenIds.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.ChildrenIds} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.ChildrenIds.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    childrenidsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.ChildrenIds}
 */
proto.anytype.Event.Block.Set.ChildrenIds.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.ChildrenIds;
  return proto.anytype.Event.Block.Set.ChildrenIds.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.ChildrenIds} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.ChildrenIds}
 */
proto.anytype.Event.Block.Set.ChildrenIds.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addChildrenids(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.ChildrenIds.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.ChildrenIds} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.ChildrenIds.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChildrenidsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string childrenIds = 2;
 * @return {!Array<string>}
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.getChildrenidsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.anytype.Event.Block.Set.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.setChildrenidsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Block.Set.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.addChildrenids = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Set.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Set.ChildrenIds.prototype.clearChildrenidsList = function() {
  return this.setChildrenidsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Restrictions.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Restrictions.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Restrictions} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Restrictions.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    restrictions: (f = msg.getRestrictions()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Restrictions}
 */
proto.anytype.Event.Block.Set.Restrictions.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Restrictions;
  return proto.anytype.Event.Block.Set.Restrictions.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Restrictions} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Restrictions}
 */
proto.anytype.Event.Block.Set.Restrictions.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions.deserializeBinaryFromReader);
      msg.setRestrictions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Restrictions.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Restrictions.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Restrictions} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Restrictions.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRestrictions();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Restrictions.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Restrictions} returns this
 */
proto.anytype.Event.Block.Set.Restrictions.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional model.Block.Restrictions restrictions = 2;
 * @return {?proto.anytype.model.Block.Restrictions}
 */
proto.anytype.Event.Block.Set.Restrictions.prototype.getRestrictions = function() {
  return /** @type{?proto.anytype.model.Block.Restrictions} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions, 2));
};


/**
 * @param {?proto.anytype.model.Block.Restrictions|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Restrictions} returns this
*/
proto.anytype.Event.Block.Set.Restrictions.prototype.setRestrictions = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Restrictions} returns this
 */
proto.anytype.Event.Block.Set.Restrictions.prototype.clearRestrictions = function() {
  return this.setRestrictions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Restrictions.prototype.hasRestrictions = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.BackgroundColor.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.BackgroundColor.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.BackgroundColor} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.BackgroundColor.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    backgroundcolor: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.BackgroundColor}
 */
proto.anytype.Event.Block.Set.BackgroundColor.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.BackgroundColor;
  return proto.anytype.Event.Block.Set.BackgroundColor.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.BackgroundColor} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.BackgroundColor}
 */
proto.anytype.Event.Block.Set.BackgroundColor.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBackgroundcolor(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.BackgroundColor.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.BackgroundColor.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.BackgroundColor} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.BackgroundColor.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBackgroundcolor();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.BackgroundColor.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.BackgroundColor} returns this
 */
proto.anytype.Event.Block.Set.BackgroundColor.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string backgroundColor = 2;
 * @return {string}
 */
proto.anytype.Event.Block.Set.BackgroundColor.prototype.getBackgroundcolor = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.BackgroundColor} returns this
 */
proto.anytype.Event.Block.Set.BackgroundColor.prototype.setBackgroundcolor = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Align.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Align.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Align} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Align.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    align: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Align}
 */
proto.anytype.Event.Block.Set.Align.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Align;
  return proto.anytype.Event.Block.Set.Align.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Align} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Align}
 */
proto.anytype.Event.Block.Set.Align.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {!proto.anytype.model.Block.Align} */ (reader.readEnum());
      msg.setAlign(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Align.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Align.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Align} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Align.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAlign();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Align.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Align} returns this
 */
proto.anytype.Event.Block.Set.Align.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional model.Block.Align align = 2;
 * @return {!proto.anytype.model.Block.Align}
 */
proto.anytype.Event.Block.Set.Align.prototype.getAlign = function() {
  return /** @type {!proto.anytype.model.Block.Align} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.anytype.model.Block.Align} value
 * @return {!proto.anytype.Event.Block.Set.Align} returns this
 */
proto.anytype.Event.Block.Set.Align.prototype.setAlign = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Text.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Text.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Text} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    text: (f = msg.getText()) && proto.anytype.Event.Block.Set.Text.Text.toObject(includeInstance, f),
    style: (f = msg.getStyle()) && proto.anytype.Event.Block.Set.Text.Style.toObject(includeInstance, f),
    marks: (f = msg.getMarks()) && proto.anytype.Event.Block.Set.Text.Marks.toObject(includeInstance, f),
    checked: (f = msg.getChecked()) && proto.anytype.Event.Block.Set.Text.Checked.toObject(includeInstance, f),
    color: (f = msg.getColor()) && proto.anytype.Event.Block.Set.Text.Color.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Text}
 */
proto.anytype.Event.Block.Set.Text.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Text;
  return proto.anytype.Event.Block.Set.Text.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Text} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Text}
 */
proto.anytype.Event.Block.Set.Text.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Set.Text.Text;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Text.Text.deserializeBinaryFromReader);
      msg.setText(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Set.Text.Style;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Text.Style.deserializeBinaryFromReader);
      msg.setStyle(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Set.Text.Marks;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Text.Marks.deserializeBinaryFromReader);
      msg.setMarks(value);
      break;
    case 5:
      var value = new proto.anytype.Event.Block.Set.Text.Checked;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Text.Checked.deserializeBinaryFromReader);
      msg.setChecked(value);
      break;
    case 6:
      var value = new proto.anytype.Event.Block.Set.Text.Color;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Text.Color.deserializeBinaryFromReader);
      msg.setColor(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Text.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Text.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Text} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getText();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Set.Text.Text.serializeBinaryToWriter
    );
  }
  f = message.getStyle();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Set.Text.Style.serializeBinaryToWriter
    );
  }
  f = message.getMarks();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Set.Text.Marks.serializeBinaryToWriter
    );
  }
  f = message.getChecked();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.anytype.Event.Block.Set.Text.Checked.serializeBinaryToWriter
    );
  }
  f = message.getColor();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.anytype.Event.Block.Set.Text.Color.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Text.Text.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Text.Text.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Text.Text} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Text.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Text.Text}
 */
proto.anytype.Event.Block.Set.Text.Text.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Text.Text;
  return proto.anytype.Event.Block.Set.Text.Text.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Text.Text} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Text.Text}
 */
proto.anytype.Event.Block.Set.Text.Text.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Text.Text.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Text.Text.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Text.Text} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Text.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Text.Text.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Text.Text} returns this
 */
proto.anytype.Event.Block.Set.Text.Text.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Text.Style.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Text.Style.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Text.Style} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Style.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Text.Style}
 */
proto.anytype.Event.Block.Set.Text.Style.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Text.Style;
  return proto.anytype.Event.Block.Set.Text.Style.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Text.Style} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Text.Style}
 */
proto.anytype.Event.Block.Set.Text.Style.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.Text.Style} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Text.Style.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Text.Style.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Text.Style} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Style.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.Text.Style value = 1;
 * @return {!proto.anytype.model.Block.Content.Text.Style}
 */
proto.anytype.Event.Block.Set.Text.Style.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.Text.Style} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.Text.Style} value
 * @return {!proto.anytype.Event.Block.Set.Text.Style} returns this
 */
proto.anytype.Event.Block.Set.Text.Style.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Text.Marks.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Text.Marks.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Text.Marks} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Marks.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: (f = msg.getValue()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Text.Marks}
 */
proto.anytype.Event.Block.Set.Text.Marks.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Text.Marks;
  return proto.anytype.Event.Block.Set.Text.Marks.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Text.Marks} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Text.Marks}
 */
proto.anytype.Event.Block.Set.Text.Marks.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks.deserializeBinaryFromReader);
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Text.Marks.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Text.Marks.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Text.Marks} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Marks.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks.serializeBinaryToWriter
    );
  }
};


/**
 * optional model.Block.Content.Text.Marks value = 1;
 * @return {?proto.anytype.model.Block.Content.Text.Marks}
 */
proto.anytype.Event.Block.Set.Text.Marks.prototype.getValue = function() {
  return /** @type{?proto.anytype.model.Block.Content.Text.Marks} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks, 1));
};


/**
 * @param {?proto.anytype.model.Block.Content.Text.Marks|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Text.Marks} returns this
*/
proto.anytype.Event.Block.Set.Text.Marks.prototype.setValue = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Text.Marks} returns this
 */
proto.anytype.Event.Block.Set.Text.Marks.prototype.clearValue = function() {
  return this.setValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Text.Marks.prototype.hasValue = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Text.Checked.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Text.Checked.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Text.Checked} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Checked.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Text.Checked}
 */
proto.anytype.Event.Block.Set.Text.Checked.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Text.Checked;
  return proto.anytype.Event.Block.Set.Text.Checked.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Text.Checked} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Text.Checked}
 */
proto.anytype.Event.Block.Set.Text.Checked.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Text.Checked.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Text.Checked.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Text.Checked} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Checked.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool value = 1;
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Text.Checked.prototype.getValue = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.anytype.Event.Block.Set.Text.Checked} returns this
 */
proto.anytype.Event.Block.Set.Text.Checked.prototype.setValue = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Text.Color.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Text.Color.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Text.Color} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Color.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Text.Color}
 */
proto.anytype.Event.Block.Set.Text.Color.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Text.Color;
  return proto.anytype.Event.Block.Set.Text.Color.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Text.Color} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Text.Color}
 */
proto.anytype.Event.Block.Set.Text.Color.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Text.Color.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Text.Color.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Text.Color} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Text.Color.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Text.Color.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Text.Color} returns this
 */
proto.anytype.Event.Block.Set.Text.Color.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Text.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
 */
proto.anytype.Event.Block.Set.Text.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Text text = 2;
 * @return {?proto.anytype.Event.Block.Set.Text.Text}
 */
proto.anytype.Event.Block.Set.Text.prototype.getText = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Text.Text} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Text.Text, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Text.Text|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
*/
proto.anytype.Event.Block.Set.Text.prototype.setText = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
 */
proto.anytype.Event.Block.Set.Text.prototype.clearText = function() {
  return this.setText(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Text.prototype.hasText = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Style style = 3;
 * @return {?proto.anytype.Event.Block.Set.Text.Style}
 */
proto.anytype.Event.Block.Set.Text.prototype.getStyle = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Text.Style} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Text.Style, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Text.Style|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
*/
proto.anytype.Event.Block.Set.Text.prototype.setStyle = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
 */
proto.anytype.Event.Block.Set.Text.prototype.clearStyle = function() {
  return this.setStyle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Text.prototype.hasStyle = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Marks marks = 4;
 * @return {?proto.anytype.Event.Block.Set.Text.Marks}
 */
proto.anytype.Event.Block.Set.Text.prototype.getMarks = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Text.Marks} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Text.Marks, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Text.Marks|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
*/
proto.anytype.Event.Block.Set.Text.prototype.setMarks = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
 */
proto.anytype.Event.Block.Set.Text.prototype.clearMarks = function() {
  return this.setMarks(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Text.prototype.hasMarks = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Checked checked = 5;
 * @return {?proto.anytype.Event.Block.Set.Text.Checked}
 */
proto.anytype.Event.Block.Set.Text.prototype.getChecked = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Text.Checked} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Text.Checked, 5));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Text.Checked|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
*/
proto.anytype.Event.Block.Set.Text.prototype.setChecked = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
 */
proto.anytype.Event.Block.Set.Text.prototype.clearChecked = function() {
  return this.setChecked(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Text.prototype.hasChecked = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Color color = 6;
 * @return {?proto.anytype.Event.Block.Set.Text.Color}
 */
proto.anytype.Event.Block.Set.Text.prototype.getColor = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Text.Color} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Text.Color, 6));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Text.Color|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
*/
proto.anytype.Event.Block.Set.Text.prototype.setColor = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Text} returns this
 */
proto.anytype.Event.Block.Set.Text.prototype.clearColor = function() {
  return this.setColor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Text.prototype.hasColor = function() {
  return jspb.Message.getField(this, 6) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Div.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Div.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Div} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Div.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    style: (f = msg.getStyle()) && proto.anytype.Event.Block.Set.Div.Style.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Div}
 */
proto.anytype.Event.Block.Set.Div.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Div;
  return proto.anytype.Event.Block.Set.Div.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Div} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Div}
 */
proto.anytype.Event.Block.Set.Div.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Set.Div.Style;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Div.Style.deserializeBinaryFromReader);
      msg.setStyle(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Div.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Div.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Div} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Div.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStyle();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Set.Div.Style.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Div.Style.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Div.Style.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Div.Style} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Div.Style.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Div.Style}
 */
proto.anytype.Event.Block.Set.Div.Style.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Div.Style;
  return proto.anytype.Event.Block.Set.Div.Style.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Div.Style} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Div.Style}
 */
proto.anytype.Event.Block.Set.Div.Style.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.Div.Style} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Div.Style.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Div.Style.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Div.Style} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Div.Style.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.Div.Style value = 1;
 * @return {!proto.anytype.model.Block.Content.Div.Style}
 */
proto.anytype.Event.Block.Set.Div.Style.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.Div.Style} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.Div.Style} value
 * @return {!proto.anytype.Event.Block.Set.Div.Style} returns this
 */
proto.anytype.Event.Block.Set.Div.Style.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Div.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Div} returns this
 */
proto.anytype.Event.Block.Set.Div.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Style style = 2;
 * @return {?proto.anytype.Event.Block.Set.Div.Style}
 */
proto.anytype.Event.Block.Set.Div.prototype.getStyle = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Div.Style} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Div.Style, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Div.Style|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Div} returns this
*/
proto.anytype.Event.Block.Set.Div.prototype.setStyle = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Div} returns this
 */
proto.anytype.Event.Block.Set.Div.prototype.clearStyle = function() {
  return this.setStyle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Div.prototype.hasStyle = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    type: (f = msg.getType()) && proto.anytype.Event.Block.Set.File.Type.toObject(includeInstance, f),
    state: (f = msg.getState()) && proto.anytype.Event.Block.Set.File.State.toObject(includeInstance, f),
    mime: (f = msg.getMime()) && proto.anytype.Event.Block.Set.File.Mime.toObject(includeInstance, f),
    hash: (f = msg.getHash()) && proto.anytype.Event.Block.Set.File.Hash.toObject(includeInstance, f),
    name: (f = msg.getName()) && proto.anytype.Event.Block.Set.File.Name.toObject(includeInstance, f),
    size: (f = msg.getSize()) && proto.anytype.Event.Block.Set.File.Size.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File}
 */
proto.anytype.Event.Block.Set.File.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File;
  return proto.anytype.Event.Block.Set.File.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File}
 */
proto.anytype.Event.Block.Set.File.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Set.File.Type;
      reader.readMessage(value,proto.anytype.Event.Block.Set.File.Type.deserializeBinaryFromReader);
      msg.setType(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Set.File.State;
      reader.readMessage(value,proto.anytype.Event.Block.Set.File.State.deserializeBinaryFromReader);
      msg.setState(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Set.File.Mime;
      reader.readMessage(value,proto.anytype.Event.Block.Set.File.Mime.deserializeBinaryFromReader);
      msg.setMime(value);
      break;
    case 5:
      var value = new proto.anytype.Event.Block.Set.File.Hash;
      reader.readMessage(value,proto.anytype.Event.Block.Set.File.Hash.deserializeBinaryFromReader);
      msg.setHash(value);
      break;
    case 6:
      var value = new proto.anytype.Event.Block.Set.File.Name;
      reader.readMessage(value,proto.anytype.Event.Block.Set.File.Name.deserializeBinaryFromReader);
      msg.setName(value);
      break;
    case 7:
      var value = new proto.anytype.Event.Block.Set.File.Size;
      reader.readMessage(value,proto.anytype.Event.Block.Set.File.Size.deserializeBinaryFromReader);
      msg.setSize(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Set.File.Type.serializeBinaryToWriter
    );
  }
  f = message.getState();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Set.File.State.serializeBinaryToWriter
    );
  }
  f = message.getMime();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Set.File.Mime.serializeBinaryToWriter
    );
  }
  f = message.getHash();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.anytype.Event.Block.Set.File.Hash.serializeBinaryToWriter
    );
  }
  f = message.getName();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.anytype.Event.Block.Set.File.Name.serializeBinaryToWriter
    );
  }
  f = message.getSize();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.anytype.Event.Block.Set.File.Size.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.Name.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.Name.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File.Name} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Name.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File.Name}
 */
proto.anytype.Event.Block.Set.File.Name.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File.Name;
  return proto.anytype.Event.Block.Set.File.Name.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File.Name} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File.Name}
 */
proto.anytype.Event.Block.Set.File.Name.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.Name.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.Name.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File.Name} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Name.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.File.Name.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.File.Name} returns this
 */
proto.anytype.Event.Block.Set.File.Name.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.Width.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.Width.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File.Width} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Width.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File.Width}
 */
proto.anytype.Event.Block.Set.File.Width.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File.Width;
  return proto.anytype.Event.Block.Set.File.Width.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File.Width} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File.Width}
 */
proto.anytype.Event.Block.Set.File.Width.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.Width.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.Width.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File.Width} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Width.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
};


/**
 * optional int32 value = 1;
 * @return {number}
 */
proto.anytype.Event.Block.Set.File.Width.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Set.File.Width} returns this
 */
proto.anytype.Event.Block.Set.File.Width.prototype.setValue = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.State.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.State.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File.State} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.State.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File.State}
 */
proto.anytype.Event.Block.Set.File.State.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File.State;
  return proto.anytype.Event.Block.Set.File.State.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File.State} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File.State}
 */
proto.anytype.Event.Block.Set.File.State.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.File.State} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.State.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.State.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File.State} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.State.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.File.State value = 1;
 * @return {!proto.anytype.model.Block.Content.File.State}
 */
proto.anytype.Event.Block.Set.File.State.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.File.State} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.File.State} value
 * @return {!proto.anytype.Event.Block.Set.File.State} returns this
 */
proto.anytype.Event.Block.Set.File.State.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.Type.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.Type.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File.Type} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Type.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File.Type}
 */
proto.anytype.Event.Block.Set.File.Type.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File.Type;
  return proto.anytype.Event.Block.Set.File.Type.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File.Type} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File.Type}
 */
proto.anytype.Event.Block.Set.File.Type.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.File.Type} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.Type.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.Type.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File.Type} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Type.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.File.Type value = 1;
 * @return {!proto.anytype.model.Block.Content.File.Type}
 */
proto.anytype.Event.Block.Set.File.Type.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.File.Type} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.File.Type} value
 * @return {!proto.anytype.Event.Block.Set.File.Type} returns this
 */
proto.anytype.Event.Block.Set.File.Type.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.Hash.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.Hash.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File.Hash} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Hash.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File.Hash}
 */
proto.anytype.Event.Block.Set.File.Hash.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File.Hash;
  return proto.anytype.Event.Block.Set.File.Hash.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File.Hash} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File.Hash}
 */
proto.anytype.Event.Block.Set.File.Hash.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.Hash.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.Hash.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File.Hash} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Hash.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.File.Hash.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.File.Hash} returns this
 */
proto.anytype.Event.Block.Set.File.Hash.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.Mime.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.Mime.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File.Mime} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Mime.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File.Mime}
 */
proto.anytype.Event.Block.Set.File.Mime.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File.Mime;
  return proto.anytype.Event.Block.Set.File.Mime.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File.Mime} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File.Mime}
 */
proto.anytype.Event.Block.Set.File.Mime.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.Mime.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.Mime.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File.Mime} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Mime.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.File.Mime.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.File.Mime} returns this
 */
proto.anytype.Event.Block.Set.File.Mime.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.File.Size.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.File.Size.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.File.Size} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Size.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.File.Size}
 */
proto.anytype.Event.Block.Set.File.Size.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.File.Size;
  return proto.anytype.Event.Block.Set.File.Size.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.File.Size} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.File.Size}
 */
proto.anytype.Event.Block.Set.File.Size.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.File.Size.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.File.Size.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.File.Size} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.File.Size.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 value = 1;
 * @return {number}
 */
proto.anytype.Event.Block.Set.File.Size.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Set.File.Size} returns this
 */
proto.anytype.Event.Block.Set.File.Size.prototype.setValue = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.File.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.File} returns this
 */
proto.anytype.Event.Block.Set.File.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Type type = 2;
 * @return {?proto.anytype.Event.Block.Set.File.Type}
 */
proto.anytype.Event.Block.Set.File.prototype.getType = function() {
  return /** @type{?proto.anytype.Event.Block.Set.File.Type} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.File.Type, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Set.File.Type|undefined} value
 * @return {!proto.anytype.Event.Block.Set.File} returns this
*/
proto.anytype.Event.Block.Set.File.prototype.setType = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.File} returns this
 */
proto.anytype.Event.Block.Set.File.prototype.clearType = function() {
  return this.setType(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.File.prototype.hasType = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional State state = 3;
 * @return {?proto.anytype.Event.Block.Set.File.State}
 */
proto.anytype.Event.Block.Set.File.prototype.getState = function() {
  return /** @type{?proto.anytype.Event.Block.Set.File.State} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.File.State, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Set.File.State|undefined} value
 * @return {!proto.anytype.Event.Block.Set.File} returns this
*/
proto.anytype.Event.Block.Set.File.prototype.setState = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.File} returns this
 */
proto.anytype.Event.Block.Set.File.prototype.clearState = function() {
  return this.setState(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.File.prototype.hasState = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Mime mime = 4;
 * @return {?proto.anytype.Event.Block.Set.File.Mime}
 */
proto.anytype.Event.Block.Set.File.prototype.getMime = function() {
  return /** @type{?proto.anytype.Event.Block.Set.File.Mime} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.File.Mime, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Set.File.Mime|undefined} value
 * @return {!proto.anytype.Event.Block.Set.File} returns this
*/
proto.anytype.Event.Block.Set.File.prototype.setMime = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.File} returns this
 */
proto.anytype.Event.Block.Set.File.prototype.clearMime = function() {
  return this.setMime(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.File.prototype.hasMime = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Hash hash = 5;
 * @return {?proto.anytype.Event.Block.Set.File.Hash}
 */
proto.anytype.Event.Block.Set.File.prototype.getHash = function() {
  return /** @type{?proto.anytype.Event.Block.Set.File.Hash} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.File.Hash, 5));
};


/**
 * @param {?proto.anytype.Event.Block.Set.File.Hash|undefined} value
 * @return {!proto.anytype.Event.Block.Set.File} returns this
*/
proto.anytype.Event.Block.Set.File.prototype.setHash = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.File} returns this
 */
proto.anytype.Event.Block.Set.File.prototype.clearHash = function() {
  return this.setHash(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.File.prototype.hasHash = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Name name = 6;
 * @return {?proto.anytype.Event.Block.Set.File.Name}
 */
proto.anytype.Event.Block.Set.File.prototype.getName = function() {
  return /** @type{?proto.anytype.Event.Block.Set.File.Name} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.File.Name, 6));
};


/**
 * @param {?proto.anytype.Event.Block.Set.File.Name|undefined} value
 * @return {!proto.anytype.Event.Block.Set.File} returns this
*/
proto.anytype.Event.Block.Set.File.prototype.setName = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.File} returns this
 */
proto.anytype.Event.Block.Set.File.prototype.clearName = function() {
  return this.setName(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.File.prototype.hasName = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional Size size = 7;
 * @return {?proto.anytype.Event.Block.Set.File.Size}
 */
proto.anytype.Event.Block.Set.File.prototype.getSize = function() {
  return /** @type{?proto.anytype.Event.Block.Set.File.Size} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.File.Size, 7));
};


/**
 * @param {?proto.anytype.Event.Block.Set.File.Size|undefined} value
 * @return {!proto.anytype.Event.Block.Set.File} returns this
*/
proto.anytype.Event.Block.Set.File.prototype.setSize = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.File} returns this
 */
proto.anytype.Event.Block.Set.File.prototype.clearSize = function() {
  return this.setSize(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.File.prototype.hasSize = function() {
  return jspb.Message.getField(this, 7) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Link.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Link.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Link} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    targetblockid: (f = msg.getTargetblockid()) && proto.anytype.Event.Block.Set.Link.TargetBlockId.toObject(includeInstance, f),
    style: (f = msg.getStyle()) && proto.anytype.Event.Block.Set.Link.Style.toObject(includeInstance, f),
    fields: (f = msg.getFields()) && proto.anytype.Event.Block.Set.Link.Fields.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Link}
 */
proto.anytype.Event.Block.Set.Link.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Link;
  return proto.anytype.Event.Block.Set.Link.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Link} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Link}
 */
proto.anytype.Event.Block.Set.Link.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Set.Link.TargetBlockId;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Link.TargetBlockId.deserializeBinaryFromReader);
      msg.setTargetblockid(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Set.Link.Style;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Link.Style.deserializeBinaryFromReader);
      msg.setStyle(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Set.Link.Fields;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Link.Fields.deserializeBinaryFromReader);
      msg.setFields(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Link.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Link.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Link} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTargetblockid();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Set.Link.TargetBlockId.serializeBinaryToWriter
    );
  }
  f = message.getStyle();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Set.Link.Style.serializeBinaryToWriter
    );
  }
  f = message.getFields();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Set.Link.Fields.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Link.TargetBlockId.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Link.TargetBlockId} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Link.TargetBlockId}
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Link.TargetBlockId;
  return proto.anytype.Event.Block.Set.Link.TargetBlockId.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Link.TargetBlockId} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Link.TargetBlockId}
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Link.TargetBlockId.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Link.TargetBlockId} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Link.TargetBlockId} returns this
 */
proto.anytype.Event.Block.Set.Link.TargetBlockId.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Link.Style.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Link.Style.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Link.Style} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.Style.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Link.Style}
 */
proto.anytype.Event.Block.Set.Link.Style.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Link.Style;
  return proto.anytype.Event.Block.Set.Link.Style.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Link.Style} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Link.Style}
 */
proto.anytype.Event.Block.Set.Link.Style.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.Link.Style} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Link.Style.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Link.Style.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Link.Style} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.Style.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.Link.Style value = 1;
 * @return {!proto.anytype.model.Block.Content.Link.Style}
 */
proto.anytype.Event.Block.Set.Link.Style.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.Link.Style} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.Link.Style} value
 * @return {!proto.anytype.Event.Block.Set.Link.Style} returns this
 */
proto.anytype.Event.Block.Set.Link.Style.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Link.Fields.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Link.Fields.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Link.Fields} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.Fields.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: (f = msg.getValue()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Link.Fields}
 */
proto.anytype.Event.Block.Set.Link.Fields.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Link.Fields;
  return proto.anytype.Event.Block.Set.Link.Fields.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Link.Fields} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Link.Fields}
 */
proto.anytype.Event.Block.Set.Link.Fields.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Link.Fields.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Link.Fields.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Link.Fields} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Link.Fields.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional google.protobuf.Struct value = 1;
 * @return {?proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Set.Link.Fields.prototype.getValue = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 1));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Link.Fields} returns this
*/
proto.anytype.Event.Block.Set.Link.Fields.prototype.setValue = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Link.Fields} returns this
 */
proto.anytype.Event.Block.Set.Link.Fields.prototype.clearValue = function() {
  return this.setValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Link.Fields.prototype.hasValue = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Link.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Link} returns this
 */
proto.anytype.Event.Block.Set.Link.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional TargetBlockId targetBlockId = 2;
 * @return {?proto.anytype.Event.Block.Set.Link.TargetBlockId}
 */
proto.anytype.Event.Block.Set.Link.prototype.getTargetblockid = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Link.TargetBlockId} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Link.TargetBlockId, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Link.TargetBlockId|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Link} returns this
*/
proto.anytype.Event.Block.Set.Link.prototype.setTargetblockid = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Link} returns this
 */
proto.anytype.Event.Block.Set.Link.prototype.clearTargetblockid = function() {
  return this.setTargetblockid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Link.prototype.hasTargetblockid = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Style style = 3;
 * @return {?proto.anytype.Event.Block.Set.Link.Style}
 */
proto.anytype.Event.Block.Set.Link.prototype.getStyle = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Link.Style} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Link.Style, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Link.Style|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Link} returns this
*/
proto.anytype.Event.Block.Set.Link.prototype.setStyle = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Link} returns this
 */
proto.anytype.Event.Block.Set.Link.prototype.clearStyle = function() {
  return this.setStyle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Link.prototype.hasStyle = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Fields fields = 4;
 * @return {?proto.anytype.Event.Block.Set.Link.Fields}
 */
proto.anytype.Event.Block.Set.Link.prototype.getFields = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Link.Fields} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Link.Fields, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Link.Fields|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Link} returns this
*/
proto.anytype.Event.Block.Set.Link.prototype.setFields = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Link} returns this
 */
proto.anytype.Event.Block.Set.Link.prototype.clearFields = function() {
  return this.setFields(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Link.prototype.hasFields = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Bookmark.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Bookmark} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    url: (f = msg.getUrl()) && proto.anytype.Event.Block.Set.Bookmark.Url.toObject(includeInstance, f),
    title: (f = msg.getTitle()) && proto.anytype.Event.Block.Set.Bookmark.Title.toObject(includeInstance, f),
    description: (f = msg.getDescription()) && proto.anytype.Event.Block.Set.Bookmark.Description.toObject(includeInstance, f),
    imagehash: (f = msg.getImagehash()) && proto.anytype.Event.Block.Set.Bookmark.ImageHash.toObject(includeInstance, f),
    faviconhash: (f = msg.getFaviconhash()) && proto.anytype.Event.Block.Set.Bookmark.FaviconHash.toObject(includeInstance, f),
    type: (f = msg.getType()) && proto.anytype.Event.Block.Set.Bookmark.Type.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Bookmark}
 */
proto.anytype.Event.Block.Set.Bookmark.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Bookmark;
  return proto.anytype.Event.Block.Set.Bookmark.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Bookmark} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Bookmark}
 */
proto.anytype.Event.Block.Set.Bookmark.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Set.Bookmark.Url;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Bookmark.Url.deserializeBinaryFromReader);
      msg.setUrl(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Set.Bookmark.Title;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Bookmark.Title.deserializeBinaryFromReader);
      msg.setTitle(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Set.Bookmark.Description;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Bookmark.Description.deserializeBinaryFromReader);
      msg.setDescription(value);
      break;
    case 5:
      var value = new proto.anytype.Event.Block.Set.Bookmark.ImageHash;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Bookmark.ImageHash.deserializeBinaryFromReader);
      msg.setImagehash(value);
      break;
    case 6:
      var value = new proto.anytype.Event.Block.Set.Bookmark.FaviconHash;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Bookmark.FaviconHash.deserializeBinaryFromReader);
      msg.setFaviconhash(value);
      break;
    case 7:
      var value = new proto.anytype.Event.Block.Set.Bookmark.Type;
      reader.readMessage(value,proto.anytype.Event.Block.Set.Bookmark.Type.deserializeBinaryFromReader);
      msg.setType(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Bookmark.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Bookmark} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUrl();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Set.Bookmark.Url.serializeBinaryToWriter
    );
  }
  f = message.getTitle();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Set.Bookmark.Title.serializeBinaryToWriter
    );
  }
  f = message.getDescription();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Set.Bookmark.Description.serializeBinaryToWriter
    );
  }
  f = message.getImagehash();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.anytype.Event.Block.Set.Bookmark.ImageHash.serializeBinaryToWriter
    );
  }
  f = message.getFaviconhash();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.anytype.Event.Block.Set.Bookmark.FaviconHash.serializeBinaryToWriter
    );
  }
  f = message.getType();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.anytype.Event.Block.Set.Bookmark.Type.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Bookmark.Url.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Bookmark.Url.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Url} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Url.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Url}
 */
proto.anytype.Event.Block.Set.Bookmark.Url.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Bookmark.Url;
  return proto.anytype.Event.Block.Set.Bookmark.Url.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Url} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Url}
 */
proto.anytype.Event.Block.Set.Bookmark.Url.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Bookmark.Url.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Bookmark.Url.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Url} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Url.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Bookmark.Url.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Url} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.Url.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Bookmark.Title.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Bookmark.Title.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Title} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Title.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Title}
 */
proto.anytype.Event.Block.Set.Bookmark.Title.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Bookmark.Title;
  return proto.anytype.Event.Block.Set.Bookmark.Title.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Title} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Title}
 */
proto.anytype.Event.Block.Set.Bookmark.Title.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Bookmark.Title.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Bookmark.Title.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Title} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Title.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Bookmark.Title.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Title} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.Title.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Bookmark.Description.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Bookmark.Description.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Description} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Description.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Description}
 */
proto.anytype.Event.Block.Set.Bookmark.Description.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Bookmark.Description;
  return proto.anytype.Event.Block.Set.Bookmark.Description.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Description} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Description}
 */
proto.anytype.Event.Block.Set.Bookmark.Description.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Bookmark.Description.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Bookmark.Description.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Description} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Description.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Bookmark.Description.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Description} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.Description.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Bookmark.ImageHash.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Bookmark.ImageHash} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.ImageHash}
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Bookmark.ImageHash;
  return proto.anytype.Event.Block.Set.Bookmark.ImageHash.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.ImageHash} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.ImageHash}
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Bookmark.ImageHash.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.ImageHash} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark.ImageHash} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.ImageHash.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Bookmark.FaviconHash.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Bookmark.FaviconHash} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.FaviconHash}
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Bookmark.FaviconHash;
  return proto.anytype.Event.Block.Set.Bookmark.FaviconHash.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.FaviconHash} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.FaviconHash}
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Bookmark.FaviconHash.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.FaviconHash} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark.FaviconHash} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.FaviconHash.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Set.Bookmark.Type.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Set.Bookmark.Type.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Type} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Type.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Type}
 */
proto.anytype.Event.Block.Set.Bookmark.Type.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Set.Bookmark.Type;
  return proto.anytype.Event.Block.Set.Bookmark.Type.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Type} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Type}
 */
proto.anytype.Event.Block.Set.Bookmark.Type.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.LinkPreview.Type} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Set.Bookmark.Type.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Set.Bookmark.Type.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Set.Bookmark.Type} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Set.Bookmark.Type.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.LinkPreview.Type value = 1;
 * @return {!proto.anytype.model.LinkPreview.Type}
 */
proto.anytype.Event.Block.Set.Bookmark.Type.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.LinkPreview.Type} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.LinkPreview.Type} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark.Type} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.Type.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Url url = 2;
 * @return {?proto.anytype.Event.Block.Set.Bookmark.Url}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.getUrl = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Bookmark.Url} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Bookmark.Url, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Bookmark.Url|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
*/
proto.anytype.Event.Block.Set.Bookmark.prototype.setUrl = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.clearUrl = function() {
  return this.setUrl(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.hasUrl = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Title title = 3;
 * @return {?proto.anytype.Event.Block.Set.Bookmark.Title}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.getTitle = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Bookmark.Title} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Bookmark.Title, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Bookmark.Title|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
*/
proto.anytype.Event.Block.Set.Bookmark.prototype.setTitle = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.clearTitle = function() {
  return this.setTitle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.hasTitle = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Description description = 4;
 * @return {?proto.anytype.Event.Block.Set.Bookmark.Description}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.getDescription = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Bookmark.Description} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Bookmark.Description, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Bookmark.Description|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
*/
proto.anytype.Event.Block.Set.Bookmark.prototype.setDescription = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.clearDescription = function() {
  return this.setDescription(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.hasDescription = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional ImageHash imageHash = 5;
 * @return {?proto.anytype.Event.Block.Set.Bookmark.ImageHash}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.getImagehash = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Bookmark.ImageHash} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Bookmark.ImageHash, 5));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Bookmark.ImageHash|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
*/
proto.anytype.Event.Block.Set.Bookmark.prototype.setImagehash = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.clearImagehash = function() {
  return this.setImagehash(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.hasImagehash = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional FaviconHash faviconHash = 6;
 * @return {?proto.anytype.Event.Block.Set.Bookmark.FaviconHash}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.getFaviconhash = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Bookmark.FaviconHash} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Bookmark.FaviconHash, 6));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Bookmark.FaviconHash|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
*/
proto.anytype.Event.Block.Set.Bookmark.prototype.setFaviconhash = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.clearFaviconhash = function() {
  return this.setFaviconhash(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.hasFaviconhash = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional Type type = 7;
 * @return {?proto.anytype.Event.Block.Set.Bookmark.Type}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.getType = function() {
  return /** @type{?proto.anytype.Event.Block.Set.Bookmark.Type} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Set.Bookmark.Type, 7));
};


/**
 * @param {?proto.anytype.Event.Block.Set.Bookmark.Type|undefined} value
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
*/
proto.anytype.Event.Block.Set.Bookmark.prototype.setType = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Set.Bookmark} returns this
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.clearType = function() {
  return this.setType(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Set.Bookmark.prototype.hasType = function() {
  return jspb.Message.getField(this, 7) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill}
 */
proto.anytype.Event.Block.Fill.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill;
  return proto.anytype.Event.Block.Fill.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill}
 */
proto.anytype.Event.Block.Fill.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Details.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Details.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Details} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Details.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    details: (f = msg.getDetails()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Details}
 */
proto.anytype.Event.Block.Fill.Details.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Details;
  return proto.anytype.Event.Block.Fill.Details.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Details} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Details}
 */
proto.anytype.Event.Block.Fill.Details.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setDetails(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Details.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Details.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Details} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Details.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDetails();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Details.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Details} returns this
 */
proto.anytype.Event.Block.Fill.Details.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Struct details = 2;
 * @return {?proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Fill.Details.prototype.getDetails = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 2));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Details} returns this
*/
proto.anytype.Event.Block.Fill.Details.prototype.setDetails = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Details} returns this
 */
proto.anytype.Event.Block.Fill.Details.prototype.clearDetails = function() {
  return this.setDetails(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Details.prototype.hasDetails = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.DatabaseRecords.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.DatabaseRecords} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    recordsList: jspb.Message.toObjectList(msg.getRecordsList(),
    google_protobuf_struct_pb.Struct.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.DatabaseRecords}
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.DatabaseRecords;
  return proto.anytype.Event.Block.Fill.DatabaseRecords.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.DatabaseRecords} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.DatabaseRecords}
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.addRecords(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.DatabaseRecords.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.DatabaseRecords} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRecordsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.DatabaseRecords} returns this
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated google.protobuf.Struct records = 2;
 * @return {!Array<!proto.google.protobuf.Struct>}
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.getRecordsList = function() {
  return /** @type{!Array<!proto.google.protobuf.Struct>} */ (
    jspb.Message.getRepeatedWrapperField(this, google_protobuf_struct_pb.Struct, 2));
};


/**
 * @param {!Array<!proto.google.protobuf.Struct>} value
 * @return {!proto.anytype.Event.Block.Fill.DatabaseRecords} returns this
*/
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.setRecordsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.google.protobuf.Struct=} opt_value
 * @param {number=} opt_index
 * @return {!proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.addRecords = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.google.protobuf.Struct, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Fill.DatabaseRecords} returns this
 */
proto.anytype.Event.Block.Fill.DatabaseRecords.prototype.clearRecordsList = function() {
  return this.setRecordsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Fields.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Fields.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Fields} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Fields.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    fields: (f = msg.getFields()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Fields}
 */
proto.anytype.Event.Block.Fill.Fields.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Fields;
  return proto.anytype.Event.Block.Fill.Fields.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Fields} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Fields}
 */
proto.anytype.Event.Block.Fill.Fields.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setFields(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Fields.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Fields.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Fields} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Fields.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getFields();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Fields.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Fields} returns this
 */
proto.anytype.Event.Block.Fill.Fields.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Struct fields = 2;
 * @return {?proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Fill.Fields.prototype.getFields = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 2));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Fields} returns this
*/
proto.anytype.Event.Block.Fill.Fields.prototype.setFields = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Fields} returns this
 */
proto.anytype.Event.Block.Fill.Fields.prototype.clearFields = function() {
  return this.setFields(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Fields.prototype.hasFields = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.Block.Fill.ChildrenIds.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.ChildrenIds.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.ChildrenIds} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.ChildrenIds.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    childrenidsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.ChildrenIds}
 */
proto.anytype.Event.Block.Fill.ChildrenIds.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.ChildrenIds;
  return proto.anytype.Event.Block.Fill.ChildrenIds.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.ChildrenIds} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.ChildrenIds}
 */
proto.anytype.Event.Block.Fill.ChildrenIds.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addChildrenids(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.ChildrenIds.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.ChildrenIds} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.ChildrenIds.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChildrenidsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string childrenIds = 2;
 * @return {!Array<string>}
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.getChildrenidsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.anytype.Event.Block.Fill.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.setChildrenidsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Block.Fill.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.addChildrenids = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.Block.Fill.ChildrenIds} returns this
 */
proto.anytype.Event.Block.Fill.ChildrenIds.prototype.clearChildrenidsList = function() {
  return this.setChildrenidsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Restrictions.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Restrictions.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Restrictions} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Restrictions.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    restrictions: (f = msg.getRestrictions()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Restrictions}
 */
proto.anytype.Event.Block.Fill.Restrictions.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Restrictions;
  return proto.anytype.Event.Block.Fill.Restrictions.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Restrictions} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Restrictions}
 */
proto.anytype.Event.Block.Fill.Restrictions.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions.deserializeBinaryFromReader);
      msg.setRestrictions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Restrictions.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Restrictions.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Restrictions} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Restrictions.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRestrictions();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Restrictions.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Restrictions} returns this
 */
proto.anytype.Event.Block.Fill.Restrictions.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional model.Block.Restrictions restrictions = 2;
 * @return {?proto.anytype.model.Block.Restrictions}
 */
proto.anytype.Event.Block.Fill.Restrictions.prototype.getRestrictions = function() {
  return /** @type{?proto.anytype.model.Block.Restrictions} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Restrictions, 2));
};


/**
 * @param {?proto.anytype.model.Block.Restrictions|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Restrictions} returns this
*/
proto.anytype.Event.Block.Fill.Restrictions.prototype.setRestrictions = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Restrictions} returns this
 */
proto.anytype.Event.Block.Fill.Restrictions.prototype.clearRestrictions = function() {
  return this.setRestrictions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Restrictions.prototype.hasRestrictions = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.BackgroundColor.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.BackgroundColor.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.BackgroundColor} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.BackgroundColor.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    backgroundcolor: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.BackgroundColor}
 */
proto.anytype.Event.Block.Fill.BackgroundColor.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.BackgroundColor;
  return proto.anytype.Event.Block.Fill.BackgroundColor.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.BackgroundColor} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.BackgroundColor}
 */
proto.anytype.Event.Block.Fill.BackgroundColor.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBackgroundcolor(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.BackgroundColor.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.BackgroundColor.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.BackgroundColor} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.BackgroundColor.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBackgroundcolor();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.BackgroundColor.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.BackgroundColor} returns this
 */
proto.anytype.Event.Block.Fill.BackgroundColor.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string backgroundColor = 2;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.BackgroundColor.prototype.getBackgroundcolor = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.BackgroundColor} returns this
 */
proto.anytype.Event.Block.Fill.BackgroundColor.prototype.setBackgroundcolor = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Align.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Align.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Align} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Align.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    align: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Align}
 */
proto.anytype.Event.Block.Fill.Align.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Align;
  return proto.anytype.Event.Block.Fill.Align.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Align} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Align}
 */
proto.anytype.Event.Block.Fill.Align.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {!proto.anytype.model.Block.Align} */ (reader.readEnum());
      msg.setAlign(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Align.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Align.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Align} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Align.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAlign();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Align.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Align} returns this
 */
proto.anytype.Event.Block.Fill.Align.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional model.Block.Align align = 2;
 * @return {!proto.anytype.model.Block.Align}
 */
proto.anytype.Event.Block.Fill.Align.prototype.getAlign = function() {
  return /** @type {!proto.anytype.model.Block.Align} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.anytype.model.Block.Align} value
 * @return {!proto.anytype.Event.Block.Fill.Align} returns this
 */
proto.anytype.Event.Block.Fill.Align.prototype.setAlign = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Text.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Text.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Text} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    text: (f = msg.getText()) && proto.anytype.Event.Block.Fill.Text.Text.toObject(includeInstance, f),
    style: (f = msg.getStyle()) && proto.anytype.Event.Block.Fill.Text.Style.toObject(includeInstance, f),
    marks: (f = msg.getMarks()) && proto.anytype.Event.Block.Fill.Text.Marks.toObject(includeInstance, f),
    checked: (f = msg.getChecked()) && proto.anytype.Event.Block.Fill.Text.Checked.toObject(includeInstance, f),
    color: (f = msg.getColor()) && proto.anytype.Event.Block.Fill.Text.Color.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Text}
 */
proto.anytype.Event.Block.Fill.Text.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Text;
  return proto.anytype.Event.Block.Fill.Text.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Text} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Text}
 */
proto.anytype.Event.Block.Fill.Text.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Fill.Text.Text;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Text.Text.deserializeBinaryFromReader);
      msg.setText(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Fill.Text.Style;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Text.Style.deserializeBinaryFromReader);
      msg.setStyle(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Fill.Text.Marks;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Text.Marks.deserializeBinaryFromReader);
      msg.setMarks(value);
      break;
    case 5:
      var value = new proto.anytype.Event.Block.Fill.Text.Checked;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Text.Checked.deserializeBinaryFromReader);
      msg.setChecked(value);
      break;
    case 6:
      var value = new proto.anytype.Event.Block.Fill.Text.Color;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Text.Color.deserializeBinaryFromReader);
      msg.setColor(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Text.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Text.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Text} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getText();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Fill.Text.Text.serializeBinaryToWriter
    );
  }
  f = message.getStyle();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Fill.Text.Style.serializeBinaryToWriter
    );
  }
  f = message.getMarks();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Fill.Text.Marks.serializeBinaryToWriter
    );
  }
  f = message.getChecked();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.anytype.Event.Block.Fill.Text.Checked.serializeBinaryToWriter
    );
  }
  f = message.getColor();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.anytype.Event.Block.Fill.Text.Color.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Text.Text.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Text.Text.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Text.Text} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Text.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Text.Text}
 */
proto.anytype.Event.Block.Fill.Text.Text.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Text.Text;
  return proto.anytype.Event.Block.Fill.Text.Text.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Text.Text} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Text.Text}
 */
proto.anytype.Event.Block.Fill.Text.Text.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Text.Text.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Text.Text.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Text.Text} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Text.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Text.Text.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Text.Text} returns this
 */
proto.anytype.Event.Block.Fill.Text.Text.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Text.Style.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Text.Style.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Text.Style} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Style.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Text.Style}
 */
proto.anytype.Event.Block.Fill.Text.Style.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Text.Style;
  return proto.anytype.Event.Block.Fill.Text.Style.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Text.Style} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Text.Style}
 */
proto.anytype.Event.Block.Fill.Text.Style.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.Text.Style} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Text.Style.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Text.Style.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Text.Style} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Style.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.Text.Style value = 1;
 * @return {!proto.anytype.model.Block.Content.Text.Style}
 */
proto.anytype.Event.Block.Fill.Text.Style.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.Text.Style} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.Text.Style} value
 * @return {!proto.anytype.Event.Block.Fill.Text.Style} returns this
 */
proto.anytype.Event.Block.Fill.Text.Style.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Text.Marks.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Text.Marks.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Text.Marks} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Marks.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: (f = msg.getValue()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Text.Marks}
 */
proto.anytype.Event.Block.Fill.Text.Marks.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Text.Marks;
  return proto.anytype.Event.Block.Fill.Text.Marks.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Text.Marks} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Text.Marks}
 */
proto.anytype.Event.Block.Fill.Text.Marks.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks.deserializeBinaryFromReader);
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Text.Marks.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Text.Marks.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Text.Marks} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Marks.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks.serializeBinaryToWriter
    );
  }
};


/**
 * optional model.Block.Content.Text.Marks value = 1;
 * @return {?proto.anytype.model.Block.Content.Text.Marks}
 */
proto.anytype.Event.Block.Fill.Text.Marks.prototype.getValue = function() {
  return /** @type{?proto.anytype.model.Block.Content.Text.Marks} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Block.Content.Text.Marks, 1));
};


/**
 * @param {?proto.anytype.model.Block.Content.Text.Marks|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Text.Marks} returns this
*/
proto.anytype.Event.Block.Fill.Text.Marks.prototype.setValue = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Text.Marks} returns this
 */
proto.anytype.Event.Block.Fill.Text.Marks.prototype.clearValue = function() {
  return this.setValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Text.Marks.prototype.hasValue = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Text.Checked.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Text.Checked.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Text.Checked} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Checked.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Text.Checked}
 */
proto.anytype.Event.Block.Fill.Text.Checked.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Text.Checked;
  return proto.anytype.Event.Block.Fill.Text.Checked.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Text.Checked} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Text.Checked}
 */
proto.anytype.Event.Block.Fill.Text.Checked.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Text.Checked.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Text.Checked.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Text.Checked} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Checked.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool value = 1;
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Text.Checked.prototype.getValue = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.anytype.Event.Block.Fill.Text.Checked} returns this
 */
proto.anytype.Event.Block.Fill.Text.Checked.prototype.setValue = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Text.Color.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Text.Color.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Text.Color} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Color.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Text.Color}
 */
proto.anytype.Event.Block.Fill.Text.Color.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Text.Color;
  return proto.anytype.Event.Block.Fill.Text.Color.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Text.Color} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Text.Color}
 */
proto.anytype.Event.Block.Fill.Text.Color.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Text.Color.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Text.Color.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Text.Color} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Text.Color.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Text.Color.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Text.Color} returns this
 */
proto.anytype.Event.Block.Fill.Text.Color.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Text.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
 */
proto.anytype.Event.Block.Fill.Text.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Text text = 2;
 * @return {?proto.anytype.Event.Block.Fill.Text.Text}
 */
proto.anytype.Event.Block.Fill.Text.prototype.getText = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Text.Text} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Text.Text, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Text.Text|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
*/
proto.anytype.Event.Block.Fill.Text.prototype.setText = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
 */
proto.anytype.Event.Block.Fill.Text.prototype.clearText = function() {
  return this.setText(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Text.prototype.hasText = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Style style = 3;
 * @return {?proto.anytype.Event.Block.Fill.Text.Style}
 */
proto.anytype.Event.Block.Fill.Text.prototype.getStyle = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Text.Style} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Text.Style, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Text.Style|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
*/
proto.anytype.Event.Block.Fill.Text.prototype.setStyle = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
 */
proto.anytype.Event.Block.Fill.Text.prototype.clearStyle = function() {
  return this.setStyle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Text.prototype.hasStyle = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Marks marks = 4;
 * @return {?proto.anytype.Event.Block.Fill.Text.Marks}
 */
proto.anytype.Event.Block.Fill.Text.prototype.getMarks = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Text.Marks} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Text.Marks, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Text.Marks|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
*/
proto.anytype.Event.Block.Fill.Text.prototype.setMarks = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
 */
proto.anytype.Event.Block.Fill.Text.prototype.clearMarks = function() {
  return this.setMarks(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Text.prototype.hasMarks = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Checked checked = 5;
 * @return {?proto.anytype.Event.Block.Fill.Text.Checked}
 */
proto.anytype.Event.Block.Fill.Text.prototype.getChecked = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Text.Checked} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Text.Checked, 5));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Text.Checked|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
*/
proto.anytype.Event.Block.Fill.Text.prototype.setChecked = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
 */
proto.anytype.Event.Block.Fill.Text.prototype.clearChecked = function() {
  return this.setChecked(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Text.prototype.hasChecked = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Color color = 6;
 * @return {?proto.anytype.Event.Block.Fill.Text.Color}
 */
proto.anytype.Event.Block.Fill.Text.prototype.getColor = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Text.Color} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Text.Color, 6));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Text.Color|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
*/
proto.anytype.Event.Block.Fill.Text.prototype.setColor = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Text} returns this
 */
proto.anytype.Event.Block.Fill.Text.prototype.clearColor = function() {
  return this.setColor(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Text.prototype.hasColor = function() {
  return jspb.Message.getField(this, 6) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Div.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Div.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Div} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Div.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    style: (f = msg.getStyle()) && proto.anytype.Event.Block.Fill.Div.Style.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Div}
 */
proto.anytype.Event.Block.Fill.Div.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Div;
  return proto.anytype.Event.Block.Fill.Div.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Div} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Div}
 */
proto.anytype.Event.Block.Fill.Div.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Fill.Div.Style;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Div.Style.deserializeBinaryFromReader);
      msg.setStyle(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Div.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Div.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Div} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Div.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStyle();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Fill.Div.Style.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Div.Style.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Div.Style.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Div.Style} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Div.Style.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Div.Style}
 */
proto.anytype.Event.Block.Fill.Div.Style.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Div.Style;
  return proto.anytype.Event.Block.Fill.Div.Style.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Div.Style} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Div.Style}
 */
proto.anytype.Event.Block.Fill.Div.Style.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.Div.Style} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Div.Style.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Div.Style.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Div.Style} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Div.Style.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.Div.Style value = 1;
 * @return {!proto.anytype.model.Block.Content.Div.Style}
 */
proto.anytype.Event.Block.Fill.Div.Style.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.Div.Style} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.Div.Style} value
 * @return {!proto.anytype.Event.Block.Fill.Div.Style} returns this
 */
proto.anytype.Event.Block.Fill.Div.Style.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Div.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Div} returns this
 */
proto.anytype.Event.Block.Fill.Div.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Style style = 2;
 * @return {?proto.anytype.Event.Block.Fill.Div.Style}
 */
proto.anytype.Event.Block.Fill.Div.prototype.getStyle = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Div.Style} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Div.Style, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Div.Style|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Div} returns this
*/
proto.anytype.Event.Block.Fill.Div.prototype.setStyle = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Div} returns this
 */
proto.anytype.Event.Block.Fill.Div.prototype.clearStyle = function() {
  return this.setStyle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Div.prototype.hasStyle = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    type: (f = msg.getType()) && proto.anytype.Event.Block.Fill.File.Type.toObject(includeInstance, f),
    state: (f = msg.getState()) && proto.anytype.Event.Block.Fill.File.State.toObject(includeInstance, f),
    mime: (f = msg.getMime()) && proto.anytype.Event.Block.Fill.File.Mime.toObject(includeInstance, f),
    hash: (f = msg.getHash()) && proto.anytype.Event.Block.Fill.File.Hash.toObject(includeInstance, f),
    name: (f = msg.getName()) && proto.anytype.Event.Block.Fill.File.Name.toObject(includeInstance, f),
    size: (f = msg.getSize()) && proto.anytype.Event.Block.Fill.File.Size.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File}
 */
proto.anytype.Event.Block.Fill.File.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File;
  return proto.anytype.Event.Block.Fill.File.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File}
 */
proto.anytype.Event.Block.Fill.File.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Fill.File.Type;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.File.Type.deserializeBinaryFromReader);
      msg.setType(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Fill.File.State;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.File.State.deserializeBinaryFromReader);
      msg.setState(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Fill.File.Mime;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.File.Mime.deserializeBinaryFromReader);
      msg.setMime(value);
      break;
    case 5:
      var value = new proto.anytype.Event.Block.Fill.File.Hash;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.File.Hash.deserializeBinaryFromReader);
      msg.setHash(value);
      break;
    case 6:
      var value = new proto.anytype.Event.Block.Fill.File.Name;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.File.Name.deserializeBinaryFromReader);
      msg.setName(value);
      break;
    case 7:
      var value = new proto.anytype.Event.Block.Fill.File.Size;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.File.Size.deserializeBinaryFromReader);
      msg.setSize(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Fill.File.Type.serializeBinaryToWriter
    );
  }
  f = message.getState();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Fill.File.State.serializeBinaryToWriter
    );
  }
  f = message.getMime();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Fill.File.Mime.serializeBinaryToWriter
    );
  }
  f = message.getHash();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.anytype.Event.Block.Fill.File.Hash.serializeBinaryToWriter
    );
  }
  f = message.getName();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.anytype.Event.Block.Fill.File.Name.serializeBinaryToWriter
    );
  }
  f = message.getSize();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.anytype.Event.Block.Fill.File.Size.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.Name.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.Name.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File.Name} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Name.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File.Name}
 */
proto.anytype.Event.Block.Fill.File.Name.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File.Name;
  return proto.anytype.Event.Block.Fill.File.Name.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File.Name} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File.Name}
 */
proto.anytype.Event.Block.Fill.File.Name.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.Name.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.Name.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File.Name} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Name.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.File.Name.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.File.Name} returns this
 */
proto.anytype.Event.Block.Fill.File.Name.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.Width.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.Width.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File.Width} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Width.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File.Width}
 */
proto.anytype.Event.Block.Fill.File.Width.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File.Width;
  return proto.anytype.Event.Block.Fill.File.Width.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File.Width} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File.Width}
 */
proto.anytype.Event.Block.Fill.File.Width.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.Width.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.Width.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File.Width} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Width.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
};


/**
 * optional int32 value = 1;
 * @return {number}
 */
proto.anytype.Event.Block.Fill.File.Width.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Fill.File.Width} returns this
 */
proto.anytype.Event.Block.Fill.File.Width.prototype.setValue = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.State.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.State.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File.State} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.State.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File.State}
 */
proto.anytype.Event.Block.Fill.File.State.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File.State;
  return proto.anytype.Event.Block.Fill.File.State.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File.State} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File.State}
 */
proto.anytype.Event.Block.Fill.File.State.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.File.State} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.State.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.State.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File.State} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.State.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.File.State value = 1;
 * @return {!proto.anytype.model.Block.Content.File.State}
 */
proto.anytype.Event.Block.Fill.File.State.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.File.State} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.File.State} value
 * @return {!proto.anytype.Event.Block.Fill.File.State} returns this
 */
proto.anytype.Event.Block.Fill.File.State.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.Type.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.Type.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File.Type} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Type.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File.Type}
 */
proto.anytype.Event.Block.Fill.File.Type.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File.Type;
  return proto.anytype.Event.Block.Fill.File.Type.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File.Type} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File.Type}
 */
proto.anytype.Event.Block.Fill.File.Type.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.File.Type} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.Type.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.Type.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File.Type} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Type.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.File.Type value = 1;
 * @return {!proto.anytype.model.Block.Content.File.Type}
 */
proto.anytype.Event.Block.Fill.File.Type.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.File.Type} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.File.Type} value
 * @return {!proto.anytype.Event.Block.Fill.File.Type} returns this
 */
proto.anytype.Event.Block.Fill.File.Type.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.Hash.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.Hash.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File.Hash} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Hash.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File.Hash}
 */
proto.anytype.Event.Block.Fill.File.Hash.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File.Hash;
  return proto.anytype.Event.Block.Fill.File.Hash.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File.Hash} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File.Hash}
 */
proto.anytype.Event.Block.Fill.File.Hash.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.Hash.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.Hash.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File.Hash} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Hash.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.File.Hash.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.File.Hash} returns this
 */
proto.anytype.Event.Block.Fill.File.Hash.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.Mime.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.Mime.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File.Mime} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Mime.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File.Mime}
 */
proto.anytype.Event.Block.Fill.File.Mime.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File.Mime;
  return proto.anytype.Event.Block.Fill.File.Mime.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File.Mime} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File.Mime}
 */
proto.anytype.Event.Block.Fill.File.Mime.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.Mime.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.Mime.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File.Mime} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Mime.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.File.Mime.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.File.Mime} returns this
 */
proto.anytype.Event.Block.Fill.File.Mime.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.File.Size.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.File.Size.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.File.Size} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Size.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.File.Size}
 */
proto.anytype.Event.Block.Fill.File.Size.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.File.Size;
  return proto.anytype.Event.Block.Fill.File.Size.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.File.Size} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.File.Size}
 */
proto.anytype.Event.Block.Fill.File.Size.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.File.Size.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.File.Size.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.File.Size} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.File.Size.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 value = 1;
 * @return {number}
 */
proto.anytype.Event.Block.Fill.File.Size.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Block.Fill.File.Size} returns this
 */
proto.anytype.Event.Block.Fill.File.Size.prototype.setValue = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.File.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
 */
proto.anytype.Event.Block.Fill.File.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Type type = 2;
 * @return {?proto.anytype.Event.Block.Fill.File.Type}
 */
proto.anytype.Event.Block.Fill.File.prototype.getType = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.File.Type} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.File.Type, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.File.Type|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
*/
proto.anytype.Event.Block.Fill.File.prototype.setType = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
 */
proto.anytype.Event.Block.Fill.File.prototype.clearType = function() {
  return this.setType(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.File.prototype.hasType = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional State state = 3;
 * @return {?proto.anytype.Event.Block.Fill.File.State}
 */
proto.anytype.Event.Block.Fill.File.prototype.getState = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.File.State} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.File.State, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.File.State|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
*/
proto.anytype.Event.Block.Fill.File.prototype.setState = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
 */
proto.anytype.Event.Block.Fill.File.prototype.clearState = function() {
  return this.setState(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.File.prototype.hasState = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Mime mime = 4;
 * @return {?proto.anytype.Event.Block.Fill.File.Mime}
 */
proto.anytype.Event.Block.Fill.File.prototype.getMime = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.File.Mime} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.File.Mime, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.File.Mime|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
*/
proto.anytype.Event.Block.Fill.File.prototype.setMime = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
 */
proto.anytype.Event.Block.Fill.File.prototype.clearMime = function() {
  return this.setMime(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.File.prototype.hasMime = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Hash hash = 5;
 * @return {?proto.anytype.Event.Block.Fill.File.Hash}
 */
proto.anytype.Event.Block.Fill.File.prototype.getHash = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.File.Hash} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.File.Hash, 5));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.File.Hash|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
*/
proto.anytype.Event.Block.Fill.File.prototype.setHash = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
 */
proto.anytype.Event.Block.Fill.File.prototype.clearHash = function() {
  return this.setHash(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.File.prototype.hasHash = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Name name = 6;
 * @return {?proto.anytype.Event.Block.Fill.File.Name}
 */
proto.anytype.Event.Block.Fill.File.prototype.getName = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.File.Name} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.File.Name, 6));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.File.Name|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
*/
proto.anytype.Event.Block.Fill.File.prototype.setName = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
 */
proto.anytype.Event.Block.Fill.File.prototype.clearName = function() {
  return this.setName(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.File.prototype.hasName = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional Size size = 7;
 * @return {?proto.anytype.Event.Block.Fill.File.Size}
 */
proto.anytype.Event.Block.Fill.File.prototype.getSize = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.File.Size} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.File.Size, 7));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.File.Size|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
*/
proto.anytype.Event.Block.Fill.File.prototype.setSize = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.File} returns this
 */
proto.anytype.Event.Block.Fill.File.prototype.clearSize = function() {
  return this.setSize(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.File.prototype.hasSize = function() {
  return jspb.Message.getField(this, 7) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Link.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Link.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Link} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    targetblockid: (f = msg.getTargetblockid()) && proto.anytype.Event.Block.Fill.Link.TargetBlockId.toObject(includeInstance, f),
    style: (f = msg.getStyle()) && proto.anytype.Event.Block.Fill.Link.Style.toObject(includeInstance, f),
    fields: (f = msg.getFields()) && proto.anytype.Event.Block.Fill.Link.Fields.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Link}
 */
proto.anytype.Event.Block.Fill.Link.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Link;
  return proto.anytype.Event.Block.Fill.Link.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Link} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Link}
 */
proto.anytype.Event.Block.Fill.Link.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Fill.Link.TargetBlockId;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Link.TargetBlockId.deserializeBinaryFromReader);
      msg.setTargetblockid(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Fill.Link.Style;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Link.Style.deserializeBinaryFromReader);
      msg.setStyle(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Fill.Link.Fields;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Link.Fields.deserializeBinaryFromReader);
      msg.setFields(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Link.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Link.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Link} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTargetblockid();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Fill.Link.TargetBlockId.serializeBinaryToWriter
    );
  }
  f = message.getStyle();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Fill.Link.Style.serializeBinaryToWriter
    );
  }
  f = message.getFields();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Fill.Link.Fields.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Link.TargetBlockId.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Link.TargetBlockId} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Link.TargetBlockId}
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Link.TargetBlockId;
  return proto.anytype.Event.Block.Fill.Link.TargetBlockId.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Link.TargetBlockId} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Link.TargetBlockId}
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Link.TargetBlockId.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Link.TargetBlockId} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Link.TargetBlockId} returns this
 */
proto.anytype.Event.Block.Fill.Link.TargetBlockId.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Link.Style.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Link.Style.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Link.Style} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.Style.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Link.Style}
 */
proto.anytype.Event.Block.Fill.Link.Style.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Link.Style;
  return proto.anytype.Event.Block.Fill.Link.Style.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Link.Style} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Link.Style}
 */
proto.anytype.Event.Block.Fill.Link.Style.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.Block.Content.Link.Style} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Link.Style.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Link.Style.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Link.Style} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.Style.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.Block.Content.Link.Style value = 1;
 * @return {!proto.anytype.model.Block.Content.Link.Style}
 */
proto.anytype.Event.Block.Fill.Link.Style.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.Block.Content.Link.Style} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.Block.Content.Link.Style} value
 * @return {!proto.anytype.Event.Block.Fill.Link.Style} returns this
 */
proto.anytype.Event.Block.Fill.Link.Style.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Link.Fields.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Link.Fields.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Link.Fields} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.Fields.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: (f = msg.getValue()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Link.Fields}
 */
proto.anytype.Event.Block.Fill.Link.Fields.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Link.Fields;
  return proto.anytype.Event.Block.Fill.Link.Fields.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Link.Fields} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Link.Fields}
 */
proto.anytype.Event.Block.Fill.Link.Fields.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Link.Fields.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Link.Fields.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Link.Fields} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Link.Fields.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional google.protobuf.Struct value = 1;
 * @return {?proto.google.protobuf.Struct}
 */
proto.anytype.Event.Block.Fill.Link.Fields.prototype.getValue = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 1));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Link.Fields} returns this
*/
proto.anytype.Event.Block.Fill.Link.Fields.prototype.setValue = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Link.Fields} returns this
 */
proto.anytype.Event.Block.Fill.Link.Fields.prototype.clearValue = function() {
  return this.setValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Link.Fields.prototype.hasValue = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Link.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Link} returns this
 */
proto.anytype.Event.Block.Fill.Link.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional TargetBlockId targetBlockId = 2;
 * @return {?proto.anytype.Event.Block.Fill.Link.TargetBlockId}
 */
proto.anytype.Event.Block.Fill.Link.prototype.getTargetblockid = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Link.TargetBlockId} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Link.TargetBlockId, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Link.TargetBlockId|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Link} returns this
*/
proto.anytype.Event.Block.Fill.Link.prototype.setTargetblockid = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Link} returns this
 */
proto.anytype.Event.Block.Fill.Link.prototype.clearTargetblockid = function() {
  return this.setTargetblockid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Link.prototype.hasTargetblockid = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Style style = 3;
 * @return {?proto.anytype.Event.Block.Fill.Link.Style}
 */
proto.anytype.Event.Block.Fill.Link.prototype.getStyle = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Link.Style} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Link.Style, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Link.Style|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Link} returns this
*/
proto.anytype.Event.Block.Fill.Link.prototype.setStyle = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Link} returns this
 */
proto.anytype.Event.Block.Fill.Link.prototype.clearStyle = function() {
  return this.setStyle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Link.prototype.hasStyle = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Fields fields = 4;
 * @return {?proto.anytype.Event.Block.Fill.Link.Fields}
 */
proto.anytype.Event.Block.Fill.Link.prototype.getFields = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Link.Fields} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Link.Fields, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Link.Fields|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Link} returns this
*/
proto.anytype.Event.Block.Fill.Link.prototype.setFields = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Link} returns this
 */
proto.anytype.Event.Block.Fill.Link.prototype.clearFields = function() {
  return this.setFields(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Link.prototype.hasFields = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Bookmark.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Bookmark} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    url: (f = msg.getUrl()) && proto.anytype.Event.Block.Fill.Bookmark.Url.toObject(includeInstance, f),
    title: (f = msg.getTitle()) && proto.anytype.Event.Block.Fill.Bookmark.Title.toObject(includeInstance, f),
    description: (f = msg.getDescription()) && proto.anytype.Event.Block.Fill.Bookmark.Description.toObject(includeInstance, f),
    imagehash: (f = msg.getImagehash()) && proto.anytype.Event.Block.Fill.Bookmark.ImageHash.toObject(includeInstance, f),
    faviconhash: (f = msg.getFaviconhash()) && proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.toObject(includeInstance, f),
    type: (f = msg.getType()) && proto.anytype.Event.Block.Fill.Bookmark.Type.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark}
 */
proto.anytype.Event.Block.Fill.Bookmark.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Bookmark;
  return proto.anytype.Event.Block.Fill.Bookmark.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark}
 */
proto.anytype.Event.Block.Fill.Bookmark.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.anytype.Event.Block.Fill.Bookmark.Url;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Bookmark.Url.deserializeBinaryFromReader);
      msg.setUrl(value);
      break;
    case 3:
      var value = new proto.anytype.Event.Block.Fill.Bookmark.Title;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Bookmark.Title.deserializeBinaryFromReader);
      msg.setTitle(value);
      break;
    case 4:
      var value = new proto.anytype.Event.Block.Fill.Bookmark.Description;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Bookmark.Description.deserializeBinaryFromReader);
      msg.setDescription(value);
      break;
    case 5:
      var value = new proto.anytype.Event.Block.Fill.Bookmark.ImageHash;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Bookmark.ImageHash.deserializeBinaryFromReader);
      msg.setImagehash(value);
      break;
    case 6:
      var value = new proto.anytype.Event.Block.Fill.Bookmark.FaviconHash;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.deserializeBinaryFromReader);
      msg.setFaviconhash(value);
      break;
    case 7:
      var value = new proto.anytype.Event.Block.Fill.Bookmark.Type;
      reader.readMessage(value,proto.anytype.Event.Block.Fill.Bookmark.Type.deserializeBinaryFromReader);
      msg.setType(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Bookmark.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUrl();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.anytype.Event.Block.Fill.Bookmark.Url.serializeBinaryToWriter
    );
  }
  f = message.getTitle();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.anytype.Event.Block.Fill.Bookmark.Title.serializeBinaryToWriter
    );
  }
  f = message.getDescription();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Event.Block.Fill.Bookmark.Description.serializeBinaryToWriter
    );
  }
  f = message.getImagehash();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.anytype.Event.Block.Fill.Bookmark.ImageHash.serializeBinaryToWriter
    );
  }
  f = message.getFaviconhash();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.serializeBinaryToWriter
    );
  }
  f = message.getType();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.anytype.Event.Block.Fill.Bookmark.Type.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Bookmark.Url.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Url} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Url}
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Bookmark.Url;
  return proto.anytype.Event.Block.Fill.Bookmark.Url.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Url} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Url}
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Bookmark.Url.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Url} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Url} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.Url.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Bookmark.Title.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Title} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Title}
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Bookmark.Title;
  return proto.anytype.Event.Block.Fill.Bookmark.Title.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Title} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Title}
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Bookmark.Title.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Title} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Title} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.Title.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Bookmark.Description.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Description} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Description}
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Bookmark.Description;
  return proto.anytype.Event.Block.Fill.Bookmark.Description.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Description} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Description}
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Bookmark.Description.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Description} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Description} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.Description.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Bookmark.ImageHash.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.ImageHash} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.ImageHash}
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Bookmark.ImageHash;
  return proto.anytype.Event.Block.Fill.Bookmark.ImageHash.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.ImageHash} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.ImageHash}
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Bookmark.ImageHash.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.ImageHash} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.ImageHash} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.ImageHash.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.FaviconHash} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.FaviconHash}
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Bookmark.FaviconHash;
  return proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.FaviconHash} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.FaviconHash}
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.FaviconHash} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string value = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.FaviconHash} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.FaviconHash.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Block.Fill.Bookmark.Type.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Type} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.toObject = function(includeInstance, msg) {
  var f, obj = {
    value: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Type}
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Block.Fill.Bookmark.Type;
  return proto.anytype.Event.Block.Fill.Bookmark.Type.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Type} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Type}
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.anytype.model.LinkPreview.Type} */ (reader.readEnum());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Block.Fill.Bookmark.Type.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Block.Fill.Bookmark.Type} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getValue();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional model.LinkPreview.Type value = 1;
 * @return {!proto.anytype.model.LinkPreview.Type}
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.prototype.getValue = function() {
  return /** @type {!proto.anytype.model.LinkPreview.Type} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.anytype.model.LinkPreview.Type} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark.Type} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.Type.prototype.setValue = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Url url = 2;
 * @return {?proto.anytype.Event.Block.Fill.Bookmark.Url}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.getUrl = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Bookmark.Url} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Bookmark.Url, 2));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Bookmark.Url|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
*/
proto.anytype.Event.Block.Fill.Bookmark.prototype.setUrl = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.clearUrl = function() {
  return this.setUrl(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.hasUrl = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Title title = 3;
 * @return {?proto.anytype.Event.Block.Fill.Bookmark.Title}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.getTitle = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Bookmark.Title} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Bookmark.Title, 3));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Bookmark.Title|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
*/
proto.anytype.Event.Block.Fill.Bookmark.prototype.setTitle = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.clearTitle = function() {
  return this.setTitle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.hasTitle = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Description description = 4;
 * @return {?proto.anytype.Event.Block.Fill.Bookmark.Description}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.getDescription = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Bookmark.Description} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Bookmark.Description, 4));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Bookmark.Description|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
*/
proto.anytype.Event.Block.Fill.Bookmark.prototype.setDescription = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.clearDescription = function() {
  return this.setDescription(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.hasDescription = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional ImageHash imageHash = 5;
 * @return {?proto.anytype.Event.Block.Fill.Bookmark.ImageHash}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.getImagehash = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Bookmark.ImageHash} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Bookmark.ImageHash, 5));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Bookmark.ImageHash|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
*/
proto.anytype.Event.Block.Fill.Bookmark.prototype.setImagehash = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.clearImagehash = function() {
  return this.setImagehash(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.hasImagehash = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional FaviconHash faviconHash = 6;
 * @return {?proto.anytype.Event.Block.Fill.Bookmark.FaviconHash}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.getFaviconhash = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Bookmark.FaviconHash} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Bookmark.FaviconHash, 6));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Bookmark.FaviconHash|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
*/
proto.anytype.Event.Block.Fill.Bookmark.prototype.setFaviconhash = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.clearFaviconhash = function() {
  return this.setFaviconhash(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.hasFaviconhash = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional Type type = 7;
 * @return {?proto.anytype.Event.Block.Fill.Bookmark.Type}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.getType = function() {
  return /** @type{?proto.anytype.Event.Block.Fill.Bookmark.Type} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Block.Fill.Bookmark.Type, 7));
};


/**
 * @param {?proto.anytype.Event.Block.Fill.Bookmark.Type|undefined} value
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
*/
proto.anytype.Event.Block.Fill.Bookmark.prototype.setType = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Block.Fill.Bookmark} returns this
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.clearType = function() {
  return this.setType(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Block.Fill.Bookmark.prototype.hasType = function() {
  return jspb.Message.getField(this, 7) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.User.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.User.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.User} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.User}
 */
proto.anytype.Event.User.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.User;
  return proto.anytype.Event.User.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.User} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.User}
 */
proto.anytype.Event.User.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.User.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.User.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.User} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.User.Block.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.User.Block.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.User.Block} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.User.Block}
 */
proto.anytype.Event.User.Block.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.User.Block;
  return proto.anytype.Event.User.Block.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.User.Block} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.User.Block}
 */
proto.anytype.Event.User.Block.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.User.Block.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.User.Block.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.User.Block} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.User.Block.Join.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.User.Block.Join.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.User.Block.Join} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.Join.toObject = function(includeInstance, msg) {
  var f, obj = {
    account: (f = msg.getAccount()) && proto.anytype.Event.Account.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.User.Block.Join}
 */
proto.anytype.Event.User.Block.Join.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.User.Block.Join;
  return proto.anytype.Event.User.Block.Join.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.User.Block.Join} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.User.Block.Join}
 */
proto.anytype.Event.User.Block.Join.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Event.Account;
      reader.readMessage(value,proto.anytype.Event.Account.deserializeBinaryFromReader);
      msg.setAccount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.User.Block.Join.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.User.Block.Join.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.User.Block.Join} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.Join.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccount();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Event.Account.serializeBinaryToWriter
    );
  }
};


/**
 * optional Account account = 1;
 * @return {?proto.anytype.Event.Account}
 */
proto.anytype.Event.User.Block.Join.prototype.getAccount = function() {
  return /** @type{?proto.anytype.Event.Account} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Account, 1));
};


/**
 * @param {?proto.anytype.Event.Account|undefined} value
 * @return {!proto.anytype.Event.User.Block.Join} returns this
*/
proto.anytype.Event.User.Block.Join.prototype.setAccount = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.User.Block.Join} returns this
 */
proto.anytype.Event.User.Block.Join.prototype.clearAccount = function() {
  return this.setAccount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.User.Block.Join.prototype.hasAccount = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.User.Block.Left.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.User.Block.Left.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.User.Block.Left} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.Left.toObject = function(includeInstance, msg) {
  var f, obj = {
    account: (f = msg.getAccount()) && proto.anytype.Event.Account.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.User.Block.Left}
 */
proto.anytype.Event.User.Block.Left.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.User.Block.Left;
  return proto.anytype.Event.User.Block.Left.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.User.Block.Left} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.User.Block.Left}
 */
proto.anytype.Event.User.Block.Left.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Event.Account;
      reader.readMessage(value,proto.anytype.Event.Account.deserializeBinaryFromReader);
      msg.setAccount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.User.Block.Left.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.User.Block.Left.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.User.Block.Left} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.Left.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccount();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Event.Account.serializeBinaryToWriter
    );
  }
};


/**
 * optional Account account = 1;
 * @return {?proto.anytype.Event.Account}
 */
proto.anytype.Event.User.Block.Left.prototype.getAccount = function() {
  return /** @type{?proto.anytype.Event.Account} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Account, 1));
};


/**
 * @param {?proto.anytype.Event.Account|undefined} value
 * @return {!proto.anytype.Event.User.Block.Left} returns this
*/
proto.anytype.Event.User.Block.Left.prototype.setAccount = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.User.Block.Left} returns this
 */
proto.anytype.Event.User.Block.Left.prototype.clearAccount = function() {
  return this.setAccount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.User.Block.Left.prototype.hasAccount = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.User.Block.TextRange.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.User.Block.TextRange.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.User.Block.TextRange} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.TextRange.toObject = function(includeInstance, msg) {
  var f, obj = {
    account: (f = msg.getAccount()) && proto.anytype.Event.Account.toObject(includeInstance, f),
    blockid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    range: (f = msg.getRange()) && vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Range.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.User.Block.TextRange}
 */
proto.anytype.Event.User.Block.TextRange.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.User.Block.TextRange;
  return proto.anytype.Event.User.Block.TextRange.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.User.Block.TextRange} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.User.Block.TextRange}
 */
proto.anytype.Event.User.Block.TextRange.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Event.Account;
      reader.readMessage(value,proto.anytype.Event.Account.deserializeBinaryFromReader);
      msg.setAccount(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBlockid(value);
      break;
    case 3:
      var value = new vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Range;
      reader.readMessage(value,vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Range.deserializeBinaryFromReader);
      msg.setRange(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.User.Block.TextRange.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.User.Block.TextRange.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.User.Block.TextRange} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.TextRange.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccount();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Event.Account.serializeBinaryToWriter
    );
  }
  f = message.getBlockid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getRange();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Range.serializeBinaryToWriter
    );
  }
};


/**
 * optional Account account = 1;
 * @return {?proto.anytype.Event.Account}
 */
proto.anytype.Event.User.Block.TextRange.prototype.getAccount = function() {
  return /** @type{?proto.anytype.Event.Account} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Account, 1));
};


/**
 * @param {?proto.anytype.Event.Account|undefined} value
 * @return {!proto.anytype.Event.User.Block.TextRange} returns this
*/
proto.anytype.Event.User.Block.TextRange.prototype.setAccount = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.User.Block.TextRange} returns this
 */
proto.anytype.Event.User.Block.TextRange.prototype.clearAccount = function() {
  return this.setAccount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.User.Block.TextRange.prototype.hasAccount = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string blockId = 2;
 * @return {string}
 */
proto.anytype.Event.User.Block.TextRange.prototype.getBlockid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event.User.Block.TextRange} returns this
 */
proto.anytype.Event.User.Block.TextRange.prototype.setBlockid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional model.Range range = 3;
 * @return {?proto.anytype.model.Range}
 */
proto.anytype.Event.User.Block.TextRange.prototype.getRange = function() {
  return /** @type{?proto.anytype.model.Range} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Range, 3));
};


/**
 * @param {?proto.anytype.model.Range|undefined} value
 * @return {!proto.anytype.Event.User.Block.TextRange} returns this
*/
proto.anytype.Event.User.Block.TextRange.prototype.setRange = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.User.Block.TextRange} returns this
 */
proto.anytype.Event.User.Block.TextRange.prototype.clearRange = function() {
  return this.setRange(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.User.Block.TextRange.prototype.hasRange = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.Event.User.Block.SelectRange.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.User.Block.SelectRange.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.User.Block.SelectRange.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.User.Block.SelectRange} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.SelectRange.toObject = function(includeInstance, msg) {
  var f, obj = {
    account: (f = msg.getAccount()) && proto.anytype.Event.Account.toObject(includeInstance, f),
    blockidsarrayList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.User.Block.SelectRange}
 */
proto.anytype.Event.User.Block.SelectRange.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.User.Block.SelectRange;
  return proto.anytype.Event.User.Block.SelectRange.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.User.Block.SelectRange} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.User.Block.SelectRange}
 */
proto.anytype.Event.User.Block.SelectRange.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Event.Account;
      reader.readMessage(value,proto.anytype.Event.Account.deserializeBinaryFromReader);
      msg.setAccount(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addBlockidsarray(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.User.Block.SelectRange.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.User.Block.SelectRange.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.User.Block.SelectRange} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.User.Block.SelectRange.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccount();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Event.Account.serializeBinaryToWriter
    );
  }
  f = message.getBlockidsarrayList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
};


/**
 * optional Account account = 1;
 * @return {?proto.anytype.Event.Account}
 */
proto.anytype.Event.User.Block.SelectRange.prototype.getAccount = function() {
  return /** @type{?proto.anytype.Event.Account} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Event.Account, 1));
};


/**
 * @param {?proto.anytype.Event.Account|undefined} value
 * @return {!proto.anytype.Event.User.Block.SelectRange} returns this
*/
proto.anytype.Event.User.Block.SelectRange.prototype.setAccount = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.User.Block.SelectRange} returns this
 */
proto.anytype.Event.User.Block.SelectRange.prototype.clearAccount = function() {
  return this.setAccount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.User.Block.SelectRange.prototype.hasAccount = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * repeated string blockIdsArray = 2;
 * @return {!Array<string>}
 */
proto.anytype.Event.User.Block.SelectRange.prototype.getBlockidsarrayList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.anytype.Event.User.Block.SelectRange} returns this
 */
proto.anytype.Event.User.Block.SelectRange.prototype.setBlockidsarrayList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.User.Block.SelectRange} returns this
 */
proto.anytype.Event.User.Block.SelectRange.prototype.addBlockidsarray = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event.User.Block.SelectRange} returns this
 */
proto.anytype.Event.User.Block.SelectRange.prototype.clearBlockidsarrayList = function() {
  return this.setBlockidsarrayList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Ping.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Ping.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Ping} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Ping.toObject = function(includeInstance, msg) {
  var f, obj = {
    index: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Ping}
 */
proto.anytype.Event.Ping.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Ping;
  return proto.anytype.Event.Ping.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Ping} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Ping}
 */
proto.anytype.Event.Ping.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setIndex(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Ping.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Ping.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Ping} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Ping.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIndex();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
};


/**
 * optional int32 index = 1;
 * @return {number}
 */
proto.anytype.Event.Ping.prototype.getIndex = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Event.Ping} returns this
 */
proto.anytype.Event.Ping.prototype.setIndex = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Process.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Process.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Process} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Process}
 */
proto.anytype.Event.Process.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Process;
  return proto.anytype.Event.Process.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Process} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Process}
 */
proto.anytype.Event.Process.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Process.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Process.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Process} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Process.New.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Process.New.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Process.New} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.New.toObject = function(includeInstance, msg) {
  var f, obj = {
    process: (f = msg.getProcess()) && proto.anytype.Model.Process.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Process.New}
 */
proto.anytype.Event.Process.New.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Process.New;
  return proto.anytype.Event.Process.New.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Process.New} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Process.New}
 */
proto.anytype.Event.Process.New.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Model.Process;
      reader.readMessage(value,proto.anytype.Model.Process.deserializeBinaryFromReader);
      msg.setProcess(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Process.New.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Process.New.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Process.New} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.New.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcess();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Model.Process.serializeBinaryToWriter
    );
  }
};


/**
 * optional Model.Process process = 1;
 * @return {?proto.anytype.Model.Process}
 */
proto.anytype.Event.Process.New.prototype.getProcess = function() {
  return /** @type{?proto.anytype.Model.Process} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Model.Process, 1));
};


/**
 * @param {?proto.anytype.Model.Process|undefined} value
 * @return {!proto.anytype.Event.Process.New} returns this
*/
proto.anytype.Event.Process.New.prototype.setProcess = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Process.New} returns this
 */
proto.anytype.Event.Process.New.prototype.clearProcess = function() {
  return this.setProcess(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Process.New.prototype.hasProcess = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Process.Update.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Process.Update.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Process.Update} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.Update.toObject = function(includeInstance, msg) {
  var f, obj = {
    process: (f = msg.getProcess()) && proto.anytype.Model.Process.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Process.Update}
 */
proto.anytype.Event.Process.Update.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Process.Update;
  return proto.anytype.Event.Process.Update.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Process.Update} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Process.Update}
 */
proto.anytype.Event.Process.Update.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Model.Process;
      reader.readMessage(value,proto.anytype.Model.Process.deserializeBinaryFromReader);
      msg.setProcess(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Process.Update.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Process.Update.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Process.Update} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.Update.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcess();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Model.Process.serializeBinaryToWriter
    );
  }
};


/**
 * optional Model.Process process = 1;
 * @return {?proto.anytype.Model.Process}
 */
proto.anytype.Event.Process.Update.prototype.getProcess = function() {
  return /** @type{?proto.anytype.Model.Process} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Model.Process, 1));
};


/**
 * @param {?proto.anytype.Model.Process|undefined} value
 * @return {!proto.anytype.Event.Process.Update} returns this
*/
proto.anytype.Event.Process.Update.prototype.setProcess = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Process.Update} returns this
 */
proto.anytype.Event.Process.Update.prototype.clearProcess = function() {
  return this.setProcess(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Process.Update.prototype.hasProcess = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Event.Process.Done.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Event.Process.Done.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Event.Process.Done} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.Done.toObject = function(includeInstance, msg) {
  var f, obj = {
    process: (f = msg.getProcess()) && proto.anytype.Model.Process.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Event.Process.Done}
 */
proto.anytype.Event.Process.Done.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Event.Process.Done;
  return proto.anytype.Event.Process.Done.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Event.Process.Done} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Event.Process.Done}
 */
proto.anytype.Event.Process.Done.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Model.Process;
      reader.readMessage(value,proto.anytype.Model.Process.deserializeBinaryFromReader);
      msg.setProcess(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Event.Process.Done.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Event.Process.Done.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Event.Process.Done} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Event.Process.Done.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcess();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.anytype.Model.Process.serializeBinaryToWriter
    );
  }
};


/**
 * optional Model.Process process = 1;
 * @return {?proto.anytype.Model.Process}
 */
proto.anytype.Event.Process.Done.prototype.getProcess = function() {
  return /** @type{?proto.anytype.Model.Process} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Model.Process, 1));
};


/**
 * @param {?proto.anytype.Model.Process|undefined} value
 * @return {!proto.anytype.Event.Process.Done} returns this
*/
proto.anytype.Event.Process.Done.prototype.setProcess = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event.Process.Done} returns this
 */
proto.anytype.Event.Process.Done.prototype.clearProcess = function() {
  return this.setProcess(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.Process.Done.prototype.hasProcess = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * repeated Message messages = 1;
 * @return {!Array<!proto.anytype.Event.Message>}
 */
proto.anytype.Event.prototype.getMessagesList = function() {
  return /** @type{!Array<!proto.anytype.Event.Message>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.anytype.Event.Message, 1));
};


/**
 * @param {!Array<!proto.anytype.Event.Message>} value
 * @return {!proto.anytype.Event} returns this
*/
proto.anytype.Event.prototype.setMessagesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.anytype.Event.Message=} opt_value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Message}
 */
proto.anytype.Event.prototype.addMessages = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.anytype.Event.Message, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.Event} returns this
 */
proto.anytype.Event.prototype.clearMessagesList = function() {
  return this.setMessagesList([]);
};


/**
 * optional string contextId = 2;
 * @return {string}
 */
proto.anytype.Event.prototype.getContextid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Event} returns this
 */
proto.anytype.Event.prototype.setContextid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional model.Account initiator = 3;
 * @return {?proto.anytype.model.Account}
 */
proto.anytype.Event.prototype.getInitiator = function() {
  return /** @type{?proto.anytype.model.Account} */ (
    jspb.Message.getWrapperField(this, vendor_github_com_anytypeio_go$anytype$library_pb_model_protos_models_pb.Account, 3));
};


/**
 * @param {?proto.anytype.model.Account|undefined} value
 * @return {!proto.anytype.Event} returns this
*/
proto.anytype.Event.prototype.setInitiator = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Event} returns this
 */
proto.anytype.Event.prototype.clearInitiator = function() {
  return this.setInitiator(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Event.prototype.hasInitiator = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.anytype.ResponseEvent.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.ResponseEvent.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.ResponseEvent.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.ResponseEvent} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.ResponseEvent.toObject = function(includeInstance, msg) {
  var f, obj = {
    messagesList: jspb.Message.toObjectList(msg.getMessagesList(),
    proto.anytype.Event.Message.toObject, includeInstance),
    contextid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.ResponseEvent}
 */
proto.anytype.ResponseEvent.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.ResponseEvent;
  return proto.anytype.ResponseEvent.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.ResponseEvent} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.ResponseEvent}
 */
proto.anytype.ResponseEvent.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.anytype.Event.Message;
      reader.readMessage(value,proto.anytype.Event.Message.deserializeBinaryFromReader);
      msg.addMessages(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setContextid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.ResponseEvent.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.ResponseEvent.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.ResponseEvent} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.ResponseEvent.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessagesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.anytype.Event.Message.serializeBinaryToWriter
    );
  }
  f = message.getContextid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * repeated Event.Message messages = 1;
 * @return {!Array<!proto.anytype.Event.Message>}
 */
proto.anytype.ResponseEvent.prototype.getMessagesList = function() {
  return /** @type{!Array<!proto.anytype.Event.Message>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.anytype.Event.Message, 1));
};


/**
 * @param {!Array<!proto.anytype.Event.Message>} value
 * @return {!proto.anytype.ResponseEvent} returns this
*/
proto.anytype.ResponseEvent.prototype.setMessagesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.anytype.Event.Message=} opt_value
 * @param {number=} opt_index
 * @return {!proto.anytype.Event.Message}
 */
proto.anytype.ResponseEvent.prototype.addMessages = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.anytype.Event.Message, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.anytype.ResponseEvent} returns this
 */
proto.anytype.ResponseEvent.prototype.clearMessagesList = function() {
  return this.setMessagesList([]);
};


/**
 * optional string contextId = 2;
 * @return {string}
 */
proto.anytype.ResponseEvent.prototype.getContextid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.ResponseEvent} returns this
 */
proto.anytype.ResponseEvent.prototype.setContextid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Model.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Model.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Model} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Model.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Model}
 */
proto.anytype.Model.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Model;
  return proto.anytype.Model.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Model} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Model}
 */
proto.anytype.Model.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Model.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Model.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Model} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Model.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Model.Process.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Model.Process.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Model.Process} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Model.Process.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    type: jspb.Message.getFieldWithDefault(msg, 2, 0),
    state: jspb.Message.getFieldWithDefault(msg, 3, 0),
    progress: (f = msg.getProgress()) && proto.anytype.Model.Process.Progress.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Model.Process}
 */
proto.anytype.Model.Process.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Model.Process;
  return proto.anytype.Model.Process.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Model.Process} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Model.Process}
 */
proto.anytype.Model.Process.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {!proto.anytype.Model.Process.Type} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 3:
      var value = /** @type {!proto.anytype.Model.Process.State} */ (reader.readEnum());
      msg.setState(value);
      break;
    case 4:
      var value = new proto.anytype.Model.Process.Progress;
      reader.readMessage(value,proto.anytype.Model.Process.Progress.deserializeBinaryFromReader);
      msg.setProgress(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Model.Process.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Model.Process.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Model.Process} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Model.Process.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getState();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
  f = message.getProgress();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.anytype.Model.Process.Progress.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.anytype.Model.Process.Type = {
  DROPFILES: 0
};

/**
 * @enum {number}
 */
proto.anytype.Model.Process.State = {
  NONE: 0,
  RUNNING: 1,
  DONE: 2,
  CANCELED: 3,
  ERROR: 4
};




if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.anytype.Model.Process.Progress.prototype.toObject = function(opt_includeInstance) {
  return proto.anytype.Model.Process.Progress.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.anytype.Model.Process.Progress} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Model.Process.Progress.toObject = function(includeInstance, msg) {
  var f, obj = {
    total: jspb.Message.getFieldWithDefault(msg, 1, 0),
    done: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.anytype.Model.Process.Progress}
 */
proto.anytype.Model.Process.Progress.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.anytype.Model.Process.Progress;
  return proto.anytype.Model.Process.Progress.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.anytype.Model.Process.Progress} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.anytype.Model.Process.Progress}
 */
proto.anytype.Model.Process.Progress.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTotal(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDone(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.anytype.Model.Process.Progress.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.anytype.Model.Process.Progress.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.anytype.Model.Process.Progress} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.anytype.Model.Process.Progress.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTotal();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getDone();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional int64 total = 1;
 * @return {number}
 */
proto.anytype.Model.Process.Progress.prototype.getTotal = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Model.Process.Progress} returns this
 */
proto.anytype.Model.Process.Progress.prototype.setTotal = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int64 done = 2;
 * @return {number}
 */
proto.anytype.Model.Process.Progress.prototype.getDone = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.anytype.Model.Process.Progress} returns this
 */
proto.anytype.Model.Process.Progress.prototype.setDone = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.anytype.Model.Process.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.anytype.Model.Process} returns this
 */
proto.anytype.Model.Process.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Type type = 2;
 * @return {!proto.anytype.Model.Process.Type}
 */
proto.anytype.Model.Process.prototype.getType = function() {
  return /** @type {!proto.anytype.Model.Process.Type} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.anytype.Model.Process.Type} value
 * @return {!proto.anytype.Model.Process} returns this
 */
proto.anytype.Model.Process.prototype.setType = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional State state = 3;
 * @return {!proto.anytype.Model.Process.State}
 */
proto.anytype.Model.Process.prototype.getState = function() {
  return /** @type {!proto.anytype.Model.Process.State} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.anytype.Model.Process.State} value
 * @return {!proto.anytype.Model.Process} returns this
 */
proto.anytype.Model.Process.prototype.setState = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};


/**
 * optional Progress progress = 4;
 * @return {?proto.anytype.Model.Process.Progress}
 */
proto.anytype.Model.Process.prototype.getProgress = function() {
  return /** @type{?proto.anytype.Model.Process.Progress} */ (
    jspb.Message.getWrapperField(this, proto.anytype.Model.Process.Progress, 4));
};


/**
 * @param {?proto.anytype.Model.Process.Progress|undefined} value
 * @return {!proto.anytype.Model.Process} returns this
*/
proto.anytype.Model.Process.prototype.setProgress = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.anytype.Model.Process} returns this
 */
proto.anytype.Model.Process.prototype.clearProgress = function() {
  return this.setProgress(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.anytype.Model.Process.prototype.hasProgress = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * @enum {number}
 */
proto.anytype.SmartBlockType = {
  PAGE: 0,
  HOME: 1,
  PROFILEPAGE: 2,
  ARCHIVE: 3,
  BREADCRUMBS: 4,
  SET: 5
};

goog.object.extend(exports, proto.anytype);
