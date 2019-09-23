/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.anytype = (function() {

    /**
     * Namespace anytype.
     * @exports anytype
     * @namespace
     */
    var anytype = {};

    anytype.ClientCommands = (function() {

        /**
         * Constructs a new ClientCommands service.
         * @memberof anytype
         * @classdesc Represents a ClientCommands
         * @extends $protobuf.rpc.Service
         * @constructor
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         */
        function ClientCommands(rpcImpl, requestDelimited, responseDelimited) {
            $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
        }

        (ClientCommands.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = ClientCommands;

        /**
         * Creates new ClientCommands service using the specified rpc implementation.
         * @function create
         * @memberof anytype.ClientCommands
         * @static
         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
         * @returns {ClientCommands} RPC service. Useful where requests and/or responses are streamed.
         */
        ClientCommands.create = function create(rpcImpl, requestDelimited, responseDelimited) {
            return new this(rpcImpl, requestDelimited, responseDelimited);
        };

        /**
         * Callback as used by {@link anytype.ClientCommands#walletCreate}.
         * @memberof anytype.ClientCommands
         * @typedef WalletCreateCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.WalletCreateR} [response] WalletCreateR
         */

        /**
         * Calls WalletCreate.
         * @function walletCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletCreateQ} request WalletCreateQ message or plain object
         * @param {anytype.ClientCommands.WalletCreateCallback} callback Node-style callback called with the error, if any, and WalletCreateR
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.walletCreate = function walletCreate(request, callback) {
            return this.rpcCall(walletCreate, $root.anytype.WalletCreateQ, $root.anytype.WalletCreateR, request, callback);
        }, "name", { value: "WalletCreate" });

        /**
         * Calls WalletCreate.
         * @function walletCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletCreateQ} request WalletCreateQ message or plain object
         * @returns {Promise<anytype.WalletCreateR>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link anytype.ClientCommands#walletLogin}.
         * @memberof anytype.ClientCommands
         * @typedef WalletLoginCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.WalletLoginR} [response] WalletLoginR
         */

        /**
         * Calls WalletLogin.
         * @function walletLogin
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletLoginQ} request WalletLoginQ message or plain object
         * @param {anytype.ClientCommands.WalletLoginCallback} callback Node-style callback called with the error, if any, and WalletLoginR
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.walletLogin = function walletLogin(request, callback) {
            return this.rpcCall(walletLogin, $root.anytype.WalletLoginQ, $root.anytype.WalletLoginR, request, callback);
        }, "name", { value: "WalletLogin" });

        /**
         * Calls WalletLogin.
         * @function walletLogin
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletLoginQ} request WalletLoginQ message or plain object
         * @returns {Promise<anytype.WalletLoginR>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link anytype.ClientCommands#accountCreate}.
         * @memberof anytype.ClientCommands
         * @typedef AccountCreateCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.AccountCreateR} [response] AccountCreateR
         */

        /**
         * Calls AccountCreate.
         * @function accountCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountCreateQ} request AccountCreateQ message or plain object
         * @param {anytype.ClientCommands.AccountCreateCallback} callback Node-style callback called with the error, if any, and AccountCreateR
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.accountCreate = function accountCreate(request, callback) {
            return this.rpcCall(accountCreate, $root.anytype.AccountCreateQ, $root.anytype.AccountCreateR, request, callback);
        }, "name", { value: "AccountCreate" });

        /**
         * Calls AccountCreate.
         * @function accountCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountCreateQ} request AccountCreateQ message or plain object
         * @returns {Promise<anytype.AccountCreateR>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link anytype.ClientCommands#accountSelect}.
         * @memberof anytype.ClientCommands
         * @typedef AccountSelectCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.AccountSelectR} [response] AccountSelectR
         */

        /**
         * Calls AccountSelect.
         * @function accountSelect
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountSelectQ} request AccountSelectQ message or plain object
         * @param {anytype.ClientCommands.AccountSelectCallback} callback Node-style callback called with the error, if any, and AccountSelectR
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.accountSelect = function accountSelect(request, callback) {
            return this.rpcCall(accountSelect, $root.anytype.AccountSelectQ, $root.anytype.AccountSelectR, request, callback);
        }, "name", { value: "AccountSelect" });

        /**
         * Calls AccountSelect.
         * @function accountSelect
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountSelectQ} request AccountSelectQ message or plain object
         * @returns {Promise<anytype.AccountSelectR>} Promise
         * @variation 2
         */

        return ClientCommands;
    })();

    anytype.WalletCreateQ = (function() {

        /**
         * Properties of a WalletCreateQ.
         * @memberof anytype
         * @interface IWalletCreateQ
         * @property {string|null} [pin] WalletCreateQ pin
         */

        /**
         * Constructs a new WalletCreateQ.
         * @memberof anytype
         * @classdesc Represents a WalletCreateQ.
         * @implements IWalletCreateQ
         * @constructor
         * @param {anytype.IWalletCreateQ=} [properties] Properties to set
         */
        function WalletCreateQ(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletCreateQ pin.
         * @member {string} pin
         * @memberof anytype.WalletCreateQ
         * @instance
         */
        WalletCreateQ.prototype.pin = "";

        /**
         * Creates a new WalletCreateQ instance using the specified properties.
         * @function create
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {anytype.IWalletCreateQ=} [properties] Properties to set
         * @returns {anytype.WalletCreateQ} WalletCreateQ instance
         */
        WalletCreateQ.create = function create(properties) {
            return new WalletCreateQ(properties);
        };

        /**
         * Encodes the specified WalletCreateQ message. Does not implicitly {@link anytype.WalletCreateQ.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {anytype.IWalletCreateQ} message WalletCreateQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateQ.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.pin != null && message.hasOwnProperty("pin"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.pin);
            return writer;
        };

        /**
         * Encodes the specified WalletCreateQ message, length delimited. Does not implicitly {@link anytype.WalletCreateQ.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {anytype.IWalletCreateQ} message WalletCreateQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateQ.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletCreateQ message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletCreateQ} WalletCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateQ.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletCreateQ();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.pin = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletCreateQ message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletCreateQ} WalletCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateQ.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletCreateQ message.
         * @function verify
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletCreateQ.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.pin != null && message.hasOwnProperty("pin"))
                if (!$util.isString(message.pin))
                    return "pin: string expected";
            return null;
        };

        /**
         * Creates a WalletCreateQ message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletCreateQ} WalletCreateQ
         */
        WalletCreateQ.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletCreateQ)
                return object;
            var message = new $root.anytype.WalletCreateQ();
            if (object.pin != null)
                message.pin = String(object.pin);
            return message;
        };

        /**
         * Creates a plain object from a WalletCreateQ message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletCreateQ
         * @static
         * @param {anytype.WalletCreateQ} message WalletCreateQ
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletCreateQ.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.pin = "";
            if (message.pin != null && message.hasOwnProperty("pin"))
                object.pin = message.pin;
            return object;
        };

        /**
         * Converts this WalletCreateQ to JSON.
         * @function toJSON
         * @memberof anytype.WalletCreateQ
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletCreateQ.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WalletCreateQ;
    })();

    anytype.WalletCreateR = (function() {

        /**
         * Properties of a WalletCreateR.
         * @memberof anytype
         * @interface IWalletCreateR
         * @property {anytype.WalletCreateR.IError|null} [error] WalletCreateR error
         * @property {string|null} [mnemonics] WalletCreateR mnemonics
         */

        /**
         * Constructs a new WalletCreateR.
         * @memberof anytype
         * @classdesc Represents a WalletCreateR.
         * @implements IWalletCreateR
         * @constructor
         * @param {anytype.IWalletCreateR=} [properties] Properties to set
         */
        function WalletCreateR(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletCreateR error.
         * @member {anytype.WalletCreateR.IError|null|undefined} error
         * @memberof anytype.WalletCreateR
         * @instance
         */
        WalletCreateR.prototype.error = null;

        /**
         * WalletCreateR mnemonics.
         * @member {string} mnemonics
         * @memberof anytype.WalletCreateR
         * @instance
         */
        WalletCreateR.prototype.mnemonics = "";

        /**
         * Creates a new WalletCreateR instance using the specified properties.
         * @function create
         * @memberof anytype.WalletCreateR
         * @static
         * @param {anytype.IWalletCreateR=} [properties] Properties to set
         * @returns {anytype.WalletCreateR} WalletCreateR instance
         */
        WalletCreateR.create = function create(properties) {
            return new WalletCreateR(properties);
        };

        /**
         * Encodes the specified WalletCreateR message. Does not implicitly {@link anytype.WalletCreateR.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletCreateR
         * @static
         * @param {anytype.IWalletCreateR} message WalletCreateR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateR.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.WalletCreateR.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.mnemonics != null && message.hasOwnProperty("mnemonics"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.mnemonics);
            return writer;
        };

        /**
         * Encodes the specified WalletCreateR message, length delimited. Does not implicitly {@link anytype.WalletCreateR.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletCreateR
         * @static
         * @param {anytype.IWalletCreateR} message WalletCreateR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateR.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletCreateR message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletCreateR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletCreateR} WalletCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateR.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletCreateR();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.WalletCreateR.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.mnemonics = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletCreateR message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletCreateR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletCreateR} WalletCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateR.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletCreateR message.
         * @function verify
         * @memberof anytype.WalletCreateR
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletCreateR.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.WalletCreateR.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.mnemonics != null && message.hasOwnProperty("mnemonics"))
                if (!$util.isString(message.mnemonics))
                    return "mnemonics: string expected";
            return null;
        };

        /**
         * Creates a WalletCreateR message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletCreateR
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletCreateR} WalletCreateR
         */
        WalletCreateR.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletCreateR)
                return object;
            var message = new $root.anytype.WalletCreateR();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.WalletCreateR.error: object expected");
                message.error = $root.anytype.WalletCreateR.Error.fromObject(object.error);
            }
            if (object.mnemonics != null)
                message.mnemonics = String(object.mnemonics);
            return message;
        };

        /**
         * Creates a plain object from a WalletCreateR message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletCreateR
         * @static
         * @param {anytype.WalletCreateR} message WalletCreateR
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletCreateR.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                object.mnemonics = "";
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.WalletCreateR.Error.toObject(message.error, options);
            if (message.mnemonics != null && message.hasOwnProperty("mnemonics"))
                object.mnemonics = message.mnemonics;
            return object;
        };

        /**
         * Converts this WalletCreateR to JSON.
         * @function toJSON
         * @memberof anytype.WalletCreateR
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletCreateR.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        WalletCreateR.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.WalletCreateR
             * @interface IError
             * @property {anytype.WalletCreateR.Error.Code|null} [code] Error code
             * @property {string|null} [desc] Error desc
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.WalletCreateR
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.WalletCreateR.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.WalletCreateR.Error.Code} code
             * @memberof anytype.WalletCreateR.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error desc.
             * @member {string} desc
             * @memberof anytype.WalletCreateR.Error
             * @instance
             */
            Error.prototype.desc = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {anytype.WalletCreateR.IError=} [properties] Properties to set
             * @returns {anytype.WalletCreateR.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.WalletCreateR.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {anytype.WalletCreateR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.desc != null && message.hasOwnProperty("desc"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.desc);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.WalletCreateR.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {anytype.WalletCreateR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.WalletCreateR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletCreateR.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.desc = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.WalletCreateR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Error message.
             * @function verify
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Error.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code"))
                    switch (message.code) {
                    default:
                        return "code: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.desc != null && message.hasOwnProperty("desc"))
                    if (!$util.isString(message.desc))
                        return "desc: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.WalletCreateR.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.WalletCreateR.Error)
                    return object;
                var message = new $root.anytype.WalletCreateR.Error();
                switch (object.code) {
                case "NULL":
                case 0:
                    message.code = 0;
                    break;
                case "UNKNOWN_ERROR":
                case 1:
                    message.code = 1;
                    break;
                case "BAD_INPUT":
                case 2:
                    message.code = 2;
                    break;
                }
                if (object.desc != null)
                    message.desc = String(object.desc);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.WalletCreateR.Error
             * @static
             * @param {anytype.WalletCreateR.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.desc = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.WalletCreateR.Error.Code[message.code] : message.code;
                if (message.desc != null && message.hasOwnProperty("desc"))
                    object.desc = message.desc;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.WalletCreateR.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.WalletCreateR.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                return values;
            })();

            return Error;
        })();

        return WalletCreateR;
    })();

    anytype.WalletLoginQ = (function() {

        /**
         * Properties of a WalletLoginQ.
         * @memberof anytype
         * @interface IWalletLoginQ
         * @property {string|null} [mnemonics] WalletLoginQ mnemonics
         * @property {string|null} [pin] WalletLoginQ pin
         */

        /**
         * Constructs a new WalletLoginQ.
         * @memberof anytype
         * @classdesc Represents a WalletLoginQ.
         * @implements IWalletLoginQ
         * @constructor
         * @param {anytype.IWalletLoginQ=} [properties] Properties to set
         */
        function WalletLoginQ(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletLoginQ mnemonics.
         * @member {string} mnemonics
         * @memberof anytype.WalletLoginQ
         * @instance
         */
        WalletLoginQ.prototype.mnemonics = "";

        /**
         * WalletLoginQ pin.
         * @member {string} pin
         * @memberof anytype.WalletLoginQ
         * @instance
         */
        WalletLoginQ.prototype.pin = "";

        /**
         * Creates a new WalletLoginQ instance using the specified properties.
         * @function create
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {anytype.IWalletLoginQ=} [properties] Properties to set
         * @returns {anytype.WalletLoginQ} WalletLoginQ instance
         */
        WalletLoginQ.create = function create(properties) {
            return new WalletLoginQ(properties);
        };

        /**
         * Encodes the specified WalletLoginQ message. Does not implicitly {@link anytype.WalletLoginQ.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {anytype.IWalletLoginQ} message WalletLoginQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletLoginQ.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.mnemonics != null && message.hasOwnProperty("mnemonics"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.mnemonics);
            if (message.pin != null && message.hasOwnProperty("pin"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.pin);
            return writer;
        };

        /**
         * Encodes the specified WalletLoginQ message, length delimited. Does not implicitly {@link anytype.WalletLoginQ.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {anytype.IWalletLoginQ} message WalletLoginQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletLoginQ.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletLoginQ message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletLoginQ} WalletLoginQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletLoginQ.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletLoginQ();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.mnemonics = reader.string();
                    break;
                case 2:
                    message.pin = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletLoginQ message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletLoginQ} WalletLoginQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletLoginQ.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletLoginQ message.
         * @function verify
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletLoginQ.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.mnemonics != null && message.hasOwnProperty("mnemonics"))
                if (!$util.isString(message.mnemonics))
                    return "mnemonics: string expected";
            if (message.pin != null && message.hasOwnProperty("pin"))
                if (!$util.isString(message.pin))
                    return "pin: string expected";
            return null;
        };

        /**
         * Creates a WalletLoginQ message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletLoginQ} WalletLoginQ
         */
        WalletLoginQ.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletLoginQ)
                return object;
            var message = new $root.anytype.WalletLoginQ();
            if (object.mnemonics != null)
                message.mnemonics = String(object.mnemonics);
            if (object.pin != null)
                message.pin = String(object.pin);
            return message;
        };

        /**
         * Creates a plain object from a WalletLoginQ message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletLoginQ
         * @static
         * @param {anytype.WalletLoginQ} message WalletLoginQ
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletLoginQ.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.mnemonics = "";
                object.pin = "";
            }
            if (message.mnemonics != null && message.hasOwnProperty("mnemonics"))
                object.mnemonics = message.mnemonics;
            if (message.pin != null && message.hasOwnProperty("pin"))
                object.pin = message.pin;
            return object;
        };

        /**
         * Converts this WalletLoginQ to JSON.
         * @function toJSON
         * @memberof anytype.WalletLoginQ
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletLoginQ.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WalletLoginQ;
    })();

    anytype.WalletLoginR = (function() {

        /**
         * Properties of a WalletLoginR.
         * @memberof anytype
         * @interface IWalletLoginR
         * @property {anytype.WalletLoginR.IError|null} [error] WalletLoginR error
         * @property {anytype.IAccounts|null} [accounts] WalletLoginR accounts
         */

        /**
         * Constructs a new WalletLoginR.
         * @memberof anytype
         * @classdesc Represents a WalletLoginR.
         * @implements IWalletLoginR
         * @constructor
         * @param {anytype.IWalletLoginR=} [properties] Properties to set
         */
        function WalletLoginR(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletLoginR error.
         * @member {anytype.WalletLoginR.IError|null|undefined} error
         * @memberof anytype.WalletLoginR
         * @instance
         */
        WalletLoginR.prototype.error = null;

        /**
         * WalletLoginR accounts.
         * @member {anytype.IAccounts|null|undefined} accounts
         * @memberof anytype.WalletLoginR
         * @instance
         */
        WalletLoginR.prototype.accounts = null;

        /**
         * Creates a new WalletLoginR instance using the specified properties.
         * @function create
         * @memberof anytype.WalletLoginR
         * @static
         * @param {anytype.IWalletLoginR=} [properties] Properties to set
         * @returns {anytype.WalletLoginR} WalletLoginR instance
         */
        WalletLoginR.create = function create(properties) {
            return new WalletLoginR(properties);
        };

        /**
         * Encodes the specified WalletLoginR message. Does not implicitly {@link anytype.WalletLoginR.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletLoginR
         * @static
         * @param {anytype.IWalletLoginR} message WalletLoginR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletLoginR.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.WalletLoginR.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.accounts != null && message.hasOwnProperty("accounts"))
                $root.anytype.Accounts.encode(message.accounts, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified WalletLoginR message, length delimited. Does not implicitly {@link anytype.WalletLoginR.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletLoginR
         * @static
         * @param {anytype.IWalletLoginR} message WalletLoginR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletLoginR.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletLoginR message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletLoginR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletLoginR} WalletLoginR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletLoginR.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletLoginR();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.WalletLoginR.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.accounts = $root.anytype.Accounts.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletLoginR message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletLoginR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletLoginR} WalletLoginR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletLoginR.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletLoginR message.
         * @function verify
         * @memberof anytype.WalletLoginR
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletLoginR.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.WalletLoginR.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.accounts != null && message.hasOwnProperty("accounts")) {
                var error = $root.anytype.Accounts.verify(message.accounts);
                if (error)
                    return "accounts." + error;
            }
            return null;
        };

        /**
         * Creates a WalletLoginR message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletLoginR
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletLoginR} WalletLoginR
         */
        WalletLoginR.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletLoginR)
                return object;
            var message = new $root.anytype.WalletLoginR();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.WalletLoginR.error: object expected");
                message.error = $root.anytype.WalletLoginR.Error.fromObject(object.error);
            }
            if (object.accounts != null) {
                if (typeof object.accounts !== "object")
                    throw TypeError(".anytype.WalletLoginR.accounts: object expected");
                message.accounts = $root.anytype.Accounts.fromObject(object.accounts);
            }
            return message;
        };

        /**
         * Creates a plain object from a WalletLoginR message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletLoginR
         * @static
         * @param {anytype.WalletLoginR} message WalletLoginR
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletLoginR.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                object.accounts = null;
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.WalletLoginR.Error.toObject(message.error, options);
            if (message.accounts != null && message.hasOwnProperty("accounts"))
                object.accounts = $root.anytype.Accounts.toObject(message.accounts, options);
            return object;
        };

        /**
         * Converts this WalletLoginR to JSON.
         * @function toJSON
         * @memberof anytype.WalletLoginR
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletLoginR.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        WalletLoginR.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.WalletLoginR
             * @interface IError
             * @property {anytype.WalletLoginR.Error.Code|null} [code] Error code
             * @property {string|null} [desc] Error desc
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.WalletLoginR
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.WalletLoginR.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.WalletLoginR.Error.Code} code
             * @memberof anytype.WalletLoginR.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error desc.
             * @member {string} desc
             * @memberof anytype.WalletLoginR.Error
             * @instance
             */
            Error.prototype.desc = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {anytype.WalletLoginR.IError=} [properties] Properties to set
             * @returns {anytype.WalletLoginR.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.WalletLoginR.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {anytype.WalletLoginR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.desc != null && message.hasOwnProperty("desc"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.desc);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.WalletLoginR.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {anytype.WalletLoginR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.WalletLoginR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletLoginR.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.desc = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.WalletLoginR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Error message.
             * @function verify
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Error.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code"))
                    switch (message.code) {
                    default:
                        return "code: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.desc != null && message.hasOwnProperty("desc"))
                    if (!$util.isString(message.desc))
                        return "desc: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.WalletLoginR.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.WalletLoginR.Error)
                    return object;
                var message = new $root.anytype.WalletLoginR.Error();
                switch (object.code) {
                case "NULL":
                case 0:
                    message.code = 0;
                    break;
                case "UNKNOWN_ERROR":
                case 1:
                    message.code = 1;
                    break;
                case "BAD_INPUT":
                case 2:
                    message.code = 2;
                    break;
                }
                if (object.desc != null)
                    message.desc = String(object.desc);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.WalletLoginR.Error
             * @static
             * @param {anytype.WalletLoginR.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.desc = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.WalletLoginR.Error.Code[message.code] : message.code;
                if (message.desc != null && message.hasOwnProperty("desc"))
                    object.desc = message.desc;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.WalletLoginR.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.WalletLoginR.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                return values;
            })();

            return Error;
        })();

        return WalletLoginR;
    })();

    anytype.AccountCreateQ = (function() {

        /**
         * Properties of an AccountCreateQ.
         * @memberof anytype
         * @interface IAccountCreateQ
         * @property {string|null} [name] AccountCreateQ name
         * @property {string|null} [icon] AccountCreateQ icon
         */

        /**
         * Constructs a new AccountCreateQ.
         * @memberof anytype
         * @classdesc Represents an AccountCreateQ.
         * @implements IAccountCreateQ
         * @constructor
         * @param {anytype.IAccountCreateQ=} [properties] Properties to set
         */
        function AccountCreateQ(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountCreateQ name.
         * @member {string} name
         * @memberof anytype.AccountCreateQ
         * @instance
         */
        AccountCreateQ.prototype.name = "";

        /**
         * AccountCreateQ icon.
         * @member {string} icon
         * @memberof anytype.AccountCreateQ
         * @instance
         */
        AccountCreateQ.prototype.icon = "";

        /**
         * Creates a new AccountCreateQ instance using the specified properties.
         * @function create
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {anytype.IAccountCreateQ=} [properties] Properties to set
         * @returns {anytype.AccountCreateQ} AccountCreateQ instance
         */
        AccountCreateQ.create = function create(properties) {
            return new AccountCreateQ(properties);
        };

        /**
         * Encodes the specified AccountCreateQ message. Does not implicitly {@link anytype.AccountCreateQ.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {anytype.IAccountCreateQ} message AccountCreateQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateQ.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && message.hasOwnProperty("name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.icon != null && message.hasOwnProperty("icon"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.icon);
            return writer;
        };

        /**
         * Encodes the specified AccountCreateQ message, length delimited. Does not implicitly {@link anytype.AccountCreateQ.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {anytype.IAccountCreateQ} message AccountCreateQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateQ.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountCreateQ message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountCreateQ} AccountCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateQ.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountCreateQ();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.icon = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountCreateQ message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountCreateQ} AccountCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateQ.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountCreateQ message.
         * @function verify
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountCreateQ.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.icon != null && message.hasOwnProperty("icon"))
                if (!$util.isString(message.icon))
                    return "icon: string expected";
            return null;
        };

        /**
         * Creates an AccountCreateQ message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountCreateQ} AccountCreateQ
         */
        AccountCreateQ.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountCreateQ)
                return object;
            var message = new $root.anytype.AccountCreateQ();
            if (object.name != null)
                message.name = String(object.name);
            if (object.icon != null)
                message.icon = String(object.icon);
            return message;
        };

        /**
         * Creates a plain object from an AccountCreateQ message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountCreateQ
         * @static
         * @param {anytype.AccountCreateQ} message AccountCreateQ
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountCreateQ.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.name = "";
                object.icon = "";
            }
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.icon != null && message.hasOwnProperty("icon"))
                object.icon = message.icon;
            return object;
        };

        /**
         * Converts this AccountCreateQ to JSON.
         * @function toJSON
         * @memberof anytype.AccountCreateQ
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountCreateQ.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AccountCreateQ;
    })();

    anytype.AccountCreateR = (function() {

        /**
         * Properties of an AccountCreateR.
         * @memberof anytype
         * @interface IAccountCreateR
         * @property {anytype.AccountCreateR.IError|null} [error] AccountCreateR error
         */

        /**
         * Constructs a new AccountCreateR.
         * @memberof anytype
         * @classdesc Represents an AccountCreateR.
         * @implements IAccountCreateR
         * @constructor
         * @param {anytype.IAccountCreateR=} [properties] Properties to set
         */
        function AccountCreateR(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountCreateR error.
         * @member {anytype.AccountCreateR.IError|null|undefined} error
         * @memberof anytype.AccountCreateR
         * @instance
         */
        AccountCreateR.prototype.error = null;

        /**
         * Creates a new AccountCreateR instance using the specified properties.
         * @function create
         * @memberof anytype.AccountCreateR
         * @static
         * @param {anytype.IAccountCreateR=} [properties] Properties to set
         * @returns {anytype.AccountCreateR} AccountCreateR instance
         */
        AccountCreateR.create = function create(properties) {
            return new AccountCreateR(properties);
        };

        /**
         * Encodes the specified AccountCreateR message. Does not implicitly {@link anytype.AccountCreateR.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountCreateR
         * @static
         * @param {anytype.IAccountCreateR} message AccountCreateR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateR.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.AccountCreateR.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AccountCreateR message, length delimited. Does not implicitly {@link anytype.AccountCreateR.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountCreateR
         * @static
         * @param {anytype.IAccountCreateR} message AccountCreateR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateR.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountCreateR message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountCreateR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountCreateR} AccountCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateR.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountCreateR();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.AccountCreateR.Error.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountCreateR message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountCreateR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountCreateR} AccountCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateR.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountCreateR message.
         * @function verify
         * @memberof anytype.AccountCreateR
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountCreateR.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.AccountCreateR.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            return null;
        };

        /**
         * Creates an AccountCreateR message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountCreateR
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountCreateR} AccountCreateR
         */
        AccountCreateR.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountCreateR)
                return object;
            var message = new $root.anytype.AccountCreateR();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.AccountCreateR.error: object expected");
                message.error = $root.anytype.AccountCreateR.Error.fromObject(object.error);
            }
            return message;
        };

        /**
         * Creates a plain object from an AccountCreateR message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountCreateR
         * @static
         * @param {anytype.AccountCreateR} message AccountCreateR
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountCreateR.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.error = null;
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.AccountCreateR.Error.toObject(message.error, options);
            return object;
        };

        /**
         * Converts this AccountCreateR to JSON.
         * @function toJSON
         * @memberof anytype.AccountCreateR
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountCreateR.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        AccountCreateR.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.AccountCreateR
             * @interface IError
             * @property {anytype.AccountCreateR.Error.Code|null} [code] Error code
             * @property {string|null} [desc] Error desc
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.AccountCreateR
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.AccountCreateR.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.AccountCreateR.Error.Code} code
             * @memberof anytype.AccountCreateR.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error desc.
             * @member {string} desc
             * @memberof anytype.AccountCreateR.Error
             * @instance
             */
            Error.prototype.desc = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {anytype.AccountCreateR.IError=} [properties] Properties to set
             * @returns {anytype.AccountCreateR.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountCreateR.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {anytype.AccountCreateR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.desc != null && message.hasOwnProperty("desc"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.desc);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountCreateR.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {anytype.AccountCreateR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.AccountCreateR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountCreateR.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.desc = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.AccountCreateR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Error message.
             * @function verify
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Error.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code"))
                    switch (message.code) {
                    default:
                        return "code: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.desc != null && message.hasOwnProperty("desc"))
                    if (!$util.isString(message.desc))
                        return "desc: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.AccountCreateR.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.AccountCreateR.Error)
                    return object;
                var message = new $root.anytype.AccountCreateR.Error();
                switch (object.code) {
                case "NULL":
                case 0:
                    message.code = 0;
                    break;
                case "UNKNOWN_ERROR":
                case 1:
                    message.code = 1;
                    break;
                case "BAD_INPUT":
                case 2:
                    message.code = 2;
                    break;
                }
                if (object.desc != null)
                    message.desc = String(object.desc);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.AccountCreateR.Error
             * @static
             * @param {anytype.AccountCreateR.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.desc = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.AccountCreateR.Error.Code[message.code] : message.code;
                if (message.desc != null && message.hasOwnProperty("desc"))
                    object.desc = message.desc;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.AccountCreateR.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.AccountCreateR.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                return values;
            })();

            return Error;
        })();

        return AccountCreateR;
    })();

    anytype.AccountSelectQ = (function() {

        /**
         * Properties of an AccountSelectQ.
         * @memberof anytype
         * @interface IAccountSelectQ
         * @property {string|null} [id] AccountSelectQ id
         */

        /**
         * Constructs a new AccountSelectQ.
         * @memberof anytype
         * @classdesc Represents an AccountSelectQ.
         * @implements IAccountSelectQ
         * @constructor
         * @param {anytype.IAccountSelectQ=} [properties] Properties to set
         */
        function AccountSelectQ(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountSelectQ id.
         * @member {string} id
         * @memberof anytype.AccountSelectQ
         * @instance
         */
        AccountSelectQ.prototype.id = "";

        /**
         * Creates a new AccountSelectQ instance using the specified properties.
         * @function create
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {anytype.IAccountSelectQ=} [properties] Properties to set
         * @returns {anytype.AccountSelectQ} AccountSelectQ instance
         */
        AccountSelectQ.create = function create(properties) {
            return new AccountSelectQ(properties);
        };

        /**
         * Encodes the specified AccountSelectQ message. Does not implicitly {@link anytype.AccountSelectQ.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {anytype.IAccountSelectQ} message AccountSelectQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectQ.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            return writer;
        };

        /**
         * Encodes the specified AccountSelectQ message, length delimited. Does not implicitly {@link anytype.AccountSelectQ.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {anytype.IAccountSelectQ} message AccountSelectQ message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectQ.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountSelectQ message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountSelectQ} AccountSelectQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectQ.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountSelectQ();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
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
         * Decodes an AccountSelectQ message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountSelectQ} AccountSelectQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectQ.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountSelectQ message.
         * @function verify
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountSelectQ.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            return null;
        };

        /**
         * Creates an AccountSelectQ message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountSelectQ} AccountSelectQ
         */
        AccountSelectQ.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountSelectQ)
                return object;
            var message = new $root.anytype.AccountSelectQ();
            if (object.id != null)
                message.id = String(object.id);
            return message;
        };

        /**
         * Creates a plain object from an AccountSelectQ message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountSelectQ
         * @static
         * @param {anytype.AccountSelectQ} message AccountSelectQ
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountSelectQ.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.id = "";
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            return object;
        };

        /**
         * Converts this AccountSelectQ to JSON.
         * @function toJSON
         * @memberof anytype.AccountSelectQ
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountSelectQ.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AccountSelectQ;
    })();

    anytype.AccountSelectR = (function() {

        /**
         * Properties of an AccountSelectR.
         * @memberof anytype
         * @interface IAccountSelectR
         * @property {anytype.AccountSelectR.IError|null} [error] AccountSelectR error
         */

        /**
         * Constructs a new AccountSelectR.
         * @memberof anytype
         * @classdesc Represents an AccountSelectR.
         * @implements IAccountSelectR
         * @constructor
         * @param {anytype.IAccountSelectR=} [properties] Properties to set
         */
        function AccountSelectR(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountSelectR error.
         * @member {anytype.AccountSelectR.IError|null|undefined} error
         * @memberof anytype.AccountSelectR
         * @instance
         */
        AccountSelectR.prototype.error = null;

        /**
         * Creates a new AccountSelectR instance using the specified properties.
         * @function create
         * @memberof anytype.AccountSelectR
         * @static
         * @param {anytype.IAccountSelectR=} [properties] Properties to set
         * @returns {anytype.AccountSelectR} AccountSelectR instance
         */
        AccountSelectR.create = function create(properties) {
            return new AccountSelectR(properties);
        };

        /**
         * Encodes the specified AccountSelectR message. Does not implicitly {@link anytype.AccountSelectR.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountSelectR
         * @static
         * @param {anytype.IAccountSelectR} message AccountSelectR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectR.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.AccountSelectR.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AccountSelectR message, length delimited. Does not implicitly {@link anytype.AccountSelectR.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountSelectR
         * @static
         * @param {anytype.IAccountSelectR} message AccountSelectR message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectR.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountSelectR message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountSelectR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountSelectR} AccountSelectR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectR.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountSelectR();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.AccountSelectR.Error.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountSelectR message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountSelectR
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountSelectR} AccountSelectR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectR.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountSelectR message.
         * @function verify
         * @memberof anytype.AccountSelectR
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountSelectR.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.AccountSelectR.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            return null;
        };

        /**
         * Creates an AccountSelectR message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountSelectR
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountSelectR} AccountSelectR
         */
        AccountSelectR.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountSelectR)
                return object;
            var message = new $root.anytype.AccountSelectR();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.AccountSelectR.error: object expected");
                message.error = $root.anytype.AccountSelectR.Error.fromObject(object.error);
            }
            return message;
        };

        /**
         * Creates a plain object from an AccountSelectR message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountSelectR
         * @static
         * @param {anytype.AccountSelectR} message AccountSelectR
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountSelectR.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.error = null;
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.AccountSelectR.Error.toObject(message.error, options);
            return object;
        };

        /**
         * Converts this AccountSelectR to JSON.
         * @function toJSON
         * @memberof anytype.AccountSelectR
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountSelectR.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        AccountSelectR.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.AccountSelectR
             * @interface IError
             * @property {anytype.AccountSelectR.Error.Code|null} [code] Error code
             * @property {string|null} [desc] Error desc
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.AccountSelectR
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.AccountSelectR.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.AccountSelectR.Error.Code} code
             * @memberof anytype.AccountSelectR.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error desc.
             * @member {string} desc
             * @memberof anytype.AccountSelectR.Error
             * @instance
             */
            Error.prototype.desc = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {anytype.AccountSelectR.IError=} [properties] Properties to set
             * @returns {anytype.AccountSelectR.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountSelectR.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {anytype.AccountSelectR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.desc != null && message.hasOwnProperty("desc"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.desc);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountSelectR.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {anytype.AccountSelectR.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.AccountSelectR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountSelectR.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.desc = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.AccountSelectR.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Error message.
             * @function verify
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Error.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.code != null && message.hasOwnProperty("code"))
                    switch (message.code) {
                    default:
                        return "code: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.desc != null && message.hasOwnProperty("desc"))
                    if (!$util.isString(message.desc))
                        return "desc: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.AccountSelectR.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.AccountSelectR.Error)
                    return object;
                var message = new $root.anytype.AccountSelectR.Error();
                switch (object.code) {
                case "NULL":
                case 0:
                    message.code = 0;
                    break;
                case "UNKNOWN_ERROR":
                case 1:
                    message.code = 1;
                    break;
                case "BAD_INPUT":
                case 2:
                    message.code = 2;
                    break;
                }
                if (object.desc != null)
                    message.desc = String(object.desc);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.AccountSelectR.Error
             * @static
             * @param {anytype.AccountSelectR.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.desc = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.AccountSelectR.Error.Code[message.code] : message.code;
                if (message.desc != null && message.hasOwnProperty("desc"))
                    object.desc = message.desc;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.AccountSelectR.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.AccountSelectR.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                return values;
            })();

            return Error;
        })();

        return AccountSelectR;
    })();

    anytype.Account = (function() {

        /**
         * Properties of an Account.
         * @memberof anytype
         * @interface IAccount
         * @property {string|null} [id] Account id
         * @property {string|null} [name] Account name
         * @property {string|null} [icon] Account icon
         */

        /**
         * Constructs a new Account.
         * @memberof anytype
         * @classdesc Represents an Account.
         * @implements IAccount
         * @constructor
         * @param {anytype.IAccount=} [properties] Properties to set
         */
        function Account(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Account id.
         * @member {string} id
         * @memberof anytype.Account
         * @instance
         */
        Account.prototype.id = "";

        /**
         * Account name.
         * @member {string} name
         * @memberof anytype.Account
         * @instance
         */
        Account.prototype.name = "";

        /**
         * Account icon.
         * @member {string} icon
         * @memberof anytype.Account
         * @instance
         */
        Account.prototype.icon = "";

        /**
         * Creates a new Account instance using the specified properties.
         * @function create
         * @memberof anytype.Account
         * @static
         * @param {anytype.IAccount=} [properties] Properties to set
         * @returns {anytype.Account} Account instance
         */
        Account.create = function create(properties) {
            return new Account(properties);
        };

        /**
         * Encodes the specified Account message. Does not implicitly {@link anytype.Account.verify|verify} messages.
         * @function encode
         * @memberof anytype.Account
         * @static
         * @param {anytype.IAccount} message Account message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Account.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.name != null && message.hasOwnProperty("name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.icon != null && message.hasOwnProperty("icon"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.icon);
            return writer;
        };

        /**
         * Encodes the specified Account message, length delimited. Does not implicitly {@link anytype.Account.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Account
         * @static
         * @param {anytype.IAccount} message Account message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Account.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Account message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Account
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Account} Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Account.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Account();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.icon = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Account message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.Account
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Account} Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Account.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Account message.
         * @function verify
         * @memberof anytype.Account
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Account.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.icon != null && message.hasOwnProperty("icon"))
                if (!$util.isString(message.icon))
                    return "icon: string expected";
            return null;
        };

        /**
         * Creates an Account message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Account
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Account} Account
         */
        Account.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Account)
                return object;
            var message = new $root.anytype.Account();
            if (object.id != null)
                message.id = String(object.id);
            if (object.name != null)
                message.name = String(object.name);
            if (object.icon != null)
                message.icon = String(object.icon);
            return message;
        };

        /**
         * Creates a plain object from an Account message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Account
         * @static
         * @param {anytype.Account} message Account
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Account.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = "";
                object.name = "";
                object.icon = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.icon != null && message.hasOwnProperty("icon"))
                object.icon = message.icon;
            return object;
        };

        /**
         * Converts this Account to JSON.
         * @function toJSON
         * @memberof anytype.Account
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Account.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Account;
    })();

    anytype.Accounts = (function() {

        /**
         * Properties of an Accounts.
         * @memberof anytype
         * @interface IAccounts
         * @property {Array.<anytype.IAccount>|null} [accounts] Accounts accounts
         */

        /**
         * Constructs a new Accounts.
         * @memberof anytype
         * @classdesc Represents an Accounts.
         * @implements IAccounts
         * @constructor
         * @param {anytype.IAccounts=} [properties] Properties to set
         */
        function Accounts(properties) {
            this.accounts = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Accounts accounts.
         * @member {Array.<anytype.IAccount>} accounts
         * @memberof anytype.Accounts
         * @instance
         */
        Accounts.prototype.accounts = $util.emptyArray;

        /**
         * Creates a new Accounts instance using the specified properties.
         * @function create
         * @memberof anytype.Accounts
         * @static
         * @param {anytype.IAccounts=} [properties] Properties to set
         * @returns {anytype.Accounts} Accounts instance
         */
        Accounts.create = function create(properties) {
            return new Accounts(properties);
        };

        /**
         * Encodes the specified Accounts message. Does not implicitly {@link anytype.Accounts.verify|verify} messages.
         * @function encode
         * @memberof anytype.Accounts
         * @static
         * @param {anytype.IAccounts} message Accounts message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Accounts.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.accounts != null && message.accounts.length)
                for (var i = 0; i < message.accounts.length; ++i)
                    $root.anytype.Account.encode(message.accounts[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Accounts message, length delimited. Does not implicitly {@link anytype.Accounts.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Accounts
         * @static
         * @param {anytype.IAccounts} message Accounts message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Accounts.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Accounts message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Accounts
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Accounts} Accounts
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Accounts.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Accounts();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.accounts && message.accounts.length))
                        message.accounts = [];
                    message.accounts.push($root.anytype.Account.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Accounts message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.Accounts
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Accounts} Accounts
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Accounts.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Accounts message.
         * @function verify
         * @memberof anytype.Accounts
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Accounts.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.accounts != null && message.hasOwnProperty("accounts")) {
                if (!Array.isArray(message.accounts))
                    return "accounts: array expected";
                for (var i = 0; i < message.accounts.length; ++i) {
                    var error = $root.anytype.Account.verify(message.accounts[i]);
                    if (error)
                        return "accounts." + error;
                }
            }
            return null;
        };

        /**
         * Creates an Accounts message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Accounts
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Accounts} Accounts
         */
        Accounts.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Accounts)
                return object;
            var message = new $root.anytype.Accounts();
            if (object.accounts) {
                if (!Array.isArray(object.accounts))
                    throw TypeError(".anytype.Accounts.accounts: array expected");
                message.accounts = [];
                for (var i = 0; i < object.accounts.length; ++i) {
                    if (typeof object.accounts[i] !== "object")
                        throw TypeError(".anytype.Accounts.accounts: object expected");
                    message.accounts[i] = $root.anytype.Account.fromObject(object.accounts[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from an Accounts message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Accounts
         * @static
         * @param {anytype.Accounts} message Accounts
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Accounts.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.accounts = [];
            if (message.accounts && message.accounts.length) {
                object.accounts = [];
                for (var j = 0; j < message.accounts.length; ++j)
                    object.accounts[j] = $root.anytype.Account.toObject(message.accounts[j], options);
            }
            return object;
        };

        /**
         * Converts this Accounts to JSON.
         * @function toJSON
         * @memberof anytype.Accounts
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Accounts.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Accounts;
    })();

    anytype.State = (function() {

        /**
         * Properties of a State.
         * @memberof anytype
         * @interface IState
         * @property {Array.<anytype.IDocHeader>|null} [docHeaders] State docHeaders
         * @property {string|null} [currentDocId] State currentDocId
         */

        /**
         * Constructs a new State.
         * @memberof anytype
         * @classdesc Represents a State.
         * @implements IState
         * @constructor
         * @param {anytype.IState=} [properties] Properties to set
         */
        function State(properties) {
            this.docHeaders = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * State docHeaders.
         * @member {Array.<anytype.IDocHeader>} docHeaders
         * @memberof anytype.State
         * @instance
         */
        State.prototype.docHeaders = $util.emptyArray;

        /**
         * State currentDocId.
         * @member {string} currentDocId
         * @memberof anytype.State
         * @instance
         */
        State.prototype.currentDocId = "";

        /**
         * Creates a new State instance using the specified properties.
         * @function create
         * @memberof anytype.State
         * @static
         * @param {anytype.IState=} [properties] Properties to set
         * @returns {anytype.State} State instance
         */
        State.create = function create(properties) {
            return new State(properties);
        };

        /**
         * Encodes the specified State message. Does not implicitly {@link anytype.State.verify|verify} messages.
         * @function encode
         * @memberof anytype.State
         * @static
         * @param {anytype.IState} message State message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        State.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.docHeaders != null && message.docHeaders.length)
                for (var i = 0; i < message.docHeaders.length; ++i)
                    $root.anytype.DocHeader.encode(message.docHeaders[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.currentDocId != null && message.hasOwnProperty("currentDocId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.currentDocId);
            return writer;
        };

        /**
         * Encodes the specified State message, length delimited. Does not implicitly {@link anytype.State.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.State
         * @static
         * @param {anytype.IState} message State message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        State.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a State message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.State
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.State} State
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        State.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.State();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.docHeaders && message.docHeaders.length))
                        message.docHeaders = [];
                    message.docHeaders.push($root.anytype.DocHeader.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.currentDocId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a State message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.State
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.State} State
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        State.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a State message.
         * @function verify
         * @memberof anytype.State
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        State.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.docHeaders != null && message.hasOwnProperty("docHeaders")) {
                if (!Array.isArray(message.docHeaders))
                    return "docHeaders: array expected";
                for (var i = 0; i < message.docHeaders.length; ++i) {
                    var error = $root.anytype.DocHeader.verify(message.docHeaders[i]);
                    if (error)
                        return "docHeaders." + error;
                }
            }
            if (message.currentDocId != null && message.hasOwnProperty("currentDocId"))
                if (!$util.isString(message.currentDocId))
                    return "currentDocId: string expected";
            return null;
        };

        /**
         * Creates a State message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.State
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.State} State
         */
        State.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.State)
                return object;
            var message = new $root.anytype.State();
            if (object.docHeaders) {
                if (!Array.isArray(object.docHeaders))
                    throw TypeError(".anytype.State.docHeaders: array expected");
                message.docHeaders = [];
                for (var i = 0; i < object.docHeaders.length; ++i) {
                    if (typeof object.docHeaders[i] !== "object")
                        throw TypeError(".anytype.State.docHeaders: object expected");
                    message.docHeaders[i] = $root.anytype.DocHeader.fromObject(object.docHeaders[i]);
                }
            }
            if (object.currentDocId != null)
                message.currentDocId = String(object.currentDocId);
            return message;
        };

        /**
         * Creates a plain object from a State message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.State
         * @static
         * @param {anytype.State} message State
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        State.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.docHeaders = [];
            if (options.defaults)
                object.currentDocId = "";
            if (message.docHeaders && message.docHeaders.length) {
                object.docHeaders = [];
                for (var j = 0; j < message.docHeaders.length; ++j)
                    object.docHeaders[j] = $root.anytype.DocHeader.toObject(message.docHeaders[j], options);
            }
            if (message.currentDocId != null && message.hasOwnProperty("currentDocId"))
                object.currentDocId = message.currentDocId;
            return object;
        };

        /**
         * Converts this State to JSON.
         * @function toJSON
         * @memberof anytype.State
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        State.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return State;
    })();

    anytype.DocHeader = (function() {

        /**
         * Properties of a DocHeader.
         * @memberof anytype
         * @interface IDocHeader
         * @property {string|null} [id] DocHeader id
         * @property {string|null} [name] DocHeader name
         * @property {string|null} [version] DocHeader version
         * @property {string|null} [icon] DocHeader icon
         */

        /**
         * Constructs a new DocHeader.
         * @memberof anytype
         * @classdesc Represents a DocHeader.
         * @implements IDocHeader
         * @constructor
         * @param {anytype.IDocHeader=} [properties] Properties to set
         */
        function DocHeader(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * DocHeader id.
         * @member {string} id
         * @memberof anytype.DocHeader
         * @instance
         */
        DocHeader.prototype.id = "";

        /**
         * DocHeader name.
         * @member {string} name
         * @memberof anytype.DocHeader
         * @instance
         */
        DocHeader.prototype.name = "";

        /**
         * DocHeader version.
         * @member {string} version
         * @memberof anytype.DocHeader
         * @instance
         */
        DocHeader.prototype.version = "";

        /**
         * DocHeader icon.
         * @member {string} icon
         * @memberof anytype.DocHeader
         * @instance
         */
        DocHeader.prototype.icon = "";

        /**
         * Creates a new DocHeader instance using the specified properties.
         * @function create
         * @memberof anytype.DocHeader
         * @static
         * @param {anytype.IDocHeader=} [properties] Properties to set
         * @returns {anytype.DocHeader} DocHeader instance
         */
        DocHeader.create = function create(properties) {
            return new DocHeader(properties);
        };

        /**
         * Encodes the specified DocHeader message. Does not implicitly {@link anytype.DocHeader.verify|verify} messages.
         * @function encode
         * @memberof anytype.DocHeader
         * @static
         * @param {anytype.IDocHeader} message DocHeader message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DocHeader.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.name != null && message.hasOwnProperty("name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.version != null && message.hasOwnProperty("version"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.version);
            if (message.icon != null && message.hasOwnProperty("icon"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.icon);
            return writer;
        };

        /**
         * Encodes the specified DocHeader message, length delimited. Does not implicitly {@link anytype.DocHeader.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.DocHeader
         * @static
         * @param {anytype.IDocHeader} message DocHeader message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DocHeader.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DocHeader message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.DocHeader
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.DocHeader} DocHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DocHeader.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.DocHeader();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.version = reader.string();
                    break;
                case 4:
                    message.icon = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a DocHeader message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.DocHeader
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.DocHeader} DocHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DocHeader.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DocHeader message.
         * @function verify
         * @memberof anytype.DocHeader
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DocHeader.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.version != null && message.hasOwnProperty("version"))
                if (!$util.isString(message.version))
                    return "version: string expected";
            if (message.icon != null && message.hasOwnProperty("icon"))
                if (!$util.isString(message.icon))
                    return "icon: string expected";
            return null;
        };

        /**
         * Creates a DocHeader message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.DocHeader
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.DocHeader} DocHeader
         */
        DocHeader.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.DocHeader)
                return object;
            var message = new $root.anytype.DocHeader();
            if (object.id != null)
                message.id = String(object.id);
            if (object.name != null)
                message.name = String(object.name);
            if (object.version != null)
                message.version = String(object.version);
            if (object.icon != null)
                message.icon = String(object.icon);
            return message;
        };

        /**
         * Creates a plain object from a DocHeader message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.DocHeader
         * @static
         * @param {anytype.DocHeader} message DocHeader
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DocHeader.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = "";
                object.name = "";
                object.version = "";
                object.icon = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            if (message.icon != null && message.hasOwnProperty("icon"))
                object.icon = message.icon;
            return object;
        };

        /**
         * Converts this DocHeader to JSON.
         * @function toJSON
         * @memberof anytype.DocHeader
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DocHeader.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return DocHeader;
    })();

    anytype.Document = (function() {

        /**
         * Properties of a Document.
         * @memberof anytype
         * @interface IDocument
         * @property {anytype.IDocHeader|null} [header] Document header
         * @property {Array.<anytype.IBlock>|null} [blocks] Document blocks
         */

        /**
         * Constructs a new Document.
         * @memberof anytype
         * @classdesc Represents a Document.
         * @implements IDocument
         * @constructor
         * @param {anytype.IDocument=} [properties] Properties to set
         */
        function Document(properties) {
            this.blocks = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Document header.
         * @member {anytype.IDocHeader|null|undefined} header
         * @memberof anytype.Document
         * @instance
         */
        Document.prototype.header = null;

        /**
         * Document blocks.
         * @member {Array.<anytype.IBlock>} blocks
         * @memberof anytype.Document
         * @instance
         */
        Document.prototype.blocks = $util.emptyArray;

        /**
         * Creates a new Document instance using the specified properties.
         * @function create
         * @memberof anytype.Document
         * @static
         * @param {anytype.IDocument=} [properties] Properties to set
         * @returns {anytype.Document} Document instance
         */
        Document.create = function create(properties) {
            return new Document(properties);
        };

        /**
         * Encodes the specified Document message. Does not implicitly {@link anytype.Document.verify|verify} messages.
         * @function encode
         * @memberof anytype.Document
         * @static
         * @param {anytype.IDocument} message Document message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Document.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.header != null && message.hasOwnProperty("header"))
                $root.anytype.DocHeader.encode(message.header, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.blocks != null && message.blocks.length)
                for (var i = 0; i < message.blocks.length; ++i)
                    $root.anytype.Block.encode(message.blocks[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Document message, length delimited. Does not implicitly {@link anytype.Document.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Document
         * @static
         * @param {anytype.IDocument} message Document message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Document.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Document message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Document
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Document} Document
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Document.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Document();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.header = $root.anytype.DocHeader.decode(reader, reader.uint32());
                    break;
                case 2:
                    if (!(message.blocks && message.blocks.length))
                        message.blocks = [];
                    message.blocks.push($root.anytype.Block.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Document message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.Document
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Document} Document
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Document.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Document message.
         * @function verify
         * @memberof anytype.Document
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Document.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.header != null && message.hasOwnProperty("header")) {
                var error = $root.anytype.DocHeader.verify(message.header);
                if (error)
                    return "header." + error;
            }
            if (message.blocks != null && message.hasOwnProperty("blocks")) {
                if (!Array.isArray(message.blocks))
                    return "blocks: array expected";
                for (var i = 0; i < message.blocks.length; ++i) {
                    var error = $root.anytype.Block.verify(message.blocks[i]);
                    if (error)
                        return "blocks." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Document message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Document
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Document} Document
         */
        Document.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Document)
                return object;
            var message = new $root.anytype.Document();
            if (object.header != null) {
                if (typeof object.header !== "object")
                    throw TypeError(".anytype.Document.header: object expected");
                message.header = $root.anytype.DocHeader.fromObject(object.header);
            }
            if (object.blocks) {
                if (!Array.isArray(object.blocks))
                    throw TypeError(".anytype.Document.blocks: array expected");
                message.blocks = [];
                for (var i = 0; i < object.blocks.length; ++i) {
                    if (typeof object.blocks[i] !== "object")
                        throw TypeError(".anytype.Document.blocks: object expected");
                    message.blocks[i] = $root.anytype.Block.fromObject(object.blocks[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a Document message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Document
         * @static
         * @param {anytype.Document} message Document
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Document.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.blocks = [];
            if (options.defaults)
                object.header = null;
            if (message.header != null && message.hasOwnProperty("header"))
                object.header = $root.anytype.DocHeader.toObject(message.header, options);
            if (message.blocks && message.blocks.length) {
                object.blocks = [];
                for (var j = 0; j < message.blocks.length; ++j)
                    object.blocks[j] = $root.anytype.Block.toObject(message.blocks[j], options);
            }
            return object;
        };

        /**
         * Converts this Document to JSON.
         * @function toJSON
         * @memberof anytype.Document
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Document.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Document;
    })();

    anytype.Text = (function() {

        /**
         * Properties of a Text.
         * @memberof anytype
         * @interface IText
         * @property {string|null} [content] Text content
         * @property {Array.<anytype.IMark>|null} [marks] Text marks
         * @property {anytype.ContentType|null} [contentType] Text contentType
         */

        /**
         * Constructs a new Text.
         * @memberof anytype
         * @classdesc Represents a Text.
         * @implements IText
         * @constructor
         * @param {anytype.IText=} [properties] Properties to set
         */
        function Text(properties) {
            this.marks = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Text content.
         * @member {string} content
         * @memberof anytype.Text
         * @instance
         */
        Text.prototype.content = "";

        /**
         * Text marks.
         * @member {Array.<anytype.IMark>} marks
         * @memberof anytype.Text
         * @instance
         */
        Text.prototype.marks = $util.emptyArray;

        /**
         * Text contentType.
         * @member {anytype.ContentType} contentType
         * @memberof anytype.Text
         * @instance
         */
        Text.prototype.contentType = 0;

        /**
         * Creates a new Text instance using the specified properties.
         * @function create
         * @memberof anytype.Text
         * @static
         * @param {anytype.IText=} [properties] Properties to set
         * @returns {anytype.Text} Text instance
         */
        Text.create = function create(properties) {
            return new Text(properties);
        };

        /**
         * Encodes the specified Text message. Does not implicitly {@link anytype.Text.verify|verify} messages.
         * @function encode
         * @memberof anytype.Text
         * @static
         * @param {anytype.IText} message Text message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Text.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.content != null && message.hasOwnProperty("content"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.content);
            if (message.marks != null && message.marks.length)
                for (var i = 0; i < message.marks.length; ++i)
                    $root.anytype.Mark.encode(message.marks[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.contentType != null && message.hasOwnProperty("contentType"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.contentType);
            return writer;
        };

        /**
         * Encodes the specified Text message, length delimited. Does not implicitly {@link anytype.Text.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Text
         * @static
         * @param {anytype.IText} message Text message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Text.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Text message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Text
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Text} Text
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Text.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Text();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.content = reader.string();
                    break;
                case 2:
                    if (!(message.marks && message.marks.length))
                        message.marks = [];
                    message.marks.push($root.anytype.Mark.decode(reader, reader.uint32()));
                    break;
                case 3:
                    message.contentType = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Text message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.Text
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Text} Text
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Text.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Text message.
         * @function verify
         * @memberof anytype.Text
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Text.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.content != null && message.hasOwnProperty("content"))
                if (!$util.isString(message.content))
                    return "content: string expected";
            if (message.marks != null && message.hasOwnProperty("marks")) {
                if (!Array.isArray(message.marks))
                    return "marks: array expected";
                for (var i = 0; i < message.marks.length; ++i) {
                    var error = $root.anytype.Mark.verify(message.marks[i]);
                    if (error)
                        return "marks." + error;
                }
            }
            if (message.contentType != null && message.hasOwnProperty("contentType"))
                switch (message.contentType) {
                default:
                    return "contentType: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                    break;
                }
            return null;
        };

        /**
         * Creates a Text message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Text
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Text} Text
         */
        Text.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Text)
                return object;
            var message = new $root.anytype.Text();
            if (object.content != null)
                message.content = String(object.content);
            if (object.marks) {
                if (!Array.isArray(object.marks))
                    throw TypeError(".anytype.Text.marks: array expected");
                message.marks = [];
                for (var i = 0; i < object.marks.length; ++i) {
                    if (typeof object.marks[i] !== "object")
                        throw TypeError(".anytype.Text.marks: object expected");
                    message.marks[i] = $root.anytype.Mark.fromObject(object.marks[i]);
                }
            }
            switch (object.contentType) {
            case "P":
            case 0:
                message.contentType = 0;
                break;
            case "CODE":
            case 1:
                message.contentType = 1;
                break;
            case "H_1":
            case 2:
                message.contentType = 2;
                break;
            case "H_2":
            case 3:
                message.contentType = 3;
                break;
            case "H_3":
            case 4:
                message.contentType = 4;
                break;
            case "H_4":
            case 5:
                message.contentType = 5;
                break;
            case "OL":
            case 6:
                message.contentType = 6;
                break;
            case "UL":
            case 7:
                message.contentType = 7;
                break;
            case "QUOTE":
            case 8:
                message.contentType = 8;
                break;
            case "TOGGLE":
            case 9:
                message.contentType = 9;
                break;
            case "CHECK":
            case 10:
                message.contentType = 10;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from a Text message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Text
         * @static
         * @param {anytype.Text} message Text
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Text.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.marks = [];
            if (options.defaults) {
                object.content = "";
                object.contentType = options.enums === String ? "P" : 0;
            }
            if (message.content != null && message.hasOwnProperty("content"))
                object.content = message.content;
            if (message.marks && message.marks.length) {
                object.marks = [];
                for (var j = 0; j < message.marks.length; ++j)
                    object.marks[j] = $root.anytype.Mark.toObject(message.marks[j], options);
            }
            if (message.contentType != null && message.hasOwnProperty("contentType"))
                object.contentType = options.enums === String ? $root.anytype.ContentType[message.contentType] : message.contentType;
            return object;
        };

        /**
         * Converts this Text to JSON.
         * @function toJSON
         * @memberof anytype.Text
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Text.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Text;
    })();

    anytype.Mark = (function() {

        /**
         * Properties of a Mark.
         * @memberof anytype
         * @interface IMark
         * @property {anytype.MarkType|null} [type] Mark type
         */

        /**
         * Constructs a new Mark.
         * @memberof anytype
         * @classdesc Represents a Mark.
         * @implements IMark
         * @constructor
         * @param {anytype.IMark=} [properties] Properties to set
         */
        function Mark(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Mark type.
         * @member {anytype.MarkType} type
         * @memberof anytype.Mark
         * @instance
         */
        Mark.prototype.type = 0;

        /**
         * Creates a new Mark instance using the specified properties.
         * @function create
         * @memberof anytype.Mark
         * @static
         * @param {anytype.IMark=} [properties] Properties to set
         * @returns {anytype.Mark} Mark instance
         */
        Mark.create = function create(properties) {
            return new Mark(properties);
        };

        /**
         * Encodes the specified Mark message. Does not implicitly {@link anytype.Mark.verify|verify} messages.
         * @function encode
         * @memberof anytype.Mark
         * @static
         * @param {anytype.IMark} message Mark message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Mark.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
            return writer;
        };

        /**
         * Encodes the specified Mark message, length delimited. Does not implicitly {@link anytype.Mark.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Mark
         * @static
         * @param {anytype.IMark} message Mark message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Mark.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Mark message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Mark
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Mark} Mark
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Mark.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Mark();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.type = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Mark message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.Mark
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Mark} Mark
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Mark.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Mark message.
         * @function verify
         * @memberof anytype.Mark
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Mark.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                    break;
                }
            return null;
        };

        /**
         * Creates a Mark message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Mark
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Mark} Mark
         */
        Mark.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Mark)
                return object;
            var message = new $root.anytype.Mark();
            switch (object.type) {
            case "B":
            case 0:
                message.type = 0;
                break;
            case "I":
            case 1:
                message.type = 1;
                break;
            case "S":
            case 2:
                message.type = 2;
                break;
            case "KBD":
            case 3:
                message.type = 3;
                break;
            case "A":
            case 4:
                message.type = 4;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from a Mark message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Mark
         * @static
         * @param {anytype.Mark} message Mark
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Mark.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.type = options.enums === String ? "B" : 0;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.anytype.MarkType[message.type] : message.type;
            return object;
        };

        /**
         * Converts this Mark to JSON.
         * @function toJSON
         * @memberof anytype.Mark
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Mark.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Mark;
    })();

    anytype.Block = (function() {

        /**
         * Properties of a Block.
         * @memberof anytype
         * @interface IBlock
         * @property {string|null} [id] Block id
         * @property {anytype.IText|null} [text] Block text
         */

        /**
         * Constructs a new Block.
         * @memberof anytype
         * @classdesc Represents a Block.
         * @implements IBlock
         * @constructor
         * @param {anytype.IBlock=} [properties] Properties to set
         */
        function Block(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Block id.
         * @member {string} id
         * @memberof anytype.Block
         * @instance
         */
        Block.prototype.id = "";

        /**
         * Block text.
         * @member {anytype.IText|null|undefined} text
         * @memberof anytype.Block
         * @instance
         */
        Block.prototype.text = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * Block content.
         * @member {"text"|undefined} content
         * @memberof anytype.Block
         * @instance
         */
        Object.defineProperty(Block.prototype, "content", {
            get: $util.oneOfGetter($oneOfFields = ["text"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Block instance using the specified properties.
         * @function create
         * @memberof anytype.Block
         * @static
         * @param {anytype.IBlock=} [properties] Properties to set
         * @returns {anytype.Block} Block instance
         */
        Block.create = function create(properties) {
            return new Block(properties);
        };

        /**
         * Encodes the specified Block message. Does not implicitly {@link anytype.Block.verify|verify} messages.
         * @function encode
         * @memberof anytype.Block
         * @static
         * @param {anytype.IBlock} message Block message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Block.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.text != null && message.hasOwnProperty("text"))
                $root.anytype.Text.encode(message.text, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Block message, length delimited. Does not implicitly {@link anytype.Block.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Block
         * @static
         * @param {anytype.IBlock} message Block message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Block.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Block message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Block
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Block} Block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Block.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Block();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 11:
                    message.text = $root.anytype.Text.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Block message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.Block
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Block} Block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Block.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Block message.
         * @function verify
         * @memberof anytype.Block
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Block.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            var properties = {};
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.text != null && message.hasOwnProperty("text")) {
                properties.content = 1;
                {
                    var error = $root.anytype.Text.verify(message.text);
                    if (error)
                        return "text." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Block message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Block
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Block} Block
         */
        Block.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Block)
                return object;
            var message = new $root.anytype.Block();
            if (object.id != null)
                message.id = String(object.id);
            if (object.text != null) {
                if (typeof object.text !== "object")
                    throw TypeError(".anytype.Block.text: object expected");
                message.text = $root.anytype.Text.fromObject(object.text);
            }
            return message;
        };

        /**
         * Creates a plain object from a Block message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Block
         * @static
         * @param {anytype.Block} message Block
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Block.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.id = "";
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.text != null && message.hasOwnProperty("text")) {
                object.text = $root.anytype.Text.toObject(message.text, options);
                if (options.oneofs)
                    object.content = "text";
            }
            return object;
        };

        /**
         * Converts this Block to JSON.
         * @function toJSON
         * @memberof anytype.Block
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Block.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Block;
    })();

    /**
     * StatusType enum.
     * @name anytype.StatusType
     * @enum {string}
     * @property {number} SUCCESS=0 SUCCESS value
     * @property {number} FAILURE=1 FAILURE value
     * @property {number} WRONG_MNEMONIC=2 WRONG_MNEMONIC value
     * @property {number} NOT_FOUND=3 NOT_FOUND value
     */
    anytype.StatusType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "SUCCESS"] = 0;
        values[valuesById[1] = "FAILURE"] = 1;
        values[valuesById[2] = "WRONG_MNEMONIC"] = 2;
        values[valuesById[3] = "NOT_FOUND"] = 3;
        return values;
    })();

    /**
     * MarkType enum.
     * @name anytype.MarkType
     * @enum {string}
     * @property {number} B=0 B value
     * @property {number} I=1 I value
     * @property {number} S=2 S value
     * @property {number} KBD=3 KBD value
     * @property {number} A=4 A value
     */
    anytype.MarkType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "B"] = 0;
        values[valuesById[1] = "I"] = 1;
        values[valuesById[2] = "S"] = 2;
        values[valuesById[3] = "KBD"] = 3;
        values[valuesById[4] = "A"] = 4;
        return values;
    })();

    /**
     * ContentType enum.
     * @name anytype.ContentType
     * @enum {string}
     * @property {number} P=0 P value
     * @property {number} CODE=1 CODE value
     * @property {number} H_1=2 H_1 value
     * @property {number} H_2=3 H_2 value
     * @property {number} H_3=4 H_3 value
     * @property {number} H_4=5 H_4 value
     * @property {number} OL=6 OL value
     * @property {number} UL=7 UL value
     * @property {number} QUOTE=8 QUOTE value
     * @property {number} TOGGLE=9 TOGGLE value
     * @property {number} CHECK=10 CHECK value
     */
    anytype.ContentType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "P"] = 0;
        values[valuesById[1] = "CODE"] = 1;
        values[valuesById[2] = "H_1"] = 2;
        values[valuesById[3] = "H_2"] = 3;
        values[valuesById[4] = "H_3"] = 4;
        values[valuesById[5] = "H_4"] = 5;
        values[valuesById[6] = "OL"] = 6;
        values[valuesById[7] = "UL"] = 7;
        values[valuesById[8] = "QUOTE"] = 8;
        values[valuesById[9] = "TOGGLE"] = 9;
        values[valuesById[10] = "CHECK"] = 10;
        return values;
    })();

    /**
     * BlockType enum.
     * @name anytype.BlockType
     * @enum {string}
     * @property {number} H_GRID=0 H_GRID value
     * @property {number} V_GRID=1 V_GRID value
     * @property {number} EDITABLE=2 EDITABLE value
     * @property {number} DIV=3 DIV value
     * @property {number} VIDEO=4 VIDEO value
     * @property {number} IMAGE=5 IMAGE value
     * @property {number} PAGE=6 PAGE value
     * @property {number} NEW_PAGE=7 NEW_PAGE value
     * @property {number} BOOK_MARK=8 BOOK_MARK value
     * @property {number} FILE=9 FILE value
     * @property {number} DATA_VIEW=10 DATA_VIEW value
     */
    anytype.BlockType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "H_GRID"] = 0;
        values[valuesById[1] = "V_GRID"] = 1;
        values[valuesById[2] = "EDITABLE"] = 2;
        values[valuesById[3] = "DIV"] = 3;
        values[valuesById[4] = "VIDEO"] = 4;
        values[valuesById[5] = "IMAGE"] = 5;
        values[valuesById[6] = "PAGE"] = 6;
        values[valuesById[7] = "NEW_PAGE"] = 7;
        values[valuesById[8] = "BOOK_MARK"] = 8;
        values[valuesById[9] = "FILE"] = 9;
        values[valuesById[10] = "DATA_VIEW"] = 10;
        return values;
    })();

    anytype.Event = (function() {

        /**
         * Properties of an Event.
         * @memberof anytype
         * @interface IEvent
         * @property {anytype.IBlockCreate|null} [blockCreate] Event blockCreate
         * @property {anytype.IBlockUpdate|null} [blockUpdate] Event blockUpdate
         * @property {anytype.IBlockRemove|null} [blockRemove] Event blockRemove
         */

        /**
         * Constructs a new Event.
         * @memberof anytype
         * @classdesc Represents an Event.
         * @implements IEvent
         * @constructor
         * @param {anytype.IEvent=} [properties] Properties to set
         */
        function Event(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Event blockCreate.
         * @member {anytype.IBlockCreate|null|undefined} blockCreate
         * @memberof anytype.Event
         * @instance
         */
        Event.prototype.blockCreate = null;

        /**
         * Event blockUpdate.
         * @member {anytype.IBlockUpdate|null|undefined} blockUpdate
         * @memberof anytype.Event
         * @instance
         */
        Event.prototype.blockUpdate = null;

        /**
         * Event blockRemove.
         * @member {anytype.IBlockRemove|null|undefined} blockRemove
         * @memberof anytype.Event
         * @instance
         */
        Event.prototype.blockRemove = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * Event message.
         * @member {"blockCreate"|"blockUpdate"|"blockRemove"|undefined} message
         * @memberof anytype.Event
         * @instance
         */
        Object.defineProperty(Event.prototype, "message", {
            get: $util.oneOfGetter($oneOfFields = ["blockCreate", "blockUpdate", "blockRemove"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Event instance using the specified properties.
         * @function create
         * @memberof anytype.Event
         * @static
         * @param {anytype.IEvent=} [properties] Properties to set
         * @returns {anytype.Event} Event instance
         */
        Event.create = function create(properties) {
            return new Event(properties);
        };

        /**
         * Encodes the specified Event message. Does not implicitly {@link anytype.Event.verify|verify} messages.
         * @function encode
         * @memberof anytype.Event
         * @static
         * @param {anytype.IEvent} message Event message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Event.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.blockCreate != null && message.hasOwnProperty("blockCreate"))
                $root.anytype.BlockCreate.encode(message.blockCreate, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.blockUpdate != null && message.hasOwnProperty("blockUpdate"))
                $root.anytype.BlockUpdate.encode(message.blockUpdate, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.blockRemove != null && message.hasOwnProperty("blockRemove"))
                $root.anytype.BlockRemove.encode(message.blockRemove, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Event message, length delimited. Does not implicitly {@link anytype.Event.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Event
         * @static
         * @param {anytype.IEvent} message Event message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Event.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Event message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Event
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Event} Event
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Event.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Event();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.blockCreate = $root.anytype.BlockCreate.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.blockUpdate = $root.anytype.BlockUpdate.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.blockRemove = $root.anytype.BlockRemove.decode(reader, reader.uint32());
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
         * @memberof anytype.Event
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Event} Event
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
         * @memberof anytype.Event
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Event.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            var properties = {};
            if (message.blockCreate != null && message.hasOwnProperty("blockCreate")) {
                properties.message = 1;
                {
                    var error = $root.anytype.BlockCreate.verify(message.blockCreate);
                    if (error)
                        return "blockCreate." + error;
                }
            }
            if (message.blockUpdate != null && message.hasOwnProperty("blockUpdate")) {
                if (properties.message === 1)
                    return "message: multiple values";
                properties.message = 1;
                {
                    var error = $root.anytype.BlockUpdate.verify(message.blockUpdate);
                    if (error)
                        return "blockUpdate." + error;
                }
            }
            if (message.blockRemove != null && message.hasOwnProperty("blockRemove")) {
                if (properties.message === 1)
                    return "message: multiple values";
                properties.message = 1;
                {
                    var error = $root.anytype.BlockRemove.verify(message.blockRemove);
                    if (error)
                        return "blockRemove." + error;
                }
            }
            return null;
        };

        /**
         * Creates an Event message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Event
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Event} Event
         */
        Event.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Event)
                return object;
            var message = new $root.anytype.Event();
            if (object.blockCreate != null) {
                if (typeof object.blockCreate !== "object")
                    throw TypeError(".anytype.Event.blockCreate: object expected");
                message.blockCreate = $root.anytype.BlockCreate.fromObject(object.blockCreate);
            }
            if (object.blockUpdate != null) {
                if (typeof object.blockUpdate !== "object")
                    throw TypeError(".anytype.Event.blockUpdate: object expected");
                message.blockUpdate = $root.anytype.BlockUpdate.fromObject(object.blockUpdate);
            }
            if (object.blockRemove != null) {
                if (typeof object.blockRemove !== "object")
                    throw TypeError(".anytype.Event.blockRemove: object expected");
                message.blockRemove = $root.anytype.BlockRemove.fromObject(object.blockRemove);
            }
            return message;
        };

        /**
         * Creates a plain object from an Event message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Event
         * @static
         * @param {anytype.Event} message Event
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Event.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (message.blockCreate != null && message.hasOwnProperty("blockCreate")) {
                object.blockCreate = $root.anytype.BlockCreate.toObject(message.blockCreate, options);
                if (options.oneofs)
                    object.message = "blockCreate";
            }
            if (message.blockUpdate != null && message.hasOwnProperty("blockUpdate")) {
                object.blockUpdate = $root.anytype.BlockUpdate.toObject(message.blockUpdate, options);
                if (options.oneofs)
                    object.message = "blockUpdate";
            }
            if (message.blockRemove != null && message.hasOwnProperty("blockRemove")) {
                object.blockRemove = $root.anytype.BlockRemove.toObject(message.blockRemove, options);
                if (options.oneofs)
                    object.message = "blockRemove";
            }
            return object;
        };

        /**
         * Converts this Event to JSON.
         * @function toJSON
         * @memberof anytype.Event
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Event.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Event;
    })();

    anytype.BlockCreate = (function() {

        /**
         * Properties of a BlockCreate.
         * @memberof anytype
         * @interface IBlockCreate
         * @property {string|null} [id] BlockCreate id
         * @property {string|null} [docId] BlockCreate docId
         * @property {number|null} [pos] BlockCreate pos
         */

        /**
         * Constructs a new BlockCreate.
         * @memberof anytype
         * @classdesc Represents a BlockCreate.
         * @implements IBlockCreate
         * @constructor
         * @param {anytype.IBlockCreate=} [properties] Properties to set
         */
        function BlockCreate(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BlockCreate id.
         * @member {string} id
         * @memberof anytype.BlockCreate
         * @instance
         */
        BlockCreate.prototype.id = "";

        /**
         * BlockCreate docId.
         * @member {string} docId
         * @memberof anytype.BlockCreate
         * @instance
         */
        BlockCreate.prototype.docId = "";

        /**
         * BlockCreate pos.
         * @member {number} pos
         * @memberof anytype.BlockCreate
         * @instance
         */
        BlockCreate.prototype.pos = 0;

        /**
         * Creates a new BlockCreate instance using the specified properties.
         * @function create
         * @memberof anytype.BlockCreate
         * @static
         * @param {anytype.IBlockCreate=} [properties] Properties to set
         * @returns {anytype.BlockCreate} BlockCreate instance
         */
        BlockCreate.create = function create(properties) {
            return new BlockCreate(properties);
        };

        /**
         * Encodes the specified BlockCreate message. Does not implicitly {@link anytype.BlockCreate.verify|verify} messages.
         * @function encode
         * @memberof anytype.BlockCreate
         * @static
         * @param {anytype.IBlockCreate} message BlockCreate message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BlockCreate.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.docId != null && message.hasOwnProperty("docId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.docId);
            if (message.pos != null && message.hasOwnProperty("pos"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.pos);
            return writer;
        };

        /**
         * Encodes the specified BlockCreate message, length delimited. Does not implicitly {@link anytype.BlockCreate.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.BlockCreate
         * @static
         * @param {anytype.IBlockCreate} message BlockCreate message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BlockCreate.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BlockCreate message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.BlockCreate
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.BlockCreate} BlockCreate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BlockCreate.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.BlockCreate();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.docId = reader.string();
                    break;
                case 3:
                    message.pos = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BlockCreate message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.BlockCreate
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.BlockCreate} BlockCreate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BlockCreate.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BlockCreate message.
         * @function verify
         * @memberof anytype.BlockCreate
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BlockCreate.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.docId != null && message.hasOwnProperty("docId"))
                if (!$util.isString(message.docId))
                    return "docId: string expected";
            if (message.pos != null && message.hasOwnProperty("pos"))
                if (!$util.isInteger(message.pos))
                    return "pos: integer expected";
            return null;
        };

        /**
         * Creates a BlockCreate message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.BlockCreate
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.BlockCreate} BlockCreate
         */
        BlockCreate.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.BlockCreate)
                return object;
            var message = new $root.anytype.BlockCreate();
            if (object.id != null)
                message.id = String(object.id);
            if (object.docId != null)
                message.docId = String(object.docId);
            if (object.pos != null)
                message.pos = object.pos >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a BlockCreate message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.BlockCreate
         * @static
         * @param {anytype.BlockCreate} message BlockCreate
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BlockCreate.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = "";
                object.docId = "";
                object.pos = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.docId != null && message.hasOwnProperty("docId"))
                object.docId = message.docId;
            if (message.pos != null && message.hasOwnProperty("pos"))
                object.pos = message.pos;
            return object;
        };

        /**
         * Converts this BlockCreate to JSON.
         * @function toJSON
         * @memberof anytype.BlockCreate
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BlockCreate.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BlockCreate;
    })();

    anytype.BlockUpdate = (function() {

        /**
         * Properties of a BlockUpdate.
         * @memberof anytype
         * @interface IBlockUpdate
         * @property {string|null} [id] BlockUpdate id
         * @property {string|null} [docId] BlockUpdate docId
         */

        /**
         * Constructs a new BlockUpdate.
         * @memberof anytype
         * @classdesc Represents a BlockUpdate.
         * @implements IBlockUpdate
         * @constructor
         * @param {anytype.IBlockUpdate=} [properties] Properties to set
         */
        function BlockUpdate(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BlockUpdate id.
         * @member {string} id
         * @memberof anytype.BlockUpdate
         * @instance
         */
        BlockUpdate.prototype.id = "";

        /**
         * BlockUpdate docId.
         * @member {string} docId
         * @memberof anytype.BlockUpdate
         * @instance
         */
        BlockUpdate.prototype.docId = "";

        /**
         * Creates a new BlockUpdate instance using the specified properties.
         * @function create
         * @memberof anytype.BlockUpdate
         * @static
         * @param {anytype.IBlockUpdate=} [properties] Properties to set
         * @returns {anytype.BlockUpdate} BlockUpdate instance
         */
        BlockUpdate.create = function create(properties) {
            return new BlockUpdate(properties);
        };

        /**
         * Encodes the specified BlockUpdate message. Does not implicitly {@link anytype.BlockUpdate.verify|verify} messages.
         * @function encode
         * @memberof anytype.BlockUpdate
         * @static
         * @param {anytype.IBlockUpdate} message BlockUpdate message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BlockUpdate.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.docId != null && message.hasOwnProperty("docId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.docId);
            return writer;
        };

        /**
         * Encodes the specified BlockUpdate message, length delimited. Does not implicitly {@link anytype.BlockUpdate.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.BlockUpdate
         * @static
         * @param {anytype.IBlockUpdate} message BlockUpdate message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BlockUpdate.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BlockUpdate message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.BlockUpdate
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.BlockUpdate} BlockUpdate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BlockUpdate.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.BlockUpdate();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.docId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BlockUpdate message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.BlockUpdate
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.BlockUpdate} BlockUpdate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BlockUpdate.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BlockUpdate message.
         * @function verify
         * @memberof anytype.BlockUpdate
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BlockUpdate.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.docId != null && message.hasOwnProperty("docId"))
                if (!$util.isString(message.docId))
                    return "docId: string expected";
            return null;
        };

        /**
         * Creates a BlockUpdate message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.BlockUpdate
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.BlockUpdate} BlockUpdate
         */
        BlockUpdate.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.BlockUpdate)
                return object;
            var message = new $root.anytype.BlockUpdate();
            if (object.id != null)
                message.id = String(object.id);
            if (object.docId != null)
                message.docId = String(object.docId);
            return message;
        };

        /**
         * Creates a plain object from a BlockUpdate message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.BlockUpdate
         * @static
         * @param {anytype.BlockUpdate} message BlockUpdate
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BlockUpdate.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = "";
                object.docId = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.docId != null && message.hasOwnProperty("docId"))
                object.docId = message.docId;
            return object;
        };

        /**
         * Converts this BlockUpdate to JSON.
         * @function toJSON
         * @memberof anytype.BlockUpdate
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BlockUpdate.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BlockUpdate;
    })();

    anytype.BlockRemove = (function() {

        /**
         * Properties of a BlockRemove.
         * @memberof anytype
         * @interface IBlockRemove
         * @property {string|null} [id] BlockRemove id
         * @property {string|null} [docId] BlockRemove docId
         */

        /**
         * Constructs a new BlockRemove.
         * @memberof anytype
         * @classdesc Represents a BlockRemove.
         * @implements IBlockRemove
         * @constructor
         * @param {anytype.IBlockRemove=} [properties] Properties to set
         */
        function BlockRemove(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BlockRemove id.
         * @member {string} id
         * @memberof anytype.BlockRemove
         * @instance
         */
        BlockRemove.prototype.id = "";

        /**
         * BlockRemove docId.
         * @member {string} docId
         * @memberof anytype.BlockRemove
         * @instance
         */
        BlockRemove.prototype.docId = "";

        /**
         * Creates a new BlockRemove instance using the specified properties.
         * @function create
         * @memberof anytype.BlockRemove
         * @static
         * @param {anytype.IBlockRemove=} [properties] Properties to set
         * @returns {anytype.BlockRemove} BlockRemove instance
         */
        BlockRemove.create = function create(properties) {
            return new BlockRemove(properties);
        };

        /**
         * Encodes the specified BlockRemove message. Does not implicitly {@link anytype.BlockRemove.verify|verify} messages.
         * @function encode
         * @memberof anytype.BlockRemove
         * @static
         * @param {anytype.IBlockRemove} message BlockRemove message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BlockRemove.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.docId != null && message.hasOwnProperty("docId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.docId);
            return writer;
        };

        /**
         * Encodes the specified BlockRemove message, length delimited. Does not implicitly {@link anytype.BlockRemove.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.BlockRemove
         * @static
         * @param {anytype.IBlockRemove} message BlockRemove message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BlockRemove.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BlockRemove message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.BlockRemove
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.BlockRemove} BlockRemove
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BlockRemove.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.BlockRemove();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.docId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BlockRemove message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.BlockRemove
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.BlockRemove} BlockRemove
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BlockRemove.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BlockRemove message.
         * @function verify
         * @memberof anytype.BlockRemove
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BlockRemove.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.docId != null && message.hasOwnProperty("docId"))
                if (!$util.isString(message.docId))
                    return "docId: string expected";
            return null;
        };

        /**
         * Creates a BlockRemove message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.BlockRemove
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.BlockRemove} BlockRemove
         */
        BlockRemove.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.BlockRemove)
                return object;
            var message = new $root.anytype.BlockRemove();
            if (object.id != null)
                message.id = String(object.id);
            if (object.docId != null)
                message.docId = String(object.docId);
            return message;
        };

        /**
         * Creates a plain object from a BlockRemove message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.BlockRemove
         * @static
         * @param {anytype.BlockRemove} message BlockRemove
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BlockRemove.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = "";
                object.docId = "";
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.docId != null && message.hasOwnProperty("docId"))
                object.docId = message.docId;
            return object;
        };

        /**
         * Converts this BlockRemove to JSON.
         * @function toJSON
         * @memberof anytype.BlockRemove
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BlockRemove.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BlockRemove;
    })();

    return anytype;
})();

module.exports = $root;
