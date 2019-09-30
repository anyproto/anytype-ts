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
         * @param {anytype.WalletCreateResponse} [response] WalletCreateResponse
         */

        /**
         * Calls WalletCreate.
         * @function walletCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletCreateRequest} request WalletCreateRequest message or plain object
         * @param {anytype.ClientCommands.WalletCreateCallback} callback Node-style callback called with the error, if any, and WalletCreateResponse
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.walletCreate = function walletCreate(request, callback) {
            return this.rpcCall(walletCreate, $root.anytype.WalletCreateRequest, $root.anytype.WalletCreateResponse, request, callback);
        }, "name", { value: "WalletCreate" });

        /**
         * Calls WalletCreate.
         * @function walletCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletCreateRequest} request WalletCreateRequest message or plain object
         * @returns {Promise<anytype.WalletCreateResponse>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link anytype.ClientCommands#walletRecover}.
         * @memberof anytype.ClientCommands
         * @typedef WalletRecoverCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.WalletRecoverResponse} [response] WalletRecoverResponse
         */

        /**
         * Calls WalletRecover.
         * @function walletRecover
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletRecoverRequest} request WalletRecoverRequest message or plain object
         * @param {anytype.ClientCommands.WalletRecoverCallback} callback Node-style callback called with the error, if any, and WalletRecoverResponse
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.walletRecover = function walletRecover(request, callback) {
            return this.rpcCall(walletRecover, $root.anytype.WalletRecoverRequest, $root.anytype.WalletRecoverResponse, request, callback);
        }, "name", { value: "WalletRecover" });

        /**
         * Calls WalletRecover.
         * @function walletRecover
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IWalletRecoverRequest} request WalletRecoverRequest message or plain object
         * @returns {Promise<anytype.WalletRecoverResponse>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link anytype.ClientCommands#accountCreate}.
         * @memberof anytype.ClientCommands
         * @typedef AccountCreateCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.AccountCreateResponse} [response] AccountCreateResponse
         */

        /**
         * Calls AccountCreate.
         * @function accountCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountCreateRequest} request AccountCreateRequest message or plain object
         * @param {anytype.ClientCommands.AccountCreateCallback} callback Node-style callback called with the error, if any, and AccountCreateResponse
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.accountCreate = function accountCreate(request, callback) {
            return this.rpcCall(accountCreate, $root.anytype.AccountCreateRequest, $root.anytype.AccountCreateResponse, request, callback);
        }, "name", { value: "AccountCreate" });

        /**
         * Calls AccountCreate.
         * @function accountCreate
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountCreateRequest} request AccountCreateRequest message or plain object
         * @returns {Promise<anytype.AccountCreateResponse>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link anytype.ClientCommands#accountSelect}.
         * @memberof anytype.ClientCommands
         * @typedef AccountSelectCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.AccountSelectResponse} [response] AccountSelectResponse
         */

        /**
         * Calls AccountSelect.
         * @function accountSelect
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountSelectRequest} request AccountSelectRequest message or plain object
         * @param {anytype.ClientCommands.AccountSelectCallback} callback Node-style callback called with the error, if any, and AccountSelectResponse
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.accountSelect = function accountSelect(request, callback) {
            return this.rpcCall(accountSelect, $root.anytype.AccountSelectRequest, $root.anytype.AccountSelectResponse, request, callback);
        }, "name", { value: "AccountSelect" });

        /**
         * Calls AccountSelect.
         * @function accountSelect
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IAccountSelectRequest} request AccountSelectRequest message or plain object
         * @returns {Promise<anytype.AccountSelectResponse>} Promise
         * @variation 2
         */

        /**
         * Callback as used by {@link anytype.ClientCommands#imageGetBlob}.
         * @memberof anytype.ClientCommands
         * @typedef ImageGetBlobCallback
         * @type {function}
         * @param {Error|null} error Error, if any
         * @param {anytype.ImageGetBlobResponse} [response] ImageGetBlobResponse
         */

        /**
         * Calls ImageGetBlob.
         * @function imageGetBlob
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IImageGetBlobRequest} request ImageGetBlobRequest message or plain object
         * @param {anytype.ClientCommands.ImageGetBlobCallback} callback Node-style callback called with the error, if any, and ImageGetBlobResponse
         * @returns {undefined}
         * @variation 1
         */
        Object.defineProperty(ClientCommands.prototype.imageGetBlob = function imageGetBlob(request, callback) {
            return this.rpcCall(imageGetBlob, $root.anytype.ImageGetBlobRequest, $root.anytype.ImageGetBlobResponse, request, callback);
        }, "name", { value: "ImageGetBlob" });

        /**
         * Calls ImageGetBlob.
         * @function imageGetBlob
         * @memberof anytype.ClientCommands
         * @instance
         * @param {anytype.IImageGetBlobRequest} request ImageGetBlobRequest message or plain object
         * @returns {Promise<anytype.ImageGetBlobResponse>} Promise
         * @variation 2
         */

        return ClientCommands;
    })();

    anytype.WalletCreateRequest = (function() {

        /**
         * Properties of a WalletCreateRequest.
         * @memberof anytype
         * @interface IWalletCreateRequest
         * @property {string|null} [rootPath] WalletCreateRequest rootPath
         */

        /**
         * Constructs a new WalletCreateRequest.
         * @memberof anytype
         * @classdesc Represents a WalletCreateRequest.
         * @implements IWalletCreateRequest
         * @constructor
         * @param {anytype.IWalletCreateRequest=} [properties] Properties to set
         */
        function WalletCreateRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletCreateRequest rootPath.
         * @member {string} rootPath
         * @memberof anytype.WalletCreateRequest
         * @instance
         */
        WalletCreateRequest.prototype.rootPath = "";

        /**
         * Creates a new WalletCreateRequest instance using the specified properties.
         * @function create
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {anytype.IWalletCreateRequest=} [properties] Properties to set
         * @returns {anytype.WalletCreateRequest} WalletCreateRequest instance
         */
        WalletCreateRequest.create = function create(properties) {
            return new WalletCreateRequest(properties);
        };

        /**
         * Encodes the specified WalletCreateRequest message. Does not implicitly {@link anytype.WalletCreateRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {anytype.IWalletCreateRequest} message WalletCreateRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.rootPath != null && message.hasOwnProperty("rootPath"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.rootPath);
            return writer;
        };

        /**
         * Encodes the specified WalletCreateRequest message, length delimited. Does not implicitly {@link anytype.WalletCreateRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {anytype.IWalletCreateRequest} message WalletCreateRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletCreateRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletCreateRequest} WalletCreateRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletCreateRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.rootPath = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletCreateRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletCreateRequest} WalletCreateRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletCreateRequest message.
         * @function verify
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletCreateRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.rootPath != null && message.hasOwnProperty("rootPath"))
                if (!$util.isString(message.rootPath))
                    return "rootPath: string expected";
            return null;
        };

        /**
         * Creates a WalletCreateRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletCreateRequest} WalletCreateRequest
         */
        WalletCreateRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletCreateRequest)
                return object;
            var message = new $root.anytype.WalletCreateRequest();
            if (object.rootPath != null)
                message.rootPath = String(object.rootPath);
            return message;
        };

        /**
         * Creates a plain object from a WalletCreateRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletCreateRequest
         * @static
         * @param {anytype.WalletCreateRequest} message WalletCreateRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletCreateRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.rootPath = "";
            if (message.rootPath != null && message.hasOwnProperty("rootPath"))
                object.rootPath = message.rootPath;
            return object;
        };

        /**
         * Converts this WalletCreateRequest to JSON.
         * @function toJSON
         * @memberof anytype.WalletCreateRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletCreateRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WalletCreateRequest;
    })();

    anytype.WalletCreateResponse = (function() {

        /**
         * Properties of a WalletCreateResponse.
         * @memberof anytype
         * @interface IWalletCreateResponse
         * @property {anytype.WalletCreateResponse.IError|null} [error] WalletCreateResponse error
         * @property {string|null} [mnemonic] WalletCreateResponse mnemonic
         */

        /**
         * Constructs a new WalletCreateResponse.
         * @memberof anytype
         * @classdesc Represents a WalletCreateResponse.
         * @implements IWalletCreateResponse
         * @constructor
         * @param {anytype.IWalletCreateResponse=} [properties] Properties to set
         */
        function WalletCreateResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletCreateResponse error.
         * @member {anytype.WalletCreateResponse.IError|null|undefined} error
         * @memberof anytype.WalletCreateResponse
         * @instance
         */
        WalletCreateResponse.prototype.error = null;

        /**
         * WalletCreateResponse mnemonic.
         * @member {string} mnemonic
         * @memberof anytype.WalletCreateResponse
         * @instance
         */
        WalletCreateResponse.prototype.mnemonic = "";

        /**
         * Creates a new WalletCreateResponse instance using the specified properties.
         * @function create
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {anytype.IWalletCreateResponse=} [properties] Properties to set
         * @returns {anytype.WalletCreateResponse} WalletCreateResponse instance
         */
        WalletCreateResponse.create = function create(properties) {
            return new WalletCreateResponse(properties);
        };

        /**
         * Encodes the specified WalletCreateResponse message. Does not implicitly {@link anytype.WalletCreateResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {anytype.IWalletCreateResponse} message WalletCreateResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.WalletCreateResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.mnemonic != null && message.hasOwnProperty("mnemonic"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.mnemonic);
            return writer;
        };

        /**
         * Encodes the specified WalletCreateResponse message, length delimited. Does not implicitly {@link anytype.WalletCreateResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {anytype.IWalletCreateResponse} message WalletCreateResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletCreateResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletCreateResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletCreateResponse} WalletCreateResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletCreateResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.WalletCreateResponse.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.mnemonic = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletCreateResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletCreateResponse} WalletCreateResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletCreateResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletCreateResponse message.
         * @function verify
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletCreateResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.WalletCreateResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.mnemonic != null && message.hasOwnProperty("mnemonic"))
                if (!$util.isString(message.mnemonic))
                    return "mnemonic: string expected";
            return null;
        };

        /**
         * Creates a WalletCreateResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletCreateResponse} WalletCreateResponse
         */
        WalletCreateResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletCreateResponse)
                return object;
            var message = new $root.anytype.WalletCreateResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.WalletCreateResponse.error: object expected");
                message.error = $root.anytype.WalletCreateResponse.Error.fromObject(object.error);
            }
            if (object.mnemonic != null)
                message.mnemonic = String(object.mnemonic);
            return message;
        };

        /**
         * Creates a plain object from a WalletCreateResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletCreateResponse
         * @static
         * @param {anytype.WalletCreateResponse} message WalletCreateResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletCreateResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                object.mnemonic = "";
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.WalletCreateResponse.Error.toObject(message.error, options);
            if (message.mnemonic != null && message.hasOwnProperty("mnemonic"))
                object.mnemonic = message.mnemonic;
            return object;
        };

        /**
         * Converts this WalletCreateResponse to JSON.
         * @function toJSON
         * @memberof anytype.WalletCreateResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletCreateResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        WalletCreateResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.WalletCreateResponse
             * @interface IError
             * @property {anytype.WalletCreateResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.WalletCreateResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.WalletCreateResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.WalletCreateResponse.Error.Code} code
             * @memberof anytype.WalletCreateResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.WalletCreateResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.WalletCreateResponse.Error
             * @static
             * @param {anytype.WalletCreateResponse.IError=} [properties] Properties to set
             * @returns {anytype.WalletCreateResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.WalletCreateResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.WalletCreateResponse.Error
             * @static
             * @param {anytype.WalletCreateResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.WalletCreateResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.WalletCreateResponse.Error
             * @static
             * @param {anytype.WalletCreateResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.WalletCreateResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.WalletCreateResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletCreateResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.WalletCreateResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.WalletCreateResponse.Error} Error
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
             * @memberof anytype.WalletCreateResponse.Error
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
                    case 101:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.WalletCreateResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.WalletCreateResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.WalletCreateResponse.Error)
                    return object;
                var message = new $root.anytype.WalletCreateResponse.Error();
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
                case "FAILED_TO_CREATE_LOCAL_REPO":
                case 101:
                    message.code = 101;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.WalletCreateResponse.Error
             * @static
             * @param {anytype.WalletCreateResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.WalletCreateResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.WalletCreateResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.WalletCreateResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} FAILED_TO_CREATE_LOCAL_REPO=101 FAILED_TO_CREATE_LOCAL_REPO value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "FAILED_TO_CREATE_LOCAL_REPO"] = 101;
                return values;
            })();

            return Error;
        })();

        return WalletCreateResponse;
    })();

    anytype.WalletRecoverRequest = (function() {

        /**
         * Properties of a WalletRecoverRequest.
         * @memberof anytype
         * @interface IWalletRecoverRequest
         * @property {string|null} [rootPath] WalletRecoverRequest rootPath
         * @property {string|null} [mnemonic] WalletRecoverRequest mnemonic
         */

        /**
         * Constructs a new WalletRecoverRequest.
         * @memberof anytype
         * @classdesc Represents a WalletRecoverRequest.
         * @implements IWalletRecoverRequest
         * @constructor
         * @param {anytype.IWalletRecoverRequest=} [properties] Properties to set
         */
        function WalletRecoverRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletRecoverRequest rootPath.
         * @member {string} rootPath
         * @memberof anytype.WalletRecoverRequest
         * @instance
         */
        WalletRecoverRequest.prototype.rootPath = "";

        /**
         * WalletRecoverRequest mnemonic.
         * @member {string} mnemonic
         * @memberof anytype.WalletRecoverRequest
         * @instance
         */
        WalletRecoverRequest.prototype.mnemonic = "";

        /**
         * Creates a new WalletRecoverRequest instance using the specified properties.
         * @function create
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {anytype.IWalletRecoverRequest=} [properties] Properties to set
         * @returns {anytype.WalletRecoverRequest} WalletRecoverRequest instance
         */
        WalletRecoverRequest.create = function create(properties) {
            return new WalletRecoverRequest(properties);
        };

        /**
         * Encodes the specified WalletRecoverRequest message. Does not implicitly {@link anytype.WalletRecoverRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {anytype.IWalletRecoverRequest} message WalletRecoverRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletRecoverRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.rootPath != null && message.hasOwnProperty("rootPath"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.rootPath);
            if (message.mnemonic != null && message.hasOwnProperty("mnemonic"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.mnemonic);
            return writer;
        };

        /**
         * Encodes the specified WalletRecoverRequest message, length delimited. Does not implicitly {@link anytype.WalletRecoverRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {anytype.IWalletRecoverRequest} message WalletRecoverRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletRecoverRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletRecoverRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletRecoverRequest} WalletRecoverRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletRecoverRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletRecoverRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.rootPath = reader.string();
                    break;
                case 2:
                    message.mnemonic = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletRecoverRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletRecoverRequest} WalletRecoverRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletRecoverRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletRecoverRequest message.
         * @function verify
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletRecoverRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.rootPath != null && message.hasOwnProperty("rootPath"))
                if (!$util.isString(message.rootPath))
                    return "rootPath: string expected";
            if (message.mnemonic != null && message.hasOwnProperty("mnemonic"))
                if (!$util.isString(message.mnemonic))
                    return "mnemonic: string expected";
            return null;
        };

        /**
         * Creates a WalletRecoverRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletRecoverRequest} WalletRecoverRequest
         */
        WalletRecoverRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletRecoverRequest)
                return object;
            var message = new $root.anytype.WalletRecoverRequest();
            if (object.rootPath != null)
                message.rootPath = String(object.rootPath);
            if (object.mnemonic != null)
                message.mnemonic = String(object.mnemonic);
            return message;
        };

        /**
         * Creates a plain object from a WalletRecoverRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletRecoverRequest
         * @static
         * @param {anytype.WalletRecoverRequest} message WalletRecoverRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletRecoverRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.rootPath = "";
                object.mnemonic = "";
            }
            if (message.rootPath != null && message.hasOwnProperty("rootPath"))
                object.rootPath = message.rootPath;
            if (message.mnemonic != null && message.hasOwnProperty("mnemonic"))
                object.mnemonic = message.mnemonic;
            return object;
        };

        /**
         * Converts this WalletRecoverRequest to JSON.
         * @function toJSON
         * @memberof anytype.WalletRecoverRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletRecoverRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return WalletRecoverRequest;
    })();

    anytype.WalletRecoverResponse = (function() {

        /**
         * Properties of a WalletRecoverResponse.
         * @memberof anytype
         * @interface IWalletRecoverResponse
         * @property {anytype.WalletRecoverResponse.IError|null} [error] WalletRecoverResponse error
         */

        /**
         * Constructs a new WalletRecoverResponse.
         * @memberof anytype
         * @classdesc Represents a WalletRecoverResponse.
         * @implements IWalletRecoverResponse
         * @constructor
         * @param {anytype.IWalletRecoverResponse=} [properties] Properties to set
         */
        function WalletRecoverResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WalletRecoverResponse error.
         * @member {anytype.WalletRecoverResponse.IError|null|undefined} error
         * @memberof anytype.WalletRecoverResponse
         * @instance
         */
        WalletRecoverResponse.prototype.error = null;

        /**
         * Creates a new WalletRecoverResponse instance using the specified properties.
         * @function create
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {anytype.IWalletRecoverResponse=} [properties] Properties to set
         * @returns {anytype.WalletRecoverResponse} WalletRecoverResponse instance
         */
        WalletRecoverResponse.create = function create(properties) {
            return new WalletRecoverResponse(properties);
        };

        /**
         * Encodes the specified WalletRecoverResponse message. Does not implicitly {@link anytype.WalletRecoverResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {anytype.IWalletRecoverResponse} message WalletRecoverResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletRecoverResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.WalletRecoverResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified WalletRecoverResponse message, length delimited. Does not implicitly {@link anytype.WalletRecoverResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {anytype.IWalletRecoverResponse} message WalletRecoverResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WalletRecoverResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WalletRecoverResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.WalletRecoverResponse} WalletRecoverResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletRecoverResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletRecoverResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.WalletRecoverResponse.Error.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WalletRecoverResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.WalletRecoverResponse} WalletRecoverResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WalletRecoverResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WalletRecoverResponse message.
         * @function verify
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WalletRecoverResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.WalletRecoverResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            return null;
        };

        /**
         * Creates a WalletRecoverResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.WalletRecoverResponse} WalletRecoverResponse
         */
        WalletRecoverResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.WalletRecoverResponse)
                return object;
            var message = new $root.anytype.WalletRecoverResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.WalletRecoverResponse.error: object expected");
                message.error = $root.anytype.WalletRecoverResponse.Error.fromObject(object.error);
            }
            return message;
        };

        /**
         * Creates a plain object from a WalletRecoverResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.WalletRecoverResponse
         * @static
         * @param {anytype.WalletRecoverResponse} message WalletRecoverResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WalletRecoverResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.error = null;
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.WalletRecoverResponse.Error.toObject(message.error, options);
            return object;
        };

        /**
         * Converts this WalletRecoverResponse to JSON.
         * @function toJSON
         * @memberof anytype.WalletRecoverResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WalletRecoverResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        WalletRecoverResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.WalletRecoverResponse
             * @interface IError
             * @property {anytype.WalletRecoverResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.WalletRecoverResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.WalletRecoverResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.WalletRecoverResponse.Error.Code} code
             * @memberof anytype.WalletRecoverResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.WalletRecoverResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.WalletRecoverResponse.Error
             * @static
             * @param {anytype.WalletRecoverResponse.IError=} [properties] Properties to set
             * @returns {anytype.WalletRecoverResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.WalletRecoverResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.WalletRecoverResponse.Error
             * @static
             * @param {anytype.WalletRecoverResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.WalletRecoverResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.WalletRecoverResponse.Error
             * @static
             * @param {anytype.WalletRecoverResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.WalletRecoverResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.WalletRecoverResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.WalletRecoverResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.WalletRecoverResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.WalletRecoverResponse.Error} Error
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
             * @memberof anytype.WalletRecoverResponse.Error
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
                    case 101:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.WalletRecoverResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.WalletRecoverResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.WalletRecoverResponse.Error)
                    return object;
                var message = new $root.anytype.WalletRecoverResponse.Error();
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
                case "FAILED_TO_CREATE_LOCAL_REPO":
                case 101:
                    message.code = 101;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.WalletRecoverResponse.Error
             * @static
             * @param {anytype.WalletRecoverResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.WalletRecoverResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.WalletRecoverResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.WalletRecoverResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} FAILED_TO_CREATE_LOCAL_REPO=101 FAILED_TO_CREATE_LOCAL_REPO value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "FAILED_TO_CREATE_LOCAL_REPO"] = 101;
                return values;
            })();

            return Error;
        })();

        return WalletRecoverResponse;
    })();

    anytype.AccountCreateRequest = (function() {

        /**
         * Properties of an AccountCreateRequest.
         * @memberof anytype
         * @interface IAccountCreateRequest
         * @property {string|null} [username] AccountCreateRequest username
         * @property {string|null} [avatarLocalPath] AccountCreateRequest avatarLocalPath
         */

        /**
         * Constructs a new AccountCreateRequest.
         * @memberof anytype
         * @classdesc Represents an AccountCreateRequest.
         * @implements IAccountCreateRequest
         * @constructor
         * @param {anytype.IAccountCreateRequest=} [properties] Properties to set
         */
        function AccountCreateRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountCreateRequest username.
         * @member {string} username
         * @memberof anytype.AccountCreateRequest
         * @instance
         */
        AccountCreateRequest.prototype.username = "";

        /**
         * AccountCreateRequest avatarLocalPath.
         * @member {string} avatarLocalPath
         * @memberof anytype.AccountCreateRequest
         * @instance
         */
        AccountCreateRequest.prototype.avatarLocalPath = "";

        /**
         * Creates a new AccountCreateRequest instance using the specified properties.
         * @function create
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {anytype.IAccountCreateRequest=} [properties] Properties to set
         * @returns {anytype.AccountCreateRequest} AccountCreateRequest instance
         */
        AccountCreateRequest.create = function create(properties) {
            return new AccountCreateRequest(properties);
        };

        /**
         * Encodes the specified AccountCreateRequest message. Does not implicitly {@link anytype.AccountCreateRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {anytype.IAccountCreateRequest} message AccountCreateRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.username != null && message.hasOwnProperty("username"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.username);
            if (message.avatarLocalPath != null && message.hasOwnProperty("avatarLocalPath"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.avatarLocalPath);
            return writer;
        };

        /**
         * Encodes the specified AccountCreateRequest message, length delimited. Does not implicitly {@link anytype.AccountCreateRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {anytype.IAccountCreateRequest} message AccountCreateRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountCreateRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountCreateRequest} AccountCreateRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountCreateRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.username = reader.string();
                    break;
                case 2:
                    message.avatarLocalPath = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountCreateRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountCreateRequest} AccountCreateRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountCreateRequest message.
         * @function verify
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountCreateRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.username != null && message.hasOwnProperty("username"))
                if (!$util.isString(message.username))
                    return "username: string expected";
            if (message.avatarLocalPath != null && message.hasOwnProperty("avatarLocalPath"))
                if (!$util.isString(message.avatarLocalPath))
                    return "avatarLocalPath: string expected";
            return null;
        };

        /**
         * Creates an AccountCreateRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountCreateRequest} AccountCreateRequest
         */
        AccountCreateRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountCreateRequest)
                return object;
            var message = new $root.anytype.AccountCreateRequest();
            if (object.username != null)
                message.username = String(object.username);
            if (object.avatarLocalPath != null)
                message.avatarLocalPath = String(object.avatarLocalPath);
            return message;
        };

        /**
         * Creates a plain object from an AccountCreateRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountCreateRequest
         * @static
         * @param {anytype.AccountCreateRequest} message AccountCreateRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountCreateRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.username = "";
                object.avatarLocalPath = "";
            }
            if (message.username != null && message.hasOwnProperty("username"))
                object.username = message.username;
            if (message.avatarLocalPath != null && message.hasOwnProperty("avatarLocalPath"))
                object.avatarLocalPath = message.avatarLocalPath;
            return object;
        };

        /**
         * Converts this AccountCreateRequest to JSON.
         * @function toJSON
         * @memberof anytype.AccountCreateRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountCreateRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AccountCreateRequest;
    })();

    anytype.AccountCreateResponse = (function() {

        /**
         * Properties of an AccountCreateResponse.
         * @memberof anytype
         * @interface IAccountCreateResponse
         * @property {anytype.AccountCreateResponse.IError|null} [error] AccountCreateResponse error
         * @property {anytype.IAccount|null} [account] AccountCreateResponse account
         */

        /**
         * Constructs a new AccountCreateResponse.
         * @memberof anytype
         * @classdesc Represents an AccountCreateResponse.
         * @implements IAccountCreateResponse
         * @constructor
         * @param {anytype.IAccountCreateResponse=} [properties] Properties to set
         */
        function AccountCreateResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountCreateResponse error.
         * @member {anytype.AccountCreateResponse.IError|null|undefined} error
         * @memberof anytype.AccountCreateResponse
         * @instance
         */
        AccountCreateResponse.prototype.error = null;

        /**
         * AccountCreateResponse account.
         * @member {anytype.IAccount|null|undefined} account
         * @memberof anytype.AccountCreateResponse
         * @instance
         */
        AccountCreateResponse.prototype.account = null;

        /**
         * Creates a new AccountCreateResponse instance using the specified properties.
         * @function create
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {anytype.IAccountCreateResponse=} [properties] Properties to set
         * @returns {anytype.AccountCreateResponse} AccountCreateResponse instance
         */
        AccountCreateResponse.create = function create(properties) {
            return new AccountCreateResponse(properties);
        };

        /**
         * Encodes the specified AccountCreateResponse message. Does not implicitly {@link anytype.AccountCreateResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {anytype.IAccountCreateResponse} message AccountCreateResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.AccountCreateResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.account != null && message.hasOwnProperty("account"))
                $root.anytype.Account.encode(message.account, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AccountCreateResponse message, length delimited. Does not implicitly {@link anytype.AccountCreateResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {anytype.IAccountCreateResponse} message AccountCreateResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountCreateResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountCreateResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountCreateResponse} AccountCreateResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountCreateResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.AccountCreateResponse.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.account = $root.anytype.Account.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountCreateResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountCreateResponse} AccountCreateResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountCreateResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountCreateResponse message.
         * @function verify
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountCreateResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.AccountCreateResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.account != null && message.hasOwnProperty("account")) {
                var error = $root.anytype.Account.verify(message.account);
                if (error)
                    return "account." + error;
            }
            return null;
        };

        /**
         * Creates an AccountCreateResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountCreateResponse} AccountCreateResponse
         */
        AccountCreateResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountCreateResponse)
                return object;
            var message = new $root.anytype.AccountCreateResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.AccountCreateResponse.error: object expected");
                message.error = $root.anytype.AccountCreateResponse.Error.fromObject(object.error);
            }
            if (object.account != null) {
                if (typeof object.account !== "object")
                    throw TypeError(".anytype.AccountCreateResponse.account: object expected");
                message.account = $root.anytype.Account.fromObject(object.account);
            }
            return message;
        };

        /**
         * Creates a plain object from an AccountCreateResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountCreateResponse
         * @static
         * @param {anytype.AccountCreateResponse} message AccountCreateResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountCreateResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                object.account = null;
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.AccountCreateResponse.Error.toObject(message.error, options);
            if (message.account != null && message.hasOwnProperty("account"))
                object.account = $root.anytype.Account.toObject(message.account, options);
            return object;
        };

        /**
         * Converts this AccountCreateResponse to JSON.
         * @function toJSON
         * @memberof anytype.AccountCreateResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountCreateResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        AccountCreateResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.AccountCreateResponse
             * @interface IError
             * @property {anytype.AccountCreateResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.AccountCreateResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.AccountCreateResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.AccountCreateResponse.Error.Code} code
             * @memberof anytype.AccountCreateResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.AccountCreateResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.AccountCreateResponse.Error
             * @static
             * @param {anytype.AccountCreateResponse.IError=} [properties] Properties to set
             * @returns {anytype.AccountCreateResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountCreateResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.AccountCreateResponse.Error
             * @static
             * @param {anytype.AccountCreateResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountCreateResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.AccountCreateResponse.Error
             * @static
             * @param {anytype.AccountCreateResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.AccountCreateResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.AccountCreateResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountCreateResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.AccountCreateResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.AccountCreateResponse.Error} Error
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
             * @memberof anytype.AccountCreateResponse.Error
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
                    case 101:
                    case 102:
                    case 103:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.AccountCreateResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.AccountCreateResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.AccountCreateResponse.Error)
                    return object;
                var message = new $root.anytype.AccountCreateResponse.Error();
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
                case "ACCOUNT_CREATED_BUT_FAILED_TO_START_NODE":
                case 101:
                    message.code = 101;
                    break;
                case "ACCOUNT_CREATED_BUT_FAILED_TO_SET_NAME":
                case 102:
                    message.code = 102;
                    break;
                case "ACCOUNT_CREATED_BUT_FAILED_TO_SET_AVATAR":
                case 103:
                    message.code = 103;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.AccountCreateResponse.Error
             * @static
             * @param {anytype.AccountCreateResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.AccountCreateResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.AccountCreateResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.AccountCreateResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} ACCOUNT_CREATED_BUT_FAILED_TO_START_NODE=101 ACCOUNT_CREATED_BUT_FAILED_TO_START_NODE value
             * @property {number} ACCOUNT_CREATED_BUT_FAILED_TO_SET_NAME=102 ACCOUNT_CREATED_BUT_FAILED_TO_SET_NAME value
             * @property {number} ACCOUNT_CREATED_BUT_FAILED_TO_SET_AVATAR=103 ACCOUNT_CREATED_BUT_FAILED_TO_SET_AVATAR value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "ACCOUNT_CREATED_BUT_FAILED_TO_START_NODE"] = 101;
                values[valuesById[102] = "ACCOUNT_CREATED_BUT_FAILED_TO_SET_NAME"] = 102;
                values[valuesById[103] = "ACCOUNT_CREATED_BUT_FAILED_TO_SET_AVATAR"] = 103;
                return values;
            })();

            return Error;
        })();

        return AccountCreateResponse;
    })();

    anytype.AccountSelectRequest = (function() {

        /**
         * Properties of an AccountSelectRequest.
         * @memberof anytype
         * @interface IAccountSelectRequest
         * @property {string|null} [id] AccountSelectRequest id
         */

        /**
         * Constructs a new AccountSelectRequest.
         * @memberof anytype
         * @classdesc Represents an AccountSelectRequest.
         * @implements IAccountSelectRequest
         * @constructor
         * @param {anytype.IAccountSelectRequest=} [properties] Properties to set
         */
        function AccountSelectRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountSelectRequest id.
         * @member {string} id
         * @memberof anytype.AccountSelectRequest
         * @instance
         */
        AccountSelectRequest.prototype.id = "";

        /**
         * Creates a new AccountSelectRequest instance using the specified properties.
         * @function create
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {anytype.IAccountSelectRequest=} [properties] Properties to set
         * @returns {anytype.AccountSelectRequest} AccountSelectRequest instance
         */
        AccountSelectRequest.create = function create(properties) {
            return new AccountSelectRequest(properties);
        };

        /**
         * Encodes the specified AccountSelectRequest message. Does not implicitly {@link anytype.AccountSelectRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {anytype.IAccountSelectRequest} message AccountSelectRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            return writer;
        };

        /**
         * Encodes the specified AccountSelectRequest message, length delimited. Does not implicitly {@link anytype.AccountSelectRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {anytype.IAccountSelectRequest} message AccountSelectRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountSelectRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountSelectRequest} AccountSelectRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountSelectRequest();
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
         * Decodes an AccountSelectRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountSelectRequest} AccountSelectRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountSelectRequest message.
         * @function verify
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountSelectRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            return null;
        };

        /**
         * Creates an AccountSelectRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountSelectRequest} AccountSelectRequest
         */
        AccountSelectRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountSelectRequest)
                return object;
            var message = new $root.anytype.AccountSelectRequest();
            if (object.id != null)
                message.id = String(object.id);
            return message;
        };

        /**
         * Creates a plain object from an AccountSelectRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountSelectRequest
         * @static
         * @param {anytype.AccountSelectRequest} message AccountSelectRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountSelectRequest.toObject = function toObject(message, options) {
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
         * Converts this AccountSelectRequest to JSON.
         * @function toJSON
         * @memberof anytype.AccountSelectRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountSelectRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AccountSelectRequest;
    })();

    anytype.AccountSelectResponse = (function() {

        /**
         * Properties of an AccountSelectResponse.
         * @memberof anytype
         * @interface IAccountSelectResponse
         * @property {anytype.AccountSelectResponse.IError|null} [error] AccountSelectResponse error
         * @property {anytype.IAccount|null} [account] AccountSelectResponse account
         */

        /**
         * Constructs a new AccountSelectResponse.
         * @memberof anytype
         * @classdesc Represents an AccountSelectResponse.
         * @implements IAccountSelectResponse
         * @constructor
         * @param {anytype.IAccountSelectResponse=} [properties] Properties to set
         */
        function AccountSelectResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountSelectResponse error.
         * @member {anytype.AccountSelectResponse.IError|null|undefined} error
         * @memberof anytype.AccountSelectResponse
         * @instance
         */
        AccountSelectResponse.prototype.error = null;

        /**
         * AccountSelectResponse account.
         * @member {anytype.IAccount|null|undefined} account
         * @memberof anytype.AccountSelectResponse
         * @instance
         */
        AccountSelectResponse.prototype.account = null;

        /**
         * Creates a new AccountSelectResponse instance using the specified properties.
         * @function create
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {anytype.IAccountSelectResponse=} [properties] Properties to set
         * @returns {anytype.AccountSelectResponse} AccountSelectResponse instance
         */
        AccountSelectResponse.create = function create(properties) {
            return new AccountSelectResponse(properties);
        };

        /**
         * Encodes the specified AccountSelectResponse message. Does not implicitly {@link anytype.AccountSelectResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {anytype.IAccountSelectResponse} message AccountSelectResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.AccountSelectResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.account != null && message.hasOwnProperty("account"))
                $root.anytype.Account.encode(message.account, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AccountSelectResponse message, length delimited. Does not implicitly {@link anytype.AccountSelectResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {anytype.IAccountSelectResponse} message AccountSelectResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountSelectResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountSelectResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountSelectResponse} AccountSelectResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountSelectResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.AccountSelectResponse.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.account = $root.anytype.Account.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountSelectResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountSelectResponse} AccountSelectResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountSelectResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountSelectResponse message.
         * @function verify
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountSelectResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.AccountSelectResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.account != null && message.hasOwnProperty("account")) {
                var error = $root.anytype.Account.verify(message.account);
                if (error)
                    return "account." + error;
            }
            return null;
        };

        /**
         * Creates an AccountSelectResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountSelectResponse} AccountSelectResponse
         */
        AccountSelectResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountSelectResponse)
                return object;
            var message = new $root.anytype.AccountSelectResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.AccountSelectResponse.error: object expected");
                message.error = $root.anytype.AccountSelectResponse.Error.fromObject(object.error);
            }
            if (object.account != null) {
                if (typeof object.account !== "object")
                    throw TypeError(".anytype.AccountSelectResponse.account: object expected");
                message.account = $root.anytype.Account.fromObject(object.account);
            }
            return message;
        };

        /**
         * Creates a plain object from an AccountSelectResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountSelectResponse
         * @static
         * @param {anytype.AccountSelectResponse} message AccountSelectResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountSelectResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                object.account = null;
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.AccountSelectResponse.Error.toObject(message.error, options);
            if (message.account != null && message.hasOwnProperty("account"))
                object.account = $root.anytype.Account.toObject(message.account, options);
            return object;
        };

        /**
         * Converts this AccountSelectResponse to JSON.
         * @function toJSON
         * @memberof anytype.AccountSelectResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountSelectResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        AccountSelectResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.AccountSelectResponse
             * @interface IError
             * @property {anytype.AccountSelectResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.AccountSelectResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.AccountSelectResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.AccountSelectResponse.Error.Code} code
             * @memberof anytype.AccountSelectResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.AccountSelectResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.AccountSelectResponse.Error
             * @static
             * @param {anytype.AccountSelectResponse.IError=} [properties] Properties to set
             * @returns {anytype.AccountSelectResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountSelectResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.AccountSelectResponse.Error
             * @static
             * @param {anytype.AccountSelectResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountSelectResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.AccountSelectResponse.Error
             * @static
             * @param {anytype.AccountSelectResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.AccountSelectResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.AccountSelectResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountSelectResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.AccountSelectResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.AccountSelectResponse.Error} Error
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
             * @memberof anytype.AccountSelectResponse.Error
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
                    case 101:
                    case 102:
                    case 103:
                    case 104:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.AccountSelectResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.AccountSelectResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.AccountSelectResponse.Error)
                    return object;
                var message = new $root.anytype.AccountSelectResponse.Error();
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
                case "FAILED_TO_CREATE_LOCAL_REPO":
                case 101:
                    message.code = 101;
                    break;
                case "LOCAL_REPO_EXISTS_BUT_CORRUPTED":
                case 102:
                    message.code = 102;
                    break;
                case "FAILED_TO_RUN_NODE":
                case 103:
                    message.code = 103;
                    break;
                case "FAILED_TO_FIND_ACCOUNT_INFO":
                case 104:
                    message.code = 104;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.AccountSelectResponse.Error
             * @static
             * @param {anytype.AccountSelectResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.AccountSelectResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.AccountSelectResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.AccountSelectResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} FAILED_TO_CREATE_LOCAL_REPO=101 FAILED_TO_CREATE_LOCAL_REPO value
             * @property {number} LOCAL_REPO_EXISTS_BUT_CORRUPTED=102 LOCAL_REPO_EXISTS_BUT_CORRUPTED value
             * @property {number} FAILED_TO_RUN_NODE=103 FAILED_TO_RUN_NODE value
             * @property {number} FAILED_TO_FIND_ACCOUNT_INFO=104 FAILED_TO_FIND_ACCOUNT_INFO value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "FAILED_TO_CREATE_LOCAL_REPO"] = 101;
                values[valuesById[102] = "LOCAL_REPO_EXISTS_BUT_CORRUPTED"] = 102;
                values[valuesById[103] = "FAILED_TO_RUN_NODE"] = 103;
                values[valuesById[104] = "FAILED_TO_FIND_ACCOUNT_INFO"] = 104;
                return values;
            })();

            return Error;
        })();

        return AccountSelectResponse;
    })();

    anytype.AccountStartRequest = (function() {

        /**
         * Properties of an AccountStartRequest.
         * @memberof anytype
         * @interface IAccountStartRequest
         * @property {string|null} [id] AccountStartRequest id
         */

        /**
         * Constructs a new AccountStartRequest.
         * @memberof anytype
         * @classdesc Represents an AccountStartRequest.
         * @implements IAccountStartRequest
         * @constructor
         * @param {anytype.IAccountStartRequest=} [properties] Properties to set
         */
        function AccountStartRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountStartRequest id.
         * @member {string} id
         * @memberof anytype.AccountStartRequest
         * @instance
         */
        AccountStartRequest.prototype.id = "";

        /**
         * Creates a new AccountStartRequest instance using the specified properties.
         * @function create
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {anytype.IAccountStartRequest=} [properties] Properties to set
         * @returns {anytype.AccountStartRequest} AccountStartRequest instance
         */
        AccountStartRequest.create = function create(properties) {
            return new AccountStartRequest(properties);
        };

        /**
         * Encodes the specified AccountStartRequest message. Does not implicitly {@link anytype.AccountStartRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {anytype.IAccountStartRequest} message AccountStartRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountStartRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            return writer;
        };

        /**
         * Encodes the specified AccountStartRequest message, length delimited. Does not implicitly {@link anytype.AccountStartRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {anytype.IAccountStartRequest} message AccountStartRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountStartRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountStartRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountStartRequest} AccountStartRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountStartRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountStartRequest();
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
         * Decodes an AccountStartRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountStartRequest} AccountStartRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountStartRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountStartRequest message.
         * @function verify
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountStartRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            return null;
        };

        /**
         * Creates an AccountStartRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountStartRequest} AccountStartRequest
         */
        AccountStartRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountStartRequest)
                return object;
            var message = new $root.anytype.AccountStartRequest();
            if (object.id != null)
                message.id = String(object.id);
            return message;
        };

        /**
         * Creates a plain object from an AccountStartRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountStartRequest
         * @static
         * @param {anytype.AccountStartRequest} message AccountStartRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountStartRequest.toObject = function toObject(message, options) {
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
         * Converts this AccountStartRequest to JSON.
         * @function toJSON
         * @memberof anytype.AccountStartRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountStartRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AccountStartRequest;
    })();

    anytype.AccountStartResponse = (function() {

        /**
         * Properties of an AccountStartResponse.
         * @memberof anytype
         * @interface IAccountStartResponse
         * @property {anytype.AccountStartResponse.IError|null} [error] AccountStartResponse error
         * @property {anytype.IAccount|null} [account] AccountStartResponse account
         */

        /**
         * Constructs a new AccountStartResponse.
         * @memberof anytype
         * @classdesc Represents an AccountStartResponse.
         * @implements IAccountStartResponse
         * @constructor
         * @param {anytype.IAccountStartResponse=} [properties] Properties to set
         */
        function AccountStartResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountStartResponse error.
         * @member {anytype.AccountStartResponse.IError|null|undefined} error
         * @memberof anytype.AccountStartResponse
         * @instance
         */
        AccountStartResponse.prototype.error = null;

        /**
         * AccountStartResponse account.
         * @member {anytype.IAccount|null|undefined} account
         * @memberof anytype.AccountStartResponse
         * @instance
         */
        AccountStartResponse.prototype.account = null;

        /**
         * Creates a new AccountStartResponse instance using the specified properties.
         * @function create
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {anytype.IAccountStartResponse=} [properties] Properties to set
         * @returns {anytype.AccountStartResponse} AccountStartResponse instance
         */
        AccountStartResponse.create = function create(properties) {
            return new AccountStartResponse(properties);
        };

        /**
         * Encodes the specified AccountStartResponse message. Does not implicitly {@link anytype.AccountStartResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {anytype.IAccountStartResponse} message AccountStartResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountStartResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.AccountStartResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.account != null && message.hasOwnProperty("account"))
                $root.anytype.Account.encode(message.account, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AccountStartResponse message, length delimited. Does not implicitly {@link anytype.AccountStartResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {anytype.IAccountStartResponse} message AccountStartResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountStartResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountStartResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountStartResponse} AccountStartResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountStartResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountStartResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.AccountStartResponse.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.account = $root.anytype.Account.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountStartResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountStartResponse} AccountStartResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountStartResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountStartResponse message.
         * @function verify
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountStartResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.AccountStartResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.account != null && message.hasOwnProperty("account")) {
                var error = $root.anytype.Account.verify(message.account);
                if (error)
                    return "account." + error;
            }
            return null;
        };

        /**
         * Creates an AccountStartResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountStartResponse} AccountStartResponse
         */
        AccountStartResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountStartResponse)
                return object;
            var message = new $root.anytype.AccountStartResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.AccountStartResponse.error: object expected");
                message.error = $root.anytype.AccountStartResponse.Error.fromObject(object.error);
            }
            if (object.account != null) {
                if (typeof object.account !== "object")
                    throw TypeError(".anytype.AccountStartResponse.account: object expected");
                message.account = $root.anytype.Account.fromObject(object.account);
            }
            return message;
        };

        /**
         * Creates a plain object from an AccountStartResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountStartResponse
         * @static
         * @param {anytype.AccountStartResponse} message AccountStartResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountStartResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                object.account = null;
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.AccountStartResponse.Error.toObject(message.error, options);
            if (message.account != null && message.hasOwnProperty("account"))
                object.account = $root.anytype.Account.toObject(message.account, options);
            return object;
        };

        /**
         * Converts this AccountStartResponse to JSON.
         * @function toJSON
         * @memberof anytype.AccountStartResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountStartResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        AccountStartResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.AccountStartResponse
             * @interface IError
             * @property {anytype.AccountStartResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.AccountStartResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.AccountStartResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.AccountStartResponse.Error.Code} code
             * @memberof anytype.AccountStartResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.AccountStartResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.AccountStartResponse.Error
             * @static
             * @param {anytype.AccountStartResponse.IError=} [properties] Properties to set
             * @returns {anytype.AccountStartResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountStartResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.AccountStartResponse.Error
             * @static
             * @param {anytype.AccountStartResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountStartResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.AccountStartResponse.Error
             * @static
             * @param {anytype.AccountStartResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.AccountStartResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.AccountStartResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountStartResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.AccountStartResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.AccountStartResponse.Error} Error
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
             * @memberof anytype.AccountStartResponse.Error
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
                    case 101:
                    case 102:
                    case 103:
                    case 104:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.AccountStartResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.AccountStartResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.AccountStartResponse.Error)
                    return object;
                var message = new $root.anytype.AccountStartResponse.Error();
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
                case "LOCAL_REPO_DOESNT_EXIST":
                case 101:
                    message.code = 101;
                    break;
                case "LOCAL_REPO_EXISTS_BUT_CORRUPTED":
                case 102:
                    message.code = 102;
                    break;
                case "FAILED_TO_RUN_NODE":
                case 103:
                    message.code = 103;
                    break;
                case "FAILED_TO_FIND_ACCOUNT_INFO":
                case 104:
                    message.code = 104;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.AccountStartResponse.Error
             * @static
             * @param {anytype.AccountStartResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.AccountStartResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.AccountStartResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.AccountStartResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} LOCAL_REPO_DOESNT_EXIST=101 LOCAL_REPO_DOESNT_EXIST value
             * @property {number} LOCAL_REPO_EXISTS_BUT_CORRUPTED=102 LOCAL_REPO_EXISTS_BUT_CORRUPTED value
             * @property {number} FAILED_TO_RUN_NODE=103 FAILED_TO_RUN_NODE value
             * @property {number} FAILED_TO_FIND_ACCOUNT_INFO=104 FAILED_TO_FIND_ACCOUNT_INFO value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "LOCAL_REPO_DOESNT_EXIST"] = 101;
                values[valuesById[102] = "LOCAL_REPO_EXISTS_BUT_CORRUPTED"] = 102;
                values[valuesById[103] = "FAILED_TO_RUN_NODE"] = 103;
                values[valuesById[104] = "FAILED_TO_FIND_ACCOUNT_INFO"] = 104;
                return values;
            })();

            return Error;
        })();

        return AccountStartResponse;
    })();

    anytype.IpfsGetFileRequest = (function() {

        /**
         * Properties of an IpfsGetFileRequest.
         * @memberof anytype
         * @interface IIpfsGetFileRequest
         * @property {string|null} [id] IpfsGetFileRequest id
         */

        /**
         * Constructs a new IpfsGetFileRequest.
         * @memberof anytype
         * @classdesc Represents an IpfsGetFileRequest.
         * @implements IIpfsGetFileRequest
         * @constructor
         * @param {anytype.IIpfsGetFileRequest=} [properties] Properties to set
         */
        function IpfsGetFileRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * IpfsGetFileRequest id.
         * @member {string} id
         * @memberof anytype.IpfsGetFileRequest
         * @instance
         */
        IpfsGetFileRequest.prototype.id = "";

        /**
         * Creates a new IpfsGetFileRequest instance using the specified properties.
         * @function create
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {anytype.IIpfsGetFileRequest=} [properties] Properties to set
         * @returns {anytype.IpfsGetFileRequest} IpfsGetFileRequest instance
         */
        IpfsGetFileRequest.create = function create(properties) {
            return new IpfsGetFileRequest(properties);
        };

        /**
         * Encodes the specified IpfsGetFileRequest message. Does not implicitly {@link anytype.IpfsGetFileRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {anytype.IIpfsGetFileRequest} message IpfsGetFileRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetFileRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            return writer;
        };

        /**
         * Encodes the specified IpfsGetFileRequest message, length delimited. Does not implicitly {@link anytype.IpfsGetFileRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {anytype.IIpfsGetFileRequest} message IpfsGetFileRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetFileRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an IpfsGetFileRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.IpfsGetFileRequest} IpfsGetFileRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetFileRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsGetFileRequest();
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
         * Decodes an IpfsGetFileRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.IpfsGetFileRequest} IpfsGetFileRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetFileRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an IpfsGetFileRequest message.
         * @function verify
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        IpfsGetFileRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            return null;
        };

        /**
         * Creates an IpfsGetFileRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.IpfsGetFileRequest} IpfsGetFileRequest
         */
        IpfsGetFileRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.IpfsGetFileRequest)
                return object;
            var message = new $root.anytype.IpfsGetFileRequest();
            if (object.id != null)
                message.id = String(object.id);
            return message;
        };

        /**
         * Creates a plain object from an IpfsGetFileRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.IpfsGetFileRequest
         * @static
         * @param {anytype.IpfsGetFileRequest} message IpfsGetFileRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        IpfsGetFileRequest.toObject = function toObject(message, options) {
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
         * Converts this IpfsGetFileRequest to JSON.
         * @function toJSON
         * @memberof anytype.IpfsGetFileRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        IpfsGetFileRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return IpfsGetFileRequest;
    })();

    anytype.IpfsGetFileResponse = (function() {

        /**
         * Properties of an IpfsGetFileResponse.
         * @memberof anytype
         * @interface IIpfsGetFileResponse
         * @property {anytype.IpfsGetFileResponse.IError|null} [error] IpfsGetFileResponse error
         * @property {Uint8Array|null} [data] IpfsGetFileResponse data
         * @property {string|null} [media] IpfsGetFileResponse media
         * @property {string|null} [name] IpfsGetFileResponse name
         */

        /**
         * Constructs a new IpfsGetFileResponse.
         * @memberof anytype
         * @classdesc Represents an IpfsGetFileResponse.
         * @implements IIpfsGetFileResponse
         * @constructor
         * @param {anytype.IIpfsGetFileResponse=} [properties] Properties to set
         */
        function IpfsGetFileResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * IpfsGetFileResponse error.
         * @member {anytype.IpfsGetFileResponse.IError|null|undefined} error
         * @memberof anytype.IpfsGetFileResponse
         * @instance
         */
        IpfsGetFileResponse.prototype.error = null;

        /**
         * IpfsGetFileResponse data.
         * @member {Uint8Array} data
         * @memberof anytype.IpfsGetFileResponse
         * @instance
         */
        IpfsGetFileResponse.prototype.data = $util.newBuffer([]);

        /**
         * IpfsGetFileResponse media.
         * @member {string} media
         * @memberof anytype.IpfsGetFileResponse
         * @instance
         */
        IpfsGetFileResponse.prototype.media = "";

        /**
         * IpfsGetFileResponse name.
         * @member {string} name
         * @memberof anytype.IpfsGetFileResponse
         * @instance
         */
        IpfsGetFileResponse.prototype.name = "";

        /**
         * Creates a new IpfsGetFileResponse instance using the specified properties.
         * @function create
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {anytype.IIpfsGetFileResponse=} [properties] Properties to set
         * @returns {anytype.IpfsGetFileResponse} IpfsGetFileResponse instance
         */
        IpfsGetFileResponse.create = function create(properties) {
            return new IpfsGetFileResponse(properties);
        };

        /**
         * Encodes the specified IpfsGetFileResponse message. Does not implicitly {@link anytype.IpfsGetFileResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {anytype.IIpfsGetFileResponse} message IpfsGetFileResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetFileResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.IpfsGetFileResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.data != null && message.hasOwnProperty("data"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.data);
            if (message.media != null && message.hasOwnProperty("media"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.media);
            if (message.name != null && message.hasOwnProperty("name"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.name);
            return writer;
        };

        /**
         * Encodes the specified IpfsGetFileResponse message, length delimited. Does not implicitly {@link anytype.IpfsGetFileResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {anytype.IIpfsGetFileResponse} message IpfsGetFileResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetFileResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an IpfsGetFileResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.IpfsGetFileResponse} IpfsGetFileResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetFileResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsGetFileResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.IpfsGetFileResponse.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.data = reader.bytes();
                    break;
                case 3:
                    message.media = reader.string();
                    break;
                case 4:
                    message.name = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an IpfsGetFileResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.IpfsGetFileResponse} IpfsGetFileResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetFileResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an IpfsGetFileResponse message.
         * @function verify
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        IpfsGetFileResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.IpfsGetFileResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.data != null && message.hasOwnProperty("data"))
                if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                    return "data: buffer expected";
            if (message.media != null && message.hasOwnProperty("media"))
                if (!$util.isString(message.media))
                    return "media: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            return null;
        };

        /**
         * Creates an IpfsGetFileResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.IpfsGetFileResponse} IpfsGetFileResponse
         */
        IpfsGetFileResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.IpfsGetFileResponse)
                return object;
            var message = new $root.anytype.IpfsGetFileResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.IpfsGetFileResponse.error: object expected");
                message.error = $root.anytype.IpfsGetFileResponse.Error.fromObject(object.error);
            }
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length)
                    message.data = object.data;
            if (object.media != null)
                message.media = String(object.media);
            if (object.name != null)
                message.name = String(object.name);
            return message;
        };

        /**
         * Creates a plain object from an IpfsGetFileResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.IpfsGetFileResponse
         * @static
         * @param {anytype.IpfsGetFileResponse} message IpfsGetFileResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        IpfsGetFileResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
                object.media = "";
                object.name = "";
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.IpfsGetFileResponse.Error.toObject(message.error, options);
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            if (message.media != null && message.hasOwnProperty("media"))
                object.media = message.media;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            return object;
        };

        /**
         * Converts this IpfsGetFileResponse to JSON.
         * @function toJSON
         * @memberof anytype.IpfsGetFileResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        IpfsGetFileResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        IpfsGetFileResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.IpfsGetFileResponse
             * @interface IError
             * @property {anytype.IpfsGetFileResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.IpfsGetFileResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.IpfsGetFileResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.IpfsGetFileResponse.Error.Code} code
             * @memberof anytype.IpfsGetFileResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.IpfsGetFileResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.IpfsGetFileResponse.Error
             * @static
             * @param {anytype.IpfsGetFileResponse.IError=} [properties] Properties to set
             * @returns {anytype.IpfsGetFileResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.IpfsGetFileResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.IpfsGetFileResponse.Error
             * @static
             * @param {anytype.IpfsGetFileResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.IpfsGetFileResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.IpfsGetFileResponse.Error
             * @static
             * @param {anytype.IpfsGetFileResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.IpfsGetFileResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.IpfsGetFileResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsGetFileResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.IpfsGetFileResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.IpfsGetFileResponse.Error} Error
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
             * @memberof anytype.IpfsGetFileResponse.Error
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
                    case 101:
                    case 102:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.IpfsGetFileResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.IpfsGetFileResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.IpfsGetFileResponse.Error)
                    return object;
                var message = new $root.anytype.IpfsGetFileResponse.Error();
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
                case "NOT_FOUND":
                case 101:
                    message.code = 101;
                    break;
                case "TIMOUT":
                case 102:
                    message.code = 102;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.IpfsGetFileResponse.Error
             * @static
             * @param {anytype.IpfsGetFileResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.IpfsGetFileResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.IpfsGetFileResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.IpfsGetFileResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} NOT_FOUND=101 NOT_FOUND value
             * @property {number} TIMOUT=102 TIMOUT value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "NOT_FOUND"] = 101;
                values[valuesById[102] = "TIMOUT"] = 102;
                return values;
            })();

            return Error;
        })();

        return IpfsGetFileResponse;
    })();

    anytype.IpfsGetDataRequest = (function() {

        /**
         * Properties of an IpfsGetDataRequest.
         * @memberof anytype
         * @interface IIpfsGetDataRequest
         * @property {string|null} [id] IpfsGetDataRequest id
         */

        /**
         * Constructs a new IpfsGetDataRequest.
         * @memberof anytype
         * @classdesc Represents an IpfsGetDataRequest.
         * @implements IIpfsGetDataRequest
         * @constructor
         * @param {anytype.IIpfsGetDataRequest=} [properties] Properties to set
         */
        function IpfsGetDataRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * IpfsGetDataRequest id.
         * @member {string} id
         * @memberof anytype.IpfsGetDataRequest
         * @instance
         */
        IpfsGetDataRequest.prototype.id = "";

        /**
         * Creates a new IpfsGetDataRequest instance using the specified properties.
         * @function create
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {anytype.IIpfsGetDataRequest=} [properties] Properties to set
         * @returns {anytype.IpfsGetDataRequest} IpfsGetDataRequest instance
         */
        IpfsGetDataRequest.create = function create(properties) {
            return new IpfsGetDataRequest(properties);
        };

        /**
         * Encodes the specified IpfsGetDataRequest message. Does not implicitly {@link anytype.IpfsGetDataRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {anytype.IIpfsGetDataRequest} message IpfsGetDataRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetDataRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            return writer;
        };

        /**
         * Encodes the specified IpfsGetDataRequest message, length delimited. Does not implicitly {@link anytype.IpfsGetDataRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {anytype.IIpfsGetDataRequest} message IpfsGetDataRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetDataRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an IpfsGetDataRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.IpfsGetDataRequest} IpfsGetDataRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetDataRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsGetDataRequest();
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
         * Decodes an IpfsGetDataRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.IpfsGetDataRequest} IpfsGetDataRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetDataRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an IpfsGetDataRequest message.
         * @function verify
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        IpfsGetDataRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            return null;
        };

        /**
         * Creates an IpfsGetDataRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.IpfsGetDataRequest} IpfsGetDataRequest
         */
        IpfsGetDataRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.IpfsGetDataRequest)
                return object;
            var message = new $root.anytype.IpfsGetDataRequest();
            if (object.id != null)
                message.id = String(object.id);
            return message;
        };

        /**
         * Creates a plain object from an IpfsGetDataRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.IpfsGetDataRequest
         * @static
         * @param {anytype.IpfsGetDataRequest} message IpfsGetDataRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        IpfsGetDataRequest.toObject = function toObject(message, options) {
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
         * Converts this IpfsGetDataRequest to JSON.
         * @function toJSON
         * @memberof anytype.IpfsGetDataRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        IpfsGetDataRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return IpfsGetDataRequest;
    })();

    anytype.IpfsGetDataResponse = (function() {

        /**
         * Properties of an IpfsGetDataResponse.
         * @memberof anytype
         * @interface IIpfsGetDataResponse
         * @property {anytype.IpfsGetDataResponse.IError|null} [error] IpfsGetDataResponse error
         * @property {Uint8Array|null} [content] IpfsGetDataResponse content
         * @property {anytype.IIpfsLinks|null} [links] IpfsGetDataResponse links
         */

        /**
         * Constructs a new IpfsGetDataResponse.
         * @memberof anytype
         * @classdesc Represents an IpfsGetDataResponse.
         * @implements IIpfsGetDataResponse
         * @constructor
         * @param {anytype.IIpfsGetDataResponse=} [properties] Properties to set
         */
        function IpfsGetDataResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * IpfsGetDataResponse error.
         * @member {anytype.IpfsGetDataResponse.IError|null|undefined} error
         * @memberof anytype.IpfsGetDataResponse
         * @instance
         */
        IpfsGetDataResponse.prototype.error = null;

        /**
         * IpfsGetDataResponse content.
         * @member {Uint8Array} content
         * @memberof anytype.IpfsGetDataResponse
         * @instance
         */
        IpfsGetDataResponse.prototype.content = $util.newBuffer([]);

        /**
         * IpfsGetDataResponse links.
         * @member {anytype.IIpfsLinks|null|undefined} links
         * @memberof anytype.IpfsGetDataResponse
         * @instance
         */
        IpfsGetDataResponse.prototype.links = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * IpfsGetDataResponse data.
         * @member {"content"|"links"|undefined} data
         * @memberof anytype.IpfsGetDataResponse
         * @instance
         */
        Object.defineProperty(IpfsGetDataResponse.prototype, "data", {
            get: $util.oneOfGetter($oneOfFields = ["content", "links"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new IpfsGetDataResponse instance using the specified properties.
         * @function create
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {anytype.IIpfsGetDataResponse=} [properties] Properties to set
         * @returns {anytype.IpfsGetDataResponse} IpfsGetDataResponse instance
         */
        IpfsGetDataResponse.create = function create(properties) {
            return new IpfsGetDataResponse(properties);
        };

        /**
         * Encodes the specified IpfsGetDataResponse message. Does not implicitly {@link anytype.IpfsGetDataResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {anytype.IIpfsGetDataResponse} message IpfsGetDataResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetDataResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.IpfsGetDataResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.content != null && message.hasOwnProperty("content"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.content);
            if (message.links != null && message.hasOwnProperty("links"))
                $root.anytype.IpfsLinks.encode(message.links, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified IpfsGetDataResponse message, length delimited. Does not implicitly {@link anytype.IpfsGetDataResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {anytype.IIpfsGetDataResponse} message IpfsGetDataResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsGetDataResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an IpfsGetDataResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.IpfsGetDataResponse} IpfsGetDataResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetDataResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsGetDataResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.IpfsGetDataResponse.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.content = reader.bytes();
                    break;
                case 3:
                    message.links = $root.anytype.IpfsLinks.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an IpfsGetDataResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.IpfsGetDataResponse} IpfsGetDataResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsGetDataResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an IpfsGetDataResponse message.
         * @function verify
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        IpfsGetDataResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            var properties = {};
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.IpfsGetDataResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.content != null && message.hasOwnProperty("content")) {
                properties.data = 1;
                if (!(message.content && typeof message.content.length === "number" || $util.isString(message.content)))
                    return "content: buffer expected";
            }
            if (message.links != null && message.hasOwnProperty("links")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.anytype.IpfsLinks.verify(message.links);
                    if (error)
                        return "links." + error;
                }
            }
            return null;
        };

        /**
         * Creates an IpfsGetDataResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.IpfsGetDataResponse} IpfsGetDataResponse
         */
        IpfsGetDataResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.IpfsGetDataResponse)
                return object;
            var message = new $root.anytype.IpfsGetDataResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.IpfsGetDataResponse.error: object expected");
                message.error = $root.anytype.IpfsGetDataResponse.Error.fromObject(object.error);
            }
            if (object.content != null)
                if (typeof object.content === "string")
                    $util.base64.decode(object.content, message.content = $util.newBuffer($util.base64.length(object.content)), 0);
                else if (object.content.length)
                    message.content = object.content;
            if (object.links != null) {
                if (typeof object.links !== "object")
                    throw TypeError(".anytype.IpfsGetDataResponse.links: object expected");
                message.links = $root.anytype.IpfsLinks.fromObject(object.links);
            }
            return message;
        };

        /**
         * Creates a plain object from an IpfsGetDataResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.IpfsGetDataResponse
         * @static
         * @param {anytype.IpfsGetDataResponse} message IpfsGetDataResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        IpfsGetDataResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.error = null;
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.IpfsGetDataResponse.Error.toObject(message.error, options);
            if (message.content != null && message.hasOwnProperty("content")) {
                object.content = options.bytes === String ? $util.base64.encode(message.content, 0, message.content.length) : options.bytes === Array ? Array.prototype.slice.call(message.content) : message.content;
                if (options.oneofs)
                    object.data = "content";
            }
            if (message.links != null && message.hasOwnProperty("links")) {
                object.links = $root.anytype.IpfsLinks.toObject(message.links, options);
                if (options.oneofs)
                    object.data = "links";
            }
            return object;
        };

        /**
         * Converts this IpfsGetDataResponse to JSON.
         * @function toJSON
         * @memberof anytype.IpfsGetDataResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        IpfsGetDataResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        IpfsGetDataResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.IpfsGetDataResponse
             * @interface IError
             * @property {anytype.IpfsGetDataResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.IpfsGetDataResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.IpfsGetDataResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.IpfsGetDataResponse.Error.Code} code
             * @memberof anytype.IpfsGetDataResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.IpfsGetDataResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.IpfsGetDataResponse.Error
             * @static
             * @param {anytype.IpfsGetDataResponse.IError=} [properties] Properties to set
             * @returns {anytype.IpfsGetDataResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.IpfsGetDataResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.IpfsGetDataResponse.Error
             * @static
             * @param {anytype.IpfsGetDataResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.IpfsGetDataResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.IpfsGetDataResponse.Error
             * @static
             * @param {anytype.IpfsGetDataResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.IpfsGetDataResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.IpfsGetDataResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsGetDataResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.IpfsGetDataResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.IpfsGetDataResponse.Error} Error
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
             * @memberof anytype.IpfsGetDataResponse.Error
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
                    case 101:
                    case 102:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.IpfsGetDataResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.IpfsGetDataResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.IpfsGetDataResponse.Error)
                    return object;
                var message = new $root.anytype.IpfsGetDataResponse.Error();
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
                case "NOT_FOUND":
                case 101:
                    message.code = 101;
                    break;
                case "TIMOUT":
                case 102:
                    message.code = 102;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.IpfsGetDataResponse.Error
             * @static
             * @param {anytype.IpfsGetDataResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.IpfsGetDataResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.IpfsGetDataResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.IpfsGetDataResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} NOT_FOUND=101 NOT_FOUND value
             * @property {number} TIMOUT=102 TIMOUT value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "NOT_FOUND"] = 101;
                values[valuesById[102] = "TIMOUT"] = 102;
                return values;
            })();

            return Error;
        })();

        return IpfsGetDataResponse;
    })();

    anytype.ImageGetBlobRequest = (function() {

        /**
         * Properties of an ImageGetBlobRequest.
         * @memberof anytype
         * @interface IImageGetBlobRequest
         * @property {string|null} [id] ImageGetBlobRequest id
         * @property {anytype.ImageSize|null} [size] ImageGetBlobRequest size
         */

        /**
         * Constructs a new ImageGetBlobRequest.
         * @memberof anytype
         * @classdesc Represents an ImageGetBlobRequest.
         * @implements IImageGetBlobRequest
         * @constructor
         * @param {anytype.IImageGetBlobRequest=} [properties] Properties to set
         */
        function ImageGetBlobRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ImageGetBlobRequest id.
         * @member {string} id
         * @memberof anytype.ImageGetBlobRequest
         * @instance
         */
        ImageGetBlobRequest.prototype.id = "";

        /**
         * ImageGetBlobRequest size.
         * @member {anytype.ImageSize} size
         * @memberof anytype.ImageGetBlobRequest
         * @instance
         */
        ImageGetBlobRequest.prototype.size = 0;

        /**
         * Creates a new ImageGetBlobRequest instance using the specified properties.
         * @function create
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {anytype.IImageGetBlobRequest=} [properties] Properties to set
         * @returns {anytype.ImageGetBlobRequest} ImageGetBlobRequest instance
         */
        ImageGetBlobRequest.create = function create(properties) {
            return new ImageGetBlobRequest(properties);
        };

        /**
         * Encodes the specified ImageGetBlobRequest message. Does not implicitly {@link anytype.ImageGetBlobRequest.verify|verify} messages.
         * @function encode
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {anytype.IImageGetBlobRequest} message ImageGetBlobRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImageGetBlobRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.size != null && message.hasOwnProperty("size"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.size);
            return writer;
        };

        /**
         * Encodes the specified ImageGetBlobRequest message, length delimited. Does not implicitly {@link anytype.ImageGetBlobRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {anytype.IImageGetBlobRequest} message ImageGetBlobRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImageGetBlobRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an ImageGetBlobRequest message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.ImageGetBlobRequest} ImageGetBlobRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImageGetBlobRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.ImageGetBlobRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.size = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ImageGetBlobRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.ImageGetBlobRequest} ImageGetBlobRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImageGetBlobRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ImageGetBlobRequest message.
         * @function verify
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ImageGetBlobRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.size != null && message.hasOwnProperty("size"))
                switch (message.size) {
                default:
                    return "size: enum value expected";
                case 0:
                case 1:
                case 2:
                    break;
                }
            return null;
        };

        /**
         * Creates an ImageGetBlobRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.ImageGetBlobRequest} ImageGetBlobRequest
         */
        ImageGetBlobRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.ImageGetBlobRequest)
                return object;
            var message = new $root.anytype.ImageGetBlobRequest();
            if (object.id != null)
                message.id = String(object.id);
            switch (object.size) {
            case "LARGE":
            case 0:
                message.size = 0;
                break;
            case "SMALL":
            case 1:
                message.size = 1;
                break;
            case "THUMB":
            case 2:
                message.size = 2;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from an ImageGetBlobRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.ImageGetBlobRequest
         * @static
         * @param {anytype.ImageGetBlobRequest} message ImageGetBlobRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ImageGetBlobRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = "";
                object.size = options.enums === String ? "LARGE" : 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.size != null && message.hasOwnProperty("size"))
                object.size = options.enums === String ? $root.anytype.ImageSize[message.size] : message.size;
            return object;
        };

        /**
         * Converts this ImageGetBlobRequest to JSON.
         * @function toJSON
         * @memberof anytype.ImageGetBlobRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ImageGetBlobRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ImageGetBlobRequest;
    })();

    anytype.ImageGetBlobResponse = (function() {

        /**
         * Properties of an ImageGetBlobResponse.
         * @memberof anytype
         * @interface IImageGetBlobResponse
         * @property {anytype.ImageGetBlobResponse.IError|null} [error] ImageGetBlobResponse error
         * @property {Uint8Array|null} [blob] ImageGetBlobResponse blob
         */

        /**
         * Constructs a new ImageGetBlobResponse.
         * @memberof anytype
         * @classdesc Represents an ImageGetBlobResponse.
         * @implements IImageGetBlobResponse
         * @constructor
         * @param {anytype.IImageGetBlobResponse=} [properties] Properties to set
         */
        function ImageGetBlobResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ImageGetBlobResponse error.
         * @member {anytype.ImageGetBlobResponse.IError|null|undefined} error
         * @memberof anytype.ImageGetBlobResponse
         * @instance
         */
        ImageGetBlobResponse.prototype.error = null;

        /**
         * ImageGetBlobResponse blob.
         * @member {Uint8Array} blob
         * @memberof anytype.ImageGetBlobResponse
         * @instance
         */
        ImageGetBlobResponse.prototype.blob = $util.newBuffer([]);

        /**
         * Creates a new ImageGetBlobResponse instance using the specified properties.
         * @function create
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {anytype.IImageGetBlobResponse=} [properties] Properties to set
         * @returns {anytype.ImageGetBlobResponse} ImageGetBlobResponse instance
         */
        ImageGetBlobResponse.create = function create(properties) {
            return new ImageGetBlobResponse(properties);
        };

        /**
         * Encodes the specified ImageGetBlobResponse message. Does not implicitly {@link anytype.ImageGetBlobResponse.verify|verify} messages.
         * @function encode
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {anytype.IImageGetBlobResponse} message ImageGetBlobResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImageGetBlobResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.ImageGetBlobResponse.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.blob != null && message.hasOwnProperty("blob"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.blob);
            return writer;
        };

        /**
         * Encodes the specified ImageGetBlobResponse message, length delimited. Does not implicitly {@link anytype.ImageGetBlobResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {anytype.IImageGetBlobResponse} message ImageGetBlobResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImageGetBlobResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an ImageGetBlobResponse message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.ImageGetBlobResponse} ImageGetBlobResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImageGetBlobResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.ImageGetBlobResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.ImageGetBlobResponse.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.blob = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ImageGetBlobResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.ImageGetBlobResponse} ImageGetBlobResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImageGetBlobResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ImageGetBlobResponse message.
         * @function verify
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ImageGetBlobResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.ImageGetBlobResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.blob != null && message.hasOwnProperty("blob"))
                if (!(message.blob && typeof message.blob.length === "number" || $util.isString(message.blob)))
                    return "blob: buffer expected";
            return null;
        };

        /**
         * Creates an ImageGetBlobResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.ImageGetBlobResponse} ImageGetBlobResponse
         */
        ImageGetBlobResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.ImageGetBlobResponse)
                return object;
            var message = new $root.anytype.ImageGetBlobResponse();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.ImageGetBlobResponse.error: object expected");
                message.error = $root.anytype.ImageGetBlobResponse.Error.fromObject(object.error);
            }
            if (object.blob != null)
                if (typeof object.blob === "string")
                    $util.base64.decode(object.blob, message.blob = $util.newBuffer($util.base64.length(object.blob)), 0);
                else if (object.blob.length)
                    message.blob = object.blob;
            return message;
        };

        /**
         * Creates a plain object from an ImageGetBlobResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.ImageGetBlobResponse
         * @static
         * @param {anytype.ImageGetBlobResponse} message ImageGetBlobResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ImageGetBlobResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                if (options.bytes === String)
                    object.blob = "";
                else {
                    object.blob = [];
                    if (options.bytes !== Array)
                        object.blob = $util.newBuffer(object.blob);
                }
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.ImageGetBlobResponse.Error.toObject(message.error, options);
            if (message.blob != null && message.hasOwnProperty("blob"))
                object.blob = options.bytes === String ? $util.base64.encode(message.blob, 0, message.blob.length) : options.bytes === Array ? Array.prototype.slice.call(message.blob) : message.blob;
            return object;
        };

        /**
         * Converts this ImageGetBlobResponse to JSON.
         * @function toJSON
         * @memberof anytype.ImageGetBlobResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ImageGetBlobResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        ImageGetBlobResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.ImageGetBlobResponse
             * @interface IError
             * @property {anytype.ImageGetBlobResponse.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.ImageGetBlobResponse
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.ImageGetBlobResponse.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.ImageGetBlobResponse.Error.Code} code
             * @memberof anytype.ImageGetBlobResponse.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.ImageGetBlobResponse.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.ImageGetBlobResponse.Error
             * @static
             * @param {anytype.ImageGetBlobResponse.IError=} [properties] Properties to set
             * @returns {anytype.ImageGetBlobResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.ImageGetBlobResponse.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.ImageGetBlobResponse.Error
             * @static
             * @param {anytype.ImageGetBlobResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.ImageGetBlobResponse.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.ImageGetBlobResponse.Error
             * @static
             * @param {anytype.ImageGetBlobResponse.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.ImageGetBlobResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.ImageGetBlobResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.ImageGetBlobResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.ImageGetBlobResponse.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.ImageGetBlobResponse.Error} Error
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
             * @memberof anytype.ImageGetBlobResponse.Error
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
                    case 101:
                    case 102:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.ImageGetBlobResponse.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.ImageGetBlobResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.ImageGetBlobResponse.Error)
                    return object;
                var message = new $root.anytype.ImageGetBlobResponse.Error();
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
                case "NOT_FOUND":
                case 101:
                    message.code = 101;
                    break;
                case "TIMOUT":
                case 102:
                    message.code = 102;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.ImageGetBlobResponse.Error
             * @static
             * @param {anytype.ImageGetBlobResponse.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.ImageGetBlobResponse.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.ImageGetBlobResponse.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.ImageGetBlobResponse.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} NOT_FOUND=101 NOT_FOUND value
             * @property {number} TIMOUT=102 TIMOUT value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "NOT_FOUND"] = 101;
                values[valuesById[102] = "TIMOUT"] = 102;
                return values;
            })();

            return Error;
        })();

        return ImageGetBlobResponse;
    })();

    anytype.Account = (function() {

        /**
         * Properties of an Account.
         * @memberof anytype
         * @interface IAccount
         * @property {string|null} [id] Account id
         * @property {string|null} [name] Account name
         * @property {anytype.IImage|null} [avatar] Account avatar
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
         * Account avatar.
         * @member {anytype.IImage|null|undefined} avatar
         * @memberof anytype.Account
         * @instance
         */
        Account.prototype.avatar = null;

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
            if (message.avatar != null && message.hasOwnProperty("avatar"))
                $root.anytype.Image.encode(message.avatar, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
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
                    message.avatar = $root.anytype.Image.decode(reader, reader.uint32());
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
            if (message.avatar != null && message.hasOwnProperty("avatar")) {
                var error = $root.anytype.Image.verify(message.avatar);
                if (error)
                    return "avatar." + error;
            }
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
            if (object.avatar != null) {
                if (typeof object.avatar !== "object")
                    throw TypeError(".anytype.Account.avatar: object expected");
                message.avatar = $root.anytype.Image.fromObject(object.avatar);
            }
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
                object.avatar = null;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.avatar != null && message.hasOwnProperty("avatar"))
                object.avatar = $root.anytype.Image.toObject(message.avatar, options);
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

    anytype.IpfsLink = (function() {

        /**
         * Properties of an IpfsLink.
         * @memberof anytype
         * @interface IIpfsLink
         * @property {string|null} [cid] IpfsLink cid
         * @property {string|null} [name] IpfsLink name
         * @property {number|Long|null} [size] IpfsLink size
         */

        /**
         * Constructs a new IpfsLink.
         * @memberof anytype
         * @classdesc Represents an IpfsLink.
         * @implements IIpfsLink
         * @constructor
         * @param {anytype.IIpfsLink=} [properties] Properties to set
         */
        function IpfsLink(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * IpfsLink cid.
         * @member {string} cid
         * @memberof anytype.IpfsLink
         * @instance
         */
        IpfsLink.prototype.cid = "";

        /**
         * IpfsLink name.
         * @member {string} name
         * @memberof anytype.IpfsLink
         * @instance
         */
        IpfsLink.prototype.name = "";

        /**
         * IpfsLink size.
         * @member {number|Long} size
         * @memberof anytype.IpfsLink
         * @instance
         */
        IpfsLink.prototype.size = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new IpfsLink instance using the specified properties.
         * @function create
         * @memberof anytype.IpfsLink
         * @static
         * @param {anytype.IIpfsLink=} [properties] Properties to set
         * @returns {anytype.IpfsLink} IpfsLink instance
         */
        IpfsLink.create = function create(properties) {
            return new IpfsLink(properties);
        };

        /**
         * Encodes the specified IpfsLink message. Does not implicitly {@link anytype.IpfsLink.verify|verify} messages.
         * @function encode
         * @memberof anytype.IpfsLink
         * @static
         * @param {anytype.IIpfsLink} message IpfsLink message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsLink.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.cid != null && message.hasOwnProperty("cid"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.cid);
            if (message.name != null && message.hasOwnProperty("name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.size != null && message.hasOwnProperty("size"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.size);
            return writer;
        };

        /**
         * Encodes the specified IpfsLink message, length delimited. Does not implicitly {@link anytype.IpfsLink.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.IpfsLink
         * @static
         * @param {anytype.IIpfsLink} message IpfsLink message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsLink.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an IpfsLink message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.IpfsLink
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.IpfsLink} IpfsLink
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsLink.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsLink();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.cid = reader.string();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.size = reader.uint64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an IpfsLink message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.IpfsLink
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.IpfsLink} IpfsLink
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsLink.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an IpfsLink message.
         * @function verify
         * @memberof anytype.IpfsLink
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        IpfsLink.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.cid != null && message.hasOwnProperty("cid"))
                if (!$util.isString(message.cid))
                    return "cid: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.size != null && message.hasOwnProperty("size"))
                if (!$util.isInteger(message.size) && !(message.size && $util.isInteger(message.size.low) && $util.isInteger(message.size.high)))
                    return "size: integer|Long expected";
            return null;
        };

        /**
         * Creates an IpfsLink message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.IpfsLink
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.IpfsLink} IpfsLink
         */
        IpfsLink.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.IpfsLink)
                return object;
            var message = new $root.anytype.IpfsLink();
            if (object.cid != null)
                message.cid = String(object.cid);
            if (object.name != null)
                message.name = String(object.name);
            if (object.size != null)
                if ($util.Long)
                    (message.size = $util.Long.fromValue(object.size)).unsigned = true;
                else if (typeof object.size === "string")
                    message.size = parseInt(object.size, 10);
                else if (typeof object.size === "number")
                    message.size = object.size;
                else if (typeof object.size === "object")
                    message.size = new $util.LongBits(object.size.low >>> 0, object.size.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from an IpfsLink message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.IpfsLink
         * @static
         * @param {anytype.IpfsLink} message IpfsLink
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        IpfsLink.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.cid = "";
                object.name = "";
                if ($util.Long) {
                    var long = new $util.Long(0, 0, true);
                    object.size = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.size = options.longs === String ? "0" : 0;
            }
            if (message.cid != null && message.hasOwnProperty("cid"))
                object.cid = message.cid;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.size != null && message.hasOwnProperty("size"))
                if (typeof message.size === "number")
                    object.size = options.longs === String ? String(message.size) : message.size;
                else
                    object.size = options.longs === String ? $util.Long.prototype.toString.call(message.size) : options.longs === Number ? new $util.LongBits(message.size.low >>> 0, message.size.high >>> 0).toNumber(true) : message.size;
            return object;
        };

        /**
         * Converts this IpfsLink to JSON.
         * @function toJSON
         * @memberof anytype.IpfsLink
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        IpfsLink.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return IpfsLink;
    })();

    /**
     * ImageSize enum.
     * @name anytype.ImageSize
     * @enum {string}
     * @property {number} LARGE=0 LARGE value
     * @property {number} SMALL=1 SMALL value
     * @property {number} THUMB=2 THUMB value
     */
    anytype.ImageSize = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "LARGE"] = 0;
        values[valuesById[1] = "SMALL"] = 1;
        values[valuesById[2] = "THUMB"] = 2;
        return values;
    })();

    anytype.Image = (function() {

        /**
         * Properties of an Image.
         * @memberof anytype
         * @interface IImage
         * @property {string|null} [id] Image id
         * @property {Array.<anytype.ImageSize>|null} [sizes] Image sizes
         */

        /**
         * Constructs a new Image.
         * @memberof anytype
         * @classdesc Represents an Image.
         * @implements IImage
         * @constructor
         * @param {anytype.IImage=} [properties] Properties to set
         */
        function Image(properties) {
            this.sizes = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Image id.
         * @member {string} id
         * @memberof anytype.Image
         * @instance
         */
        Image.prototype.id = "";

        /**
         * Image sizes.
         * @member {Array.<anytype.ImageSize>} sizes
         * @memberof anytype.Image
         * @instance
         */
        Image.prototype.sizes = $util.emptyArray;

        /**
         * Creates a new Image instance using the specified properties.
         * @function create
         * @memberof anytype.Image
         * @static
         * @param {anytype.IImage=} [properties] Properties to set
         * @returns {anytype.Image} Image instance
         */
        Image.create = function create(properties) {
            return new Image(properties);
        };

        /**
         * Encodes the specified Image message. Does not implicitly {@link anytype.Image.verify|verify} messages.
         * @function encode
         * @memberof anytype.Image
         * @static
         * @param {anytype.IImage} message Image message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Image.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.sizes != null && message.sizes.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (var i = 0; i < message.sizes.length; ++i)
                    writer.int32(message.sizes[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified Image message, length delimited. Does not implicitly {@link anytype.Image.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.Image
         * @static
         * @param {anytype.IImage} message Image message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Image.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Image message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.Image
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.Image} Image
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Image.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.Image();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    if (!(message.sizes && message.sizes.length))
                        message.sizes = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.sizes.push(reader.int32());
                    } else
                        message.sizes.push(reader.int32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Image message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.Image
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.Image} Image
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Image.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Image message.
         * @function verify
         * @memberof anytype.Image
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Image.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.sizes != null && message.hasOwnProperty("sizes")) {
                if (!Array.isArray(message.sizes))
                    return "sizes: array expected";
                for (var i = 0; i < message.sizes.length; ++i)
                    switch (message.sizes[i]) {
                    default:
                        return "sizes: enum value[] expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
            }
            return null;
        };

        /**
         * Creates an Image message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.Image
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.Image} Image
         */
        Image.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.Image)
                return object;
            var message = new $root.anytype.Image();
            if (object.id != null)
                message.id = String(object.id);
            if (object.sizes) {
                if (!Array.isArray(object.sizes))
                    throw TypeError(".anytype.Image.sizes: array expected");
                message.sizes = [];
                for (var i = 0; i < object.sizes.length; ++i)
                    switch (object.sizes[i]) {
                    default:
                    case "LARGE":
                    case 0:
                        message.sizes[i] = 0;
                        break;
                    case "SMALL":
                    case 1:
                        message.sizes[i] = 1;
                        break;
                    case "THUMB":
                    case 2:
                        message.sizes[i] = 2;
                        break;
                    }
            }
            return message;
        };

        /**
         * Creates a plain object from an Image message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.Image
         * @static
         * @param {anytype.Image} message Image
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Image.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.sizes = [];
            if (options.defaults)
                object.id = "";
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.sizes && message.sizes.length) {
                object.sizes = [];
                for (var j = 0; j < message.sizes.length; ++j)
                    object.sizes[j] = options.enums === String ? $root.anytype.ImageSize[message.sizes[j]] : message.sizes[j];
            }
            return object;
        };

        /**
         * Converts this Image to JSON.
         * @function toJSON
         * @memberof anytype.Image
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Image.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Image;
    })();

    anytype.IpfsLinks = (function() {

        /**
         * Properties of an IpfsLinks.
         * @memberof anytype
         * @interface IIpfsLinks
         * @property {Array.<anytype.IIpfsLink>|null} [links] IpfsLinks links
         */

        /**
         * Constructs a new IpfsLinks.
         * @memberof anytype
         * @classdesc Represents an IpfsLinks.
         * @implements IIpfsLinks
         * @constructor
         * @param {anytype.IIpfsLinks=} [properties] Properties to set
         */
        function IpfsLinks(properties) {
            this.links = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * IpfsLinks links.
         * @member {Array.<anytype.IIpfsLink>} links
         * @memberof anytype.IpfsLinks
         * @instance
         */
        IpfsLinks.prototype.links = $util.emptyArray;

        /**
         * Creates a new IpfsLinks instance using the specified properties.
         * @function create
         * @memberof anytype.IpfsLinks
         * @static
         * @param {anytype.IIpfsLinks=} [properties] Properties to set
         * @returns {anytype.IpfsLinks} IpfsLinks instance
         */
        IpfsLinks.create = function create(properties) {
            return new IpfsLinks(properties);
        };

        /**
         * Encodes the specified IpfsLinks message. Does not implicitly {@link anytype.IpfsLinks.verify|verify} messages.
         * @function encode
         * @memberof anytype.IpfsLinks
         * @static
         * @param {anytype.IIpfsLinks} message IpfsLinks message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsLinks.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.links != null && message.links.length)
                for (var i = 0; i < message.links.length; ++i)
                    $root.anytype.IpfsLink.encode(message.links[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified IpfsLinks message, length delimited. Does not implicitly {@link anytype.IpfsLinks.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.IpfsLinks
         * @static
         * @param {anytype.IIpfsLinks} message IpfsLinks message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IpfsLinks.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an IpfsLinks message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.IpfsLinks
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.IpfsLinks} IpfsLinks
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsLinks.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.IpfsLinks();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.links && message.links.length))
                        message.links = [];
                    message.links.push($root.anytype.IpfsLink.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an IpfsLinks message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.IpfsLinks
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.IpfsLinks} IpfsLinks
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IpfsLinks.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an IpfsLinks message.
         * @function verify
         * @memberof anytype.IpfsLinks
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        IpfsLinks.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.links != null && message.hasOwnProperty("links")) {
                if (!Array.isArray(message.links))
                    return "links: array expected";
                for (var i = 0; i < message.links.length; ++i) {
                    var error = $root.anytype.IpfsLink.verify(message.links[i]);
                    if (error)
                        return "links." + error;
                }
            }
            return null;
        };

        /**
         * Creates an IpfsLinks message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.IpfsLinks
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.IpfsLinks} IpfsLinks
         */
        IpfsLinks.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.IpfsLinks)
                return object;
            var message = new $root.anytype.IpfsLinks();
            if (object.links) {
                if (!Array.isArray(object.links))
                    throw TypeError(".anytype.IpfsLinks.links: array expected");
                message.links = [];
                for (var i = 0; i < object.links.length; ++i) {
                    if (typeof object.links[i] !== "object")
                        throw TypeError(".anytype.IpfsLinks.links: object expected");
                    message.links[i] = $root.anytype.IpfsLink.fromObject(object.links[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from an IpfsLinks message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.IpfsLinks
         * @static
         * @param {anytype.IpfsLinks} message IpfsLinks
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        IpfsLinks.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.links = [];
            if (message.links && message.links.length) {
                object.links = [];
                for (var j = 0; j < message.links.length; ++j)
                    object.links[j] = $root.anytype.IpfsLink.toObject(message.links[j], options);
            }
            return object;
        };

        /**
         * Converts this IpfsLinks to JSON.
         * @function toJSON
         * @memberof anytype.IpfsLinks
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        IpfsLinks.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return IpfsLinks;
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
         * @property {Array.<anytype.IDocumentHeader>|null} [documentHeaders] State documentHeaders
         * @property {string|null} [currentDocumentId] State currentDocumentId
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
            this.documentHeaders = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * State documentHeaders.
         * @member {Array.<anytype.IDocumentHeader>} documentHeaders
         * @memberof anytype.State
         * @instance
         */
        State.prototype.documentHeaders = $util.emptyArray;

        /**
         * State currentDocumentId.
         * @member {string} currentDocumentId
         * @memberof anytype.State
         * @instance
         */
        State.prototype.currentDocumentId = "";

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
            if (message.documentHeaders != null && message.documentHeaders.length)
                for (var i = 0; i < message.documentHeaders.length; ++i)
                    $root.anytype.DocumentHeader.encode(message.documentHeaders[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.currentDocumentId != null && message.hasOwnProperty("currentDocumentId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.currentDocumentId);
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
                    if (!(message.documentHeaders && message.documentHeaders.length))
                        message.documentHeaders = [];
                    message.documentHeaders.push($root.anytype.DocumentHeader.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.currentDocumentId = reader.string();
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
            if (message.documentHeaders != null && message.hasOwnProperty("documentHeaders")) {
                if (!Array.isArray(message.documentHeaders))
                    return "documentHeaders: array expected";
                for (var i = 0; i < message.documentHeaders.length; ++i) {
                    var error = $root.anytype.DocumentHeader.verify(message.documentHeaders[i]);
                    if (error)
                        return "documentHeaders." + error;
                }
            }
            if (message.currentDocumentId != null && message.hasOwnProperty("currentDocumentId"))
                if (!$util.isString(message.currentDocumentId))
                    return "currentDocumentId: string expected";
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
            if (object.documentHeaders) {
                if (!Array.isArray(object.documentHeaders))
                    throw TypeError(".anytype.State.documentHeaders: array expected");
                message.documentHeaders = [];
                for (var i = 0; i < object.documentHeaders.length; ++i) {
                    if (typeof object.documentHeaders[i] !== "object")
                        throw TypeError(".anytype.State.documentHeaders: object expected");
                    message.documentHeaders[i] = $root.anytype.DocumentHeader.fromObject(object.documentHeaders[i]);
                }
            }
            if (object.currentDocumentId != null)
                message.currentDocumentId = String(object.currentDocumentId);
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
                object.documentHeaders = [];
            if (options.defaults)
                object.currentDocumentId = "";
            if (message.documentHeaders && message.documentHeaders.length) {
                object.documentHeaders = [];
                for (var j = 0; j < message.documentHeaders.length; ++j)
                    object.documentHeaders[j] = $root.anytype.DocumentHeader.toObject(message.documentHeaders[j], options);
            }
            if (message.currentDocumentId != null && message.hasOwnProperty("currentDocumentId"))
                object.currentDocumentId = message.currentDocumentId;
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

    anytype.DocumentHeader = (function() {

        /**
         * Properties of a DocumentHeader.
         * @memberof anytype
         * @interface IDocumentHeader
         * @property {string|null} [id] DocumentHeader id
         * @property {string|null} [name] DocumentHeader name
         * @property {string|null} [version] DocumentHeader version
         * @property {string|null} [icon] DocumentHeader icon
         */

        /**
         * Constructs a new DocumentHeader.
         * @memberof anytype
         * @classdesc Represents a DocumentHeader.
         * @implements IDocumentHeader
         * @constructor
         * @param {anytype.IDocumentHeader=} [properties] Properties to set
         */
        function DocumentHeader(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * DocumentHeader id.
         * @member {string} id
         * @memberof anytype.DocumentHeader
         * @instance
         */
        DocumentHeader.prototype.id = "";

        /**
         * DocumentHeader name.
         * @member {string} name
         * @memberof anytype.DocumentHeader
         * @instance
         */
        DocumentHeader.prototype.name = "";

        /**
         * DocumentHeader version.
         * @member {string} version
         * @memberof anytype.DocumentHeader
         * @instance
         */
        DocumentHeader.prototype.version = "";

        /**
         * DocumentHeader icon.
         * @member {string} icon
         * @memberof anytype.DocumentHeader
         * @instance
         */
        DocumentHeader.prototype.icon = "";

        /**
         * Creates a new DocumentHeader instance using the specified properties.
         * @function create
         * @memberof anytype.DocumentHeader
         * @static
         * @param {anytype.IDocumentHeader=} [properties] Properties to set
         * @returns {anytype.DocumentHeader} DocumentHeader instance
         */
        DocumentHeader.create = function create(properties) {
            return new DocumentHeader(properties);
        };

        /**
         * Encodes the specified DocumentHeader message. Does not implicitly {@link anytype.DocumentHeader.verify|verify} messages.
         * @function encode
         * @memberof anytype.DocumentHeader
         * @static
         * @param {anytype.IDocumentHeader} message DocumentHeader message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DocumentHeader.encode = function encode(message, writer) {
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
         * Encodes the specified DocumentHeader message, length delimited. Does not implicitly {@link anytype.DocumentHeader.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.DocumentHeader
         * @static
         * @param {anytype.IDocumentHeader} message DocumentHeader message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DocumentHeader.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DocumentHeader message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.DocumentHeader
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.DocumentHeader} DocumentHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DocumentHeader.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.DocumentHeader();
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
         * Decodes a DocumentHeader message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.DocumentHeader
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.DocumentHeader} DocumentHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DocumentHeader.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DocumentHeader message.
         * @function verify
         * @memberof anytype.DocumentHeader
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DocumentHeader.verify = function verify(message) {
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
         * Creates a DocumentHeader message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.DocumentHeader
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.DocumentHeader} DocumentHeader
         */
        DocumentHeader.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.DocumentHeader)
                return object;
            var message = new $root.anytype.DocumentHeader();
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
         * Creates a plain object from a DocumentHeader message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.DocumentHeader
         * @static
         * @param {anytype.DocumentHeader} message DocumentHeader
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DocumentHeader.toObject = function toObject(message, options) {
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
         * Converts this DocumentHeader to JSON.
         * @function toJSON
         * @memberof anytype.DocumentHeader
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DocumentHeader.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return DocumentHeader;
    })();

    anytype.Document = (function() {

        /**
         * Properties of a Document.
         * @memberof anytype
         * @interface IDocument
         * @property {anytype.IDocumentHeader|null} [header] Document header
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
         * @member {anytype.IDocumentHeader|null|undefined} header
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
                $root.anytype.DocumentHeader.encode(message.header, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
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
                    message.header = $root.anytype.DocumentHeader.decode(reader, reader.uint32());
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
                var error = $root.anytype.DocumentHeader.verify(message.header);
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
                message.header = $root.anytype.DocumentHeader.fromObject(object.header);
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
                object.header = $root.anytype.DocumentHeader.toObject(message.header, options);
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
         * @property {anytype.IAccountAdd|null} [accountAdd] Event accountAdd
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
         * Event accountAdd.
         * @member {anytype.IAccountAdd|null|undefined} accountAdd
         * @memberof anytype.Event
         * @instance
         */
        Event.prototype.accountAdd = null;

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
         * @member {"accountAdd"|"blockCreate"|"blockUpdate"|"blockRemove"|undefined} message
         * @memberof anytype.Event
         * @instance
         */
        Object.defineProperty(Event.prototype, "message", {
            get: $util.oneOfGetter($oneOfFields = ["accountAdd", "blockCreate", "blockUpdate", "blockRemove"]),
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
            if (message.accountAdd != null && message.hasOwnProperty("accountAdd"))
                $root.anytype.AccountAdd.encode(message.accountAdd, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.blockCreate != null && message.hasOwnProperty("blockCreate"))
                $root.anytype.BlockCreate.encode(message.blockCreate, writer.uint32(/* id 102, wireType 2 =*/818).fork()).ldelim();
            if (message.blockUpdate != null && message.hasOwnProperty("blockUpdate"))
                $root.anytype.BlockUpdate.encode(message.blockUpdate, writer.uint32(/* id 103, wireType 2 =*/826).fork()).ldelim();
            if (message.blockRemove != null && message.hasOwnProperty("blockRemove"))
                $root.anytype.BlockRemove.encode(message.blockRemove, writer.uint32(/* id 104, wireType 2 =*/834).fork()).ldelim();
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
                    message.accountAdd = $root.anytype.AccountAdd.decode(reader, reader.uint32());
                    break;
                case 102:
                    message.blockCreate = $root.anytype.BlockCreate.decode(reader, reader.uint32());
                    break;
                case 103:
                    message.blockUpdate = $root.anytype.BlockUpdate.decode(reader, reader.uint32());
                    break;
                case 104:
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
            if (message.accountAdd != null && message.hasOwnProperty("accountAdd")) {
                properties.message = 1;
                {
                    var error = $root.anytype.AccountAdd.verify(message.accountAdd);
                    if (error)
                        return "accountAdd." + error;
                }
            }
            if (message.blockCreate != null && message.hasOwnProperty("blockCreate")) {
                if (properties.message === 1)
                    return "message: multiple values";
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
            if (object.accountAdd != null) {
                if (typeof object.accountAdd !== "object")
                    throw TypeError(".anytype.Event.accountAdd: object expected");
                message.accountAdd = $root.anytype.AccountAdd.fromObject(object.accountAdd);
            }
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
            if (message.accountAdd != null && message.hasOwnProperty("accountAdd")) {
                object.accountAdd = $root.anytype.AccountAdd.toObject(message.accountAdd, options);
                if (options.oneofs)
                    object.message = "accountAdd";
            }
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

    anytype.AccountAdd = (function() {

        /**
         * Properties of an AccountAdd.
         * @memberof anytype
         * @interface IAccountAdd
         * @property {anytype.AccountAdd.IError|null} [error] AccountAdd error
         * @property {number|Long|null} [index] AccountAdd index
         * @property {anytype.IAccount|null} [account] AccountAdd account
         */

        /**
         * Constructs a new AccountAdd.
         * @memberof anytype
         * @classdesc Represents an AccountAdd.
         * @implements IAccountAdd
         * @constructor
         * @param {anytype.IAccountAdd=} [properties] Properties to set
         */
        function AccountAdd(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountAdd error.
         * @member {anytype.AccountAdd.IError|null|undefined} error
         * @memberof anytype.AccountAdd
         * @instance
         */
        AccountAdd.prototype.error = null;

        /**
         * AccountAdd index.
         * @member {number|Long} index
         * @memberof anytype.AccountAdd
         * @instance
         */
        AccountAdd.prototype.index = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * AccountAdd account.
         * @member {anytype.IAccount|null|undefined} account
         * @memberof anytype.AccountAdd
         * @instance
         */
        AccountAdd.prototype.account = null;

        /**
         * Creates a new AccountAdd instance using the specified properties.
         * @function create
         * @memberof anytype.AccountAdd
         * @static
         * @param {anytype.IAccountAdd=} [properties] Properties to set
         * @returns {anytype.AccountAdd} AccountAdd instance
         */
        AccountAdd.create = function create(properties) {
            return new AccountAdd(properties);
        };

        /**
         * Encodes the specified AccountAdd message. Does not implicitly {@link anytype.AccountAdd.verify|verify} messages.
         * @function encode
         * @memberof anytype.AccountAdd
         * @static
         * @param {anytype.IAccountAdd} message AccountAdd message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountAdd.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.error != null && message.hasOwnProperty("error"))
                $root.anytype.AccountAdd.Error.encode(message.error, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.index != null && message.hasOwnProperty("index"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.index);
            if (message.account != null && message.hasOwnProperty("account"))
                $root.anytype.Account.encode(message.account, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified AccountAdd message, length delimited. Does not implicitly {@link anytype.AccountAdd.verify|verify} messages.
         * @function encodeDelimited
         * @memberof anytype.AccountAdd
         * @static
         * @param {anytype.IAccountAdd} message AccountAdd message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountAdd.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountAdd message from the specified reader or buffer.
         * @function decode
         * @memberof anytype.AccountAdd
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {anytype.AccountAdd} AccountAdd
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountAdd.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountAdd();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.error = $root.anytype.AccountAdd.Error.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.index = reader.int64();
                    break;
                case 3:
                    message.account = $root.anytype.Account.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountAdd message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof anytype.AccountAdd
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {anytype.AccountAdd} AccountAdd
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountAdd.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountAdd message.
         * @function verify
         * @memberof anytype.AccountAdd
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountAdd.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.anytype.AccountAdd.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            if (message.index != null && message.hasOwnProperty("index"))
                if (!$util.isInteger(message.index) && !(message.index && $util.isInteger(message.index.low) && $util.isInteger(message.index.high)))
                    return "index: integer|Long expected";
            if (message.account != null && message.hasOwnProperty("account")) {
                var error = $root.anytype.Account.verify(message.account);
                if (error)
                    return "account." + error;
            }
            return null;
        };

        /**
         * Creates an AccountAdd message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof anytype.AccountAdd
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {anytype.AccountAdd} AccountAdd
         */
        AccountAdd.fromObject = function fromObject(object) {
            if (object instanceof $root.anytype.AccountAdd)
                return object;
            var message = new $root.anytype.AccountAdd();
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".anytype.AccountAdd.error: object expected");
                message.error = $root.anytype.AccountAdd.Error.fromObject(object.error);
            }
            if (object.index != null)
                if ($util.Long)
                    (message.index = $util.Long.fromValue(object.index)).unsigned = false;
                else if (typeof object.index === "string")
                    message.index = parseInt(object.index, 10);
                else if (typeof object.index === "number")
                    message.index = object.index;
                else if (typeof object.index === "object")
                    message.index = new $util.LongBits(object.index.low >>> 0, object.index.high >>> 0).toNumber();
            if (object.account != null) {
                if (typeof object.account !== "object")
                    throw TypeError(".anytype.AccountAdd.account: object expected");
                message.account = $root.anytype.Account.fromObject(object.account);
            }
            return message;
        };

        /**
         * Creates a plain object from an AccountAdd message. Also converts values to other types if specified.
         * @function toObject
         * @memberof anytype.AccountAdd
         * @static
         * @param {anytype.AccountAdd} message AccountAdd
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountAdd.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.error = null;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.index = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.index = options.longs === String ? "0" : 0;
                object.account = null;
            }
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.anytype.AccountAdd.Error.toObject(message.error, options);
            if (message.index != null && message.hasOwnProperty("index"))
                if (typeof message.index === "number")
                    object.index = options.longs === String ? String(message.index) : message.index;
                else
                    object.index = options.longs === String ? $util.Long.prototype.toString.call(message.index) : options.longs === Number ? new $util.LongBits(message.index.low >>> 0, message.index.high >>> 0).toNumber() : message.index;
            if (message.account != null && message.hasOwnProperty("account"))
                object.account = $root.anytype.Account.toObject(message.account, options);
            return object;
        };

        /**
         * Converts this AccountAdd to JSON.
         * @function toJSON
         * @memberof anytype.AccountAdd
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountAdd.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        AccountAdd.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof anytype.AccountAdd
             * @interface IError
             * @property {anytype.AccountAdd.Error.Code|null} [code] Error code
             * @property {string|null} [description] Error description
             */

            /**
             * Constructs a new Error.
             * @memberof anytype.AccountAdd
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {anytype.AccountAdd.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {anytype.AccountAdd.Error.Code} code
             * @memberof anytype.AccountAdd.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error description.
             * @member {string} description
             * @memberof anytype.AccountAdd.Error
             * @instance
             */
            Error.prototype.description = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof anytype.AccountAdd.Error
             * @static
             * @param {anytype.AccountAdd.IError=} [properties] Properties to set
             * @returns {anytype.AccountAdd.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountAdd.Error.verify|verify} messages.
             * @function encode
             * @memberof anytype.AccountAdd.Error
             * @static
             * @param {anytype.AccountAdd.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && message.hasOwnProperty("code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.description != null && message.hasOwnProperty("description"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountAdd.Error.verify|verify} messages.
             * @function encodeDelimited
             * @memberof anytype.AccountAdd.Error
             * @static
             * @param {anytype.AccountAdd.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof anytype.AccountAdd.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {anytype.AccountAdd.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.anytype.AccountAdd.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.code = reader.int32();
                        break;
                    case 2:
                        message.description = reader.string();
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
             * @memberof anytype.AccountAdd.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {anytype.AccountAdd.Error} Error
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
             * @memberof anytype.AccountAdd.Error
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
                    case 101:
                    case 102:
                    case 103:
                    case 104:
                        break;
                    }
                if (message.description != null && message.hasOwnProperty("description"))
                    if (!$util.isString(message.description))
                        return "description: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof anytype.AccountAdd.Error
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {anytype.AccountAdd.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.anytype.AccountAdd.Error)
                    return object;
                var message = new $root.anytype.AccountAdd.Error();
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
                case "FAILED_TO_CREATE_LOCAL_REPO":
                case 101:
                    message.code = 101;
                    break;
                case "LOCAL_REPO_EXISTS_BUT_CORRUPTED":
                case 102:
                    message.code = 102;
                    break;
                case "FAILED_TO_RUN_NODE":
                case 103:
                    message.code = 103;
                    break;
                case "FAILED_TO_FIND_ACCOUNT_INFO":
                case 104:
                    message.code = 104;
                    break;
                }
                if (object.description != null)
                    message.description = String(object.description);
                return message;
            };

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @function toObject
             * @memberof anytype.AccountAdd.Error
             * @static
             * @param {anytype.AccountAdd.Error} message Error
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.code = options.enums === String ? "NULL" : 0;
                    object.description = "";
                }
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = options.enums === String ? $root.anytype.AccountAdd.Error.Code[message.code] : message.code;
                if (message.description != null && message.hasOwnProperty("description"))
                    object.description = message.description;
                return object;
            };

            /**
             * Converts this Error to JSON.
             * @function toJSON
             * @memberof anytype.AccountAdd.Error
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Code enum.
             * @name anytype.AccountAdd.Error.Code
             * @enum {string}
             * @property {number} NULL=0 NULL value
             * @property {number} UNKNOWN_ERROR=1 UNKNOWN_ERROR value
             * @property {number} BAD_INPUT=2 BAD_INPUT value
             * @property {number} FAILED_TO_CREATE_LOCAL_REPO=101 FAILED_TO_CREATE_LOCAL_REPO value
             * @property {number} LOCAL_REPO_EXISTS_BUT_CORRUPTED=102 LOCAL_REPO_EXISTS_BUT_CORRUPTED value
             * @property {number} FAILED_TO_RUN_NODE=103 FAILED_TO_RUN_NODE value
             * @property {number} FAILED_TO_FIND_ACCOUNT_INFO=104 FAILED_TO_FIND_ACCOUNT_INFO value
             */
            Error.Code = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "NULL"] = 0;
                values[valuesById[1] = "UNKNOWN_ERROR"] = 1;
                values[valuesById[2] = "BAD_INPUT"] = 2;
                values[valuesById[101] = "FAILED_TO_CREATE_LOCAL_REPO"] = 101;
                values[valuesById[102] = "LOCAL_REPO_EXISTS_BUT_CORRUPTED"] = 102;
                values[valuesById[103] = "FAILED_TO_RUN_NODE"] = 103;
                values[valuesById[104] = "FAILED_TO_FIND_ACCOUNT_INFO"] = 104;
                return values;
            })();

            return Error;
        })();

        return AccountAdd;
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
