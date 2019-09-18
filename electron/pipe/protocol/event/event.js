/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.Event = (function() {

    /**
     * Properties of an Event.
     * @exports IEvent
     * @interface IEvent
     * @property {string|null} [entity] Event entity
     * @property {string|null} [op] Event op
     * @property {string|null} [data] Event data
     * @property {string|null} [id] Event id
     */

    /**
     * Constructs a new Event.
     * @exports Event
     * @classdesc Represents an Event.
     * @implements IEvent
     * @constructor
     * @param {IEvent=} [properties] Properties to set
     */
    function Event(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Event entity.
     * @member {string} entity
     * @memberof Event
     * @instance
     */
    Event.prototype.entity = "";

    /**
     * Event op.
     * @member {string} op
     * @memberof Event
     * @instance
     */
    Event.prototype.op = "";

    /**
     * Event data.
     * @member {string} data
     * @memberof Event
     * @instance
     */
    Event.prototype.data = "";

    /**
     * Event id.
     * @member {string} id
     * @memberof Event
     * @instance
     */
    Event.prototype.id = "";

    /**
     * Creates a new Event instance using the specified properties.
     * @function create
     * @memberof Event
     * @static
     * @param {IEvent=} [properties] Properties to set
     * @returns {Event} Event instance
     */
    Event.create = function create(properties) {
        return new Event(properties);
    };

    /**
     * Encodes the specified Event message. Does not implicitly {@link Event.verify|verify} messages.
     * @function encode
     * @memberof Event
     * @static
     * @param {IEvent} message Event message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Event.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.entity != null && message.hasOwnProperty("entity"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.entity);
        if (message.op != null && message.hasOwnProperty("op"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.op);
        if (message.data != null && message.hasOwnProperty("data"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.data);
        if (message.id != null && message.hasOwnProperty("id"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.id);
        return writer;
    };

    /**
     * Encodes the specified Event message, length delimited. Does not implicitly {@link Event.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Event
     * @static
     * @param {IEvent} message Event message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Event.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an Event message from the specified reader or buffer.
     * @function decode
     * @memberof Event
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Event} Event
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Event.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Event();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.entity = reader.string();
                break;
            case 2:
                message.op = reader.string();
                break;
            case 3:
                message.data = reader.string();
                break;
            case 4:
                message.id = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes an Event message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Event
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Event} Event
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Event.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an Event message.
     * @function verify
     * @memberof Event
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Event.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.entity != null && message.hasOwnProperty("entity"))
            if (!$util.isString(message.entity))
                return "entity: string expected";
        if (message.op != null && message.hasOwnProperty("op"))
            if (!$util.isString(message.op))
                return "op: string expected";
        if (message.data != null && message.hasOwnProperty("data"))
            if (!$util.isString(message.data))
                return "data: string expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isString(message.id))
                return "id: string expected";
        return null;
    };

    /**
     * Creates an Event message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Event
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Event} Event
     */
    Event.fromObject = function fromObject(object) {
        if (object instanceof $root.Event)
            return object;
        var message = new $root.Event();
        if (object.entity != null)
            message.entity = String(object.entity);
        if (object.op != null)
            message.op = String(object.op);
        if (object.data != null)
            message.data = String(object.data);
        if (object.id != null)
            message.id = String(object.id);
        return message;
    };

    /**
     * Creates a plain object from an Event message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Event
     * @static
     * @param {Event} message Event
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Event.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.entity = "";
            object.op = "";
            object.data = "";
            object.id = "";
        }
        if (message.entity != null && message.hasOwnProperty("entity"))
            object.entity = message.entity;
        if (message.op != null && message.hasOwnProperty("op"))
            object.op = message.op;
        if (message.data != null && message.hasOwnProperty("data"))
            object.data = message.data;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        return object;
    };

    /**
     * Converts this Event to JSON.
     * @function toJSON
     * @memberof Event
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Event.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return Event;
})();

module.exports = $root;
