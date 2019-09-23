import * as $protobuf from "protobufjs";
/** Namespace anytype. */
export namespace anytype {

    /** Represents a ClientCommands */
    class ClientCommands extends $protobuf.rpc.Service {

        /**
         * Constructs a new ClientCommands service.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         */
        constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

        /**
         * Creates new ClientCommands service using the specified rpc implementation.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         * @returns RPC service. Useful where requests and/or responses are streamed.
         */
        public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): ClientCommands;

        /**
         * Calls WalletCreate.
         * @param request WalletCreateQ message or plain object
         * @param callback Node-style callback called with the error, if any, and WalletCreateR
         */
        public walletCreate(request: anytype.IWalletCreateQ, callback: anytype.ClientCommands.WalletCreateCallback): void;

        /**
         * Calls WalletCreate.
         * @param request WalletCreateQ message or plain object
         * @returns Promise
         */
        public walletCreate(request: anytype.IWalletCreateQ): Promise<anytype.WalletCreateR>;

        /**
         * Calls WalletLogin.
         * @param request WalletLoginQ message or plain object
         * @param callback Node-style callback called with the error, if any, and WalletLoginR
         */
        public walletLogin(request: anytype.IWalletLoginQ, callback: anytype.ClientCommands.WalletLoginCallback): void;

        /**
         * Calls WalletLogin.
         * @param request WalletLoginQ message or plain object
         * @returns Promise
         */
        public walletLogin(request: anytype.IWalletLoginQ): Promise<anytype.WalletLoginR>;

        /**
         * Calls AccountCreate.
         * @param request AccountCreateQ message or plain object
         * @param callback Node-style callback called with the error, if any, and AccountCreateR
         */
        public accountCreate(request: anytype.IAccountCreateQ, callback: anytype.ClientCommands.AccountCreateCallback): void;

        /**
         * Calls AccountCreate.
         * @param request AccountCreateQ message or plain object
         * @returns Promise
         */
        public accountCreate(request: anytype.IAccountCreateQ): Promise<anytype.AccountCreateR>;

        /**
         * Calls AccountSelect.
         * @param request AccountSelectQ message or plain object
         * @param callback Node-style callback called with the error, if any, and AccountSelectR
         */
        public accountSelect(request: anytype.IAccountSelectQ, callback: anytype.ClientCommands.AccountSelectCallback): void;

        /**
         * Calls AccountSelect.
         * @param request AccountSelectQ message or plain object
         * @returns Promise
         */
        public accountSelect(request: anytype.IAccountSelectQ): Promise<anytype.AccountSelectR>;
    }

    namespace ClientCommands {

        /**
         * Callback as used by {@link anytype.ClientCommands#walletCreate}.
         * @param error Error, if any
         * @param [response] WalletCreateR
         */
        type WalletCreateCallback = (error: (Error|null), response?: anytype.WalletCreateR) => void;

        /**
         * Callback as used by {@link anytype.ClientCommands#walletLogin}.
         * @param error Error, if any
         * @param [response] WalletLoginR
         */
        type WalletLoginCallback = (error: (Error|null), response?: anytype.WalletLoginR) => void;

        /**
         * Callback as used by {@link anytype.ClientCommands#accountCreate}.
         * @param error Error, if any
         * @param [response] AccountCreateR
         */
        type AccountCreateCallback = (error: (Error|null), response?: anytype.AccountCreateR) => void;

        /**
         * Callback as used by {@link anytype.ClientCommands#accountSelect}.
         * @param error Error, if any
         * @param [response] AccountSelectR
         */
        type AccountSelectCallback = (error: (Error|null), response?: anytype.AccountSelectR) => void;
    }

    /** Properties of a WalletCreateQ. */
    interface IWalletCreateQ {

        /** WalletCreateQ pin */
        pin?: (string|null);
    }

    /** Represents a WalletCreateQ. */
    class WalletCreateQ implements IWalletCreateQ {

        /**
         * Constructs a new WalletCreateQ.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IWalletCreateQ);

        /** WalletCreateQ pin. */
        public pin: string;

        /**
         * Creates a new WalletCreateQ instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WalletCreateQ instance
         */
        public static create(properties?: anytype.IWalletCreateQ): anytype.WalletCreateQ;

        /**
         * Encodes the specified WalletCreateQ message. Does not implicitly {@link anytype.WalletCreateQ.verify|verify} messages.
         * @param message WalletCreateQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IWalletCreateQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WalletCreateQ message, length delimited. Does not implicitly {@link anytype.WalletCreateQ.verify|verify} messages.
         * @param message WalletCreateQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IWalletCreateQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WalletCreateQ message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WalletCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.WalletCreateQ;

        /**
         * Decodes a WalletCreateQ message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WalletCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.WalletCreateQ;

        /**
         * Verifies a WalletCreateQ message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WalletCreateQ message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WalletCreateQ
         */
        public static fromObject(object: { [k: string]: any }): anytype.WalletCreateQ;

        /**
         * Creates a plain object from a WalletCreateQ message. Also converts values to other types if specified.
         * @param message WalletCreateQ
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.WalletCreateQ, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WalletCreateQ to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a WalletCreateR. */
    interface IWalletCreateR {

        /** WalletCreateR error */
        error?: (anytype.WalletCreateR.IError|null);

        /** WalletCreateR mnemonics */
        mnemonics?: (string|null);
    }

    /** Represents a WalletCreateR. */
    class WalletCreateR implements IWalletCreateR {

        /**
         * Constructs a new WalletCreateR.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IWalletCreateR);

        /** WalletCreateR error. */
        public error?: (anytype.WalletCreateR.IError|null);

        /** WalletCreateR mnemonics. */
        public mnemonics: string;

        /**
         * Creates a new WalletCreateR instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WalletCreateR instance
         */
        public static create(properties?: anytype.IWalletCreateR): anytype.WalletCreateR;

        /**
         * Encodes the specified WalletCreateR message. Does not implicitly {@link anytype.WalletCreateR.verify|verify} messages.
         * @param message WalletCreateR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IWalletCreateR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WalletCreateR message, length delimited. Does not implicitly {@link anytype.WalletCreateR.verify|verify} messages.
         * @param message WalletCreateR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IWalletCreateR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WalletCreateR message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WalletCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.WalletCreateR;

        /**
         * Decodes a WalletCreateR message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WalletCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.WalletCreateR;

        /**
         * Verifies a WalletCreateR message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WalletCreateR message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WalletCreateR
         */
        public static fromObject(object: { [k: string]: any }): anytype.WalletCreateR;

        /**
         * Creates a plain object from a WalletCreateR message. Also converts values to other types if specified.
         * @param message WalletCreateR
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.WalletCreateR, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WalletCreateR to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace WalletCreateR {

        /** Properties of an Error. */
        interface IError {

            /** Error code */
            code?: (anytype.WalletCreateR.Error.Code|null);

            /** Error desc */
            desc?: (string|null);
        }

        /** Represents an Error. */
        class Error implements IError {

            /**
             * Constructs a new Error.
             * @param [properties] Properties to set
             */
            constructor(properties?: anytype.WalletCreateR.IError);

            /** Error code. */
            public code: anytype.WalletCreateR.Error.Code;

            /** Error desc. */
            public desc: string;

            /**
             * Creates a new Error instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Error instance
             */
            public static create(properties?: anytype.WalletCreateR.IError): anytype.WalletCreateR.Error;

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.WalletCreateR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: anytype.WalletCreateR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.WalletCreateR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: anytype.WalletCreateR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.WalletCreateR.Error;

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.WalletCreateR.Error;

            /**
             * Verifies an Error message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Error
             */
            public static fromObject(object: { [k: string]: any }): anytype.WalletCreateR.Error;

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @param message Error
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: anytype.WalletCreateR.Error, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Error to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Error {

            /** Code enum. */
            enum Code {
                NULL = 0,
                UNKNOWN_ERROR = 1,
                BAD_INPUT = 2
            }
        }
    }

    /** Properties of a WalletLoginQ. */
    interface IWalletLoginQ {

        /** WalletLoginQ mnemonics */
        mnemonics?: (string|null);

        /** WalletLoginQ pin */
        pin?: (string|null);
    }

    /** Represents a WalletLoginQ. */
    class WalletLoginQ implements IWalletLoginQ {

        /**
         * Constructs a new WalletLoginQ.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IWalletLoginQ);

        /** WalletLoginQ mnemonics. */
        public mnemonics: string;

        /** WalletLoginQ pin. */
        public pin: string;

        /**
         * Creates a new WalletLoginQ instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WalletLoginQ instance
         */
        public static create(properties?: anytype.IWalletLoginQ): anytype.WalletLoginQ;

        /**
         * Encodes the specified WalletLoginQ message. Does not implicitly {@link anytype.WalletLoginQ.verify|verify} messages.
         * @param message WalletLoginQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IWalletLoginQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WalletLoginQ message, length delimited. Does not implicitly {@link anytype.WalletLoginQ.verify|verify} messages.
         * @param message WalletLoginQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IWalletLoginQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WalletLoginQ message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WalletLoginQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.WalletLoginQ;

        /**
         * Decodes a WalletLoginQ message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WalletLoginQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.WalletLoginQ;

        /**
         * Verifies a WalletLoginQ message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WalletLoginQ message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WalletLoginQ
         */
        public static fromObject(object: { [k: string]: any }): anytype.WalletLoginQ;

        /**
         * Creates a plain object from a WalletLoginQ message. Also converts values to other types if specified.
         * @param message WalletLoginQ
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.WalletLoginQ, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WalletLoginQ to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a WalletLoginR. */
    interface IWalletLoginR {

        /** WalletLoginR error */
        error?: (anytype.WalletLoginR.IError|null);

        /** WalletLoginR accounts */
        accounts?: (anytype.IAccounts|null);
    }

    /** Represents a WalletLoginR. */
    class WalletLoginR implements IWalletLoginR {

        /**
         * Constructs a new WalletLoginR.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IWalletLoginR);

        /** WalletLoginR error. */
        public error?: (anytype.WalletLoginR.IError|null);

        /** WalletLoginR accounts. */
        public accounts?: (anytype.IAccounts|null);

        /**
         * Creates a new WalletLoginR instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WalletLoginR instance
         */
        public static create(properties?: anytype.IWalletLoginR): anytype.WalletLoginR;

        /**
         * Encodes the specified WalletLoginR message. Does not implicitly {@link anytype.WalletLoginR.verify|verify} messages.
         * @param message WalletLoginR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IWalletLoginR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WalletLoginR message, length delimited. Does not implicitly {@link anytype.WalletLoginR.verify|verify} messages.
         * @param message WalletLoginR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IWalletLoginR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WalletLoginR message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WalletLoginR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.WalletLoginR;

        /**
         * Decodes a WalletLoginR message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WalletLoginR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.WalletLoginR;

        /**
         * Verifies a WalletLoginR message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WalletLoginR message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WalletLoginR
         */
        public static fromObject(object: { [k: string]: any }): anytype.WalletLoginR;

        /**
         * Creates a plain object from a WalletLoginR message. Also converts values to other types if specified.
         * @param message WalletLoginR
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.WalletLoginR, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WalletLoginR to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace WalletLoginR {

        /** Properties of an Error. */
        interface IError {

            /** Error code */
            code?: (anytype.WalletLoginR.Error.Code|null);

            /** Error desc */
            desc?: (string|null);
        }

        /** Represents an Error. */
        class Error implements IError {

            /**
             * Constructs a new Error.
             * @param [properties] Properties to set
             */
            constructor(properties?: anytype.WalletLoginR.IError);

            /** Error code. */
            public code: anytype.WalletLoginR.Error.Code;

            /** Error desc. */
            public desc: string;

            /**
             * Creates a new Error instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Error instance
             */
            public static create(properties?: anytype.WalletLoginR.IError): anytype.WalletLoginR.Error;

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.WalletLoginR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: anytype.WalletLoginR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.WalletLoginR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: anytype.WalletLoginR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.WalletLoginR.Error;

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.WalletLoginR.Error;

            /**
             * Verifies an Error message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Error
             */
            public static fromObject(object: { [k: string]: any }): anytype.WalletLoginR.Error;

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @param message Error
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: anytype.WalletLoginR.Error, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Error to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Error {

            /** Code enum. */
            enum Code {
                NULL = 0,
                UNKNOWN_ERROR = 1,
                BAD_INPUT = 2
            }
        }
    }

    /** Properties of an AccountCreateQ. */
    interface IAccountCreateQ {

        /** AccountCreateQ name */
        name?: (string|null);

        /** AccountCreateQ icon */
        icon?: (string|null);
    }

    /** Represents an AccountCreateQ. */
    class AccountCreateQ implements IAccountCreateQ {

        /**
         * Constructs a new AccountCreateQ.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IAccountCreateQ);

        /** AccountCreateQ name. */
        public name: string;

        /** AccountCreateQ icon. */
        public icon: string;

        /**
         * Creates a new AccountCreateQ instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountCreateQ instance
         */
        public static create(properties?: anytype.IAccountCreateQ): anytype.AccountCreateQ;

        /**
         * Encodes the specified AccountCreateQ message. Does not implicitly {@link anytype.AccountCreateQ.verify|verify} messages.
         * @param message AccountCreateQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IAccountCreateQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountCreateQ message, length delimited. Does not implicitly {@link anytype.AccountCreateQ.verify|verify} messages.
         * @param message AccountCreateQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IAccountCreateQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountCreateQ message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.AccountCreateQ;

        /**
         * Decodes an AccountCreateQ message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountCreateQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.AccountCreateQ;

        /**
         * Verifies an AccountCreateQ message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountCreateQ message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountCreateQ
         */
        public static fromObject(object: { [k: string]: any }): anytype.AccountCreateQ;

        /**
         * Creates a plain object from an AccountCreateQ message. Also converts values to other types if specified.
         * @param message AccountCreateQ
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.AccountCreateQ, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountCreateQ to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AccountCreateR. */
    interface IAccountCreateR {

        /** AccountCreateR error */
        error?: (anytype.AccountCreateR.IError|null);
    }

    /** Represents an AccountCreateR. */
    class AccountCreateR implements IAccountCreateR {

        /**
         * Constructs a new AccountCreateR.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IAccountCreateR);

        /** AccountCreateR error. */
        public error?: (anytype.AccountCreateR.IError|null);

        /**
         * Creates a new AccountCreateR instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountCreateR instance
         */
        public static create(properties?: anytype.IAccountCreateR): anytype.AccountCreateR;

        /**
         * Encodes the specified AccountCreateR message. Does not implicitly {@link anytype.AccountCreateR.verify|verify} messages.
         * @param message AccountCreateR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IAccountCreateR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountCreateR message, length delimited. Does not implicitly {@link anytype.AccountCreateR.verify|verify} messages.
         * @param message AccountCreateR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IAccountCreateR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountCreateR message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.AccountCreateR;

        /**
         * Decodes an AccountCreateR message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountCreateR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.AccountCreateR;

        /**
         * Verifies an AccountCreateR message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountCreateR message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountCreateR
         */
        public static fromObject(object: { [k: string]: any }): anytype.AccountCreateR;

        /**
         * Creates a plain object from an AccountCreateR message. Also converts values to other types if specified.
         * @param message AccountCreateR
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.AccountCreateR, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountCreateR to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace AccountCreateR {

        /** Properties of an Error. */
        interface IError {

            /** Error code */
            code?: (anytype.AccountCreateR.Error.Code|null);

            /** Error desc */
            desc?: (string|null);
        }

        /** Represents an Error. */
        class Error implements IError {

            /**
             * Constructs a new Error.
             * @param [properties] Properties to set
             */
            constructor(properties?: anytype.AccountCreateR.IError);

            /** Error code. */
            public code: anytype.AccountCreateR.Error.Code;

            /** Error desc. */
            public desc: string;

            /**
             * Creates a new Error instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Error instance
             */
            public static create(properties?: anytype.AccountCreateR.IError): anytype.AccountCreateR.Error;

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountCreateR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: anytype.AccountCreateR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountCreateR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: anytype.AccountCreateR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.AccountCreateR.Error;

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.AccountCreateR.Error;

            /**
             * Verifies an Error message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Error
             */
            public static fromObject(object: { [k: string]: any }): anytype.AccountCreateR.Error;

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @param message Error
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: anytype.AccountCreateR.Error, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Error to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Error {

            /** Code enum. */
            enum Code {
                NULL = 0,
                UNKNOWN_ERROR = 1,
                BAD_INPUT = 2
            }
        }
    }

    /** Properties of an AccountSelectQ. */
    interface IAccountSelectQ {

        /** AccountSelectQ id */
        id?: (string|null);
    }

    /** Represents an AccountSelectQ. */
    class AccountSelectQ implements IAccountSelectQ {

        /**
         * Constructs a new AccountSelectQ.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IAccountSelectQ);

        /** AccountSelectQ id. */
        public id: string;

        /**
         * Creates a new AccountSelectQ instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountSelectQ instance
         */
        public static create(properties?: anytype.IAccountSelectQ): anytype.AccountSelectQ;

        /**
         * Encodes the specified AccountSelectQ message. Does not implicitly {@link anytype.AccountSelectQ.verify|verify} messages.
         * @param message AccountSelectQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IAccountSelectQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountSelectQ message, length delimited. Does not implicitly {@link anytype.AccountSelectQ.verify|verify} messages.
         * @param message AccountSelectQ message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IAccountSelectQ, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountSelectQ message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountSelectQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.AccountSelectQ;

        /**
         * Decodes an AccountSelectQ message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountSelectQ
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.AccountSelectQ;

        /**
         * Verifies an AccountSelectQ message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountSelectQ message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountSelectQ
         */
        public static fromObject(object: { [k: string]: any }): anytype.AccountSelectQ;

        /**
         * Creates a plain object from an AccountSelectQ message. Also converts values to other types if specified.
         * @param message AccountSelectQ
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.AccountSelectQ, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountSelectQ to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AccountSelectR. */
    interface IAccountSelectR {

        /** AccountSelectR error */
        error?: (anytype.AccountSelectR.IError|null);
    }

    /** Represents an AccountSelectR. */
    class AccountSelectR implements IAccountSelectR {

        /**
         * Constructs a new AccountSelectR.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IAccountSelectR);

        /** AccountSelectR error. */
        public error?: (anytype.AccountSelectR.IError|null);

        /**
         * Creates a new AccountSelectR instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountSelectR instance
         */
        public static create(properties?: anytype.IAccountSelectR): anytype.AccountSelectR;

        /**
         * Encodes the specified AccountSelectR message. Does not implicitly {@link anytype.AccountSelectR.verify|verify} messages.
         * @param message AccountSelectR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IAccountSelectR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountSelectR message, length delimited. Does not implicitly {@link anytype.AccountSelectR.verify|verify} messages.
         * @param message AccountSelectR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IAccountSelectR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountSelectR message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountSelectR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.AccountSelectR;

        /**
         * Decodes an AccountSelectR message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountSelectR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.AccountSelectR;

        /**
         * Verifies an AccountSelectR message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountSelectR message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountSelectR
         */
        public static fromObject(object: { [k: string]: any }): anytype.AccountSelectR;

        /**
         * Creates a plain object from an AccountSelectR message. Also converts values to other types if specified.
         * @param message AccountSelectR
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.AccountSelectR, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountSelectR to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace AccountSelectR {

        /** Properties of an Error. */
        interface IError {

            /** Error code */
            code?: (anytype.AccountSelectR.Error.Code|null);

            /** Error desc */
            desc?: (string|null);
        }

        /** Represents an Error. */
        class Error implements IError {

            /**
             * Constructs a new Error.
             * @param [properties] Properties to set
             */
            constructor(properties?: anytype.AccountSelectR.IError);

            /** Error code. */
            public code: anytype.AccountSelectR.Error.Code;

            /** Error desc. */
            public desc: string;

            /**
             * Creates a new Error instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Error instance
             */
            public static create(properties?: anytype.AccountSelectR.IError): anytype.AccountSelectR.Error;

            /**
             * Encodes the specified Error message. Does not implicitly {@link anytype.AccountSelectR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: anytype.AccountSelectR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link anytype.AccountSelectR.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: anytype.AccountSelectR.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.AccountSelectR.Error;

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.AccountSelectR.Error;

            /**
             * Verifies an Error message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Error
             */
            public static fromObject(object: { [k: string]: any }): anytype.AccountSelectR.Error;

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @param message Error
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: anytype.AccountSelectR.Error, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Error to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Error {

            /** Code enum. */
            enum Code {
                NULL = 0,
                UNKNOWN_ERROR = 1,
                BAD_INPUT = 2
            }
        }
    }

    /** Properties of an Account. */
    interface IAccount {

        /** Account id */
        id?: (string|null);

        /** Account name */
        name?: (string|null);

        /** Account icon */
        icon?: (string|null);
    }

    /** Represents an Account. */
    class Account implements IAccount {

        /**
         * Constructs a new Account.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IAccount);

        /** Account id. */
        public id: string;

        /** Account name. */
        public name: string;

        /** Account icon. */
        public icon: string;

        /**
         * Creates a new Account instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Account instance
         */
        public static create(properties?: anytype.IAccount): anytype.Account;

        /**
         * Encodes the specified Account message. Does not implicitly {@link anytype.Account.verify|verify} messages.
         * @param message Account message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IAccount, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Account message, length delimited. Does not implicitly {@link anytype.Account.verify|verify} messages.
         * @param message Account message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IAccount, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Account message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.Account;

        /**
         * Decodes an Account message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.Account;

        /**
         * Verifies an Account message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Account message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Account
         */
        public static fromObject(object: { [k: string]: any }): anytype.Account;

        /**
         * Creates a plain object from an Account message. Also converts values to other types if specified.
         * @param message Account
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.Account, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Account to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an Accounts. */
    interface IAccounts {

        /** Accounts accounts */
        accounts?: (anytype.IAccount[]|null);
    }

    /** Represents an Accounts. */
    class Accounts implements IAccounts {

        /**
         * Constructs a new Accounts.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IAccounts);

        /** Accounts accounts. */
        public accounts: anytype.IAccount[];

        /**
         * Creates a new Accounts instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Accounts instance
         */
        public static create(properties?: anytype.IAccounts): anytype.Accounts;

        /**
         * Encodes the specified Accounts message. Does not implicitly {@link anytype.Accounts.verify|verify} messages.
         * @param message Accounts message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IAccounts, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Accounts message, length delimited. Does not implicitly {@link anytype.Accounts.verify|verify} messages.
         * @param message Accounts message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IAccounts, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Accounts message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Accounts
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.Accounts;

        /**
         * Decodes an Accounts message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Accounts
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.Accounts;

        /**
         * Verifies an Accounts message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Accounts message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Accounts
         */
        public static fromObject(object: { [k: string]: any }): anytype.Accounts;

        /**
         * Creates a plain object from an Accounts message. Also converts values to other types if specified.
         * @param message Accounts
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.Accounts, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Accounts to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a State. */
    interface IState {

        /** State docHeaders */
        docHeaders?: (anytype.IDocHeader[]|null);

        /** State currentDocId */
        currentDocId?: (string|null);
    }

    /** Represents a State. */
    class State implements IState {

        /**
         * Constructs a new State.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IState);

        /** State docHeaders. */
        public docHeaders: anytype.IDocHeader[];

        /** State currentDocId. */
        public currentDocId: string;

        /**
         * Creates a new State instance using the specified properties.
         * @param [properties] Properties to set
         * @returns State instance
         */
        public static create(properties?: anytype.IState): anytype.State;

        /**
         * Encodes the specified State message. Does not implicitly {@link anytype.State.verify|verify} messages.
         * @param message State message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IState, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified State message, length delimited. Does not implicitly {@link anytype.State.verify|verify} messages.
         * @param message State message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IState, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a State message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns State
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.State;

        /**
         * Decodes a State message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns State
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.State;

        /**
         * Verifies a State message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a State message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns State
         */
        public static fromObject(object: { [k: string]: any }): anytype.State;

        /**
         * Creates a plain object from a State message. Also converts values to other types if specified.
         * @param message State
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.State, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this State to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a DocHeader. */
    interface IDocHeader {

        /** DocHeader id */
        id?: (string|null);

        /** DocHeader name */
        name?: (string|null);

        /** DocHeader version */
        version?: (string|null);

        /** DocHeader icon */
        icon?: (string|null);
    }

    /** Represents a DocHeader. */
    class DocHeader implements IDocHeader {

        /**
         * Constructs a new DocHeader.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IDocHeader);

        /** DocHeader id. */
        public id: string;

        /** DocHeader name. */
        public name: string;

        /** DocHeader version. */
        public version: string;

        /** DocHeader icon. */
        public icon: string;

        /**
         * Creates a new DocHeader instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DocHeader instance
         */
        public static create(properties?: anytype.IDocHeader): anytype.DocHeader;

        /**
         * Encodes the specified DocHeader message. Does not implicitly {@link anytype.DocHeader.verify|verify} messages.
         * @param message DocHeader message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IDocHeader, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DocHeader message, length delimited. Does not implicitly {@link anytype.DocHeader.verify|verify} messages.
         * @param message DocHeader message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IDocHeader, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DocHeader message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DocHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.DocHeader;

        /**
         * Decodes a DocHeader message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DocHeader
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.DocHeader;

        /**
         * Verifies a DocHeader message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DocHeader message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DocHeader
         */
        public static fromObject(object: { [k: string]: any }): anytype.DocHeader;

        /**
         * Creates a plain object from a DocHeader message. Also converts values to other types if specified.
         * @param message DocHeader
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.DocHeader, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DocHeader to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Document. */
    interface IDocument {

        /** Document header */
        header?: (anytype.IDocHeader|null);

        /** Document blocks */
        blocks?: (anytype.IBlock[]|null);
    }

    /** Represents a Document. */
    class Document implements IDocument {

        /**
         * Constructs a new Document.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IDocument);

        /** Document header. */
        public header?: (anytype.IDocHeader|null);

        /** Document blocks. */
        public blocks: anytype.IBlock[];

        /**
         * Creates a new Document instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Document instance
         */
        public static create(properties?: anytype.IDocument): anytype.Document;

        /**
         * Encodes the specified Document message. Does not implicitly {@link anytype.Document.verify|verify} messages.
         * @param message Document message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IDocument, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Document message, length delimited. Does not implicitly {@link anytype.Document.verify|verify} messages.
         * @param message Document message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IDocument, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Document message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Document
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.Document;

        /**
         * Decodes a Document message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Document
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.Document;

        /**
         * Verifies a Document message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Document message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Document
         */
        public static fromObject(object: { [k: string]: any }): anytype.Document;

        /**
         * Creates a plain object from a Document message. Also converts values to other types if specified.
         * @param message Document
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.Document, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Document to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Text. */
    interface IText {

        /** Text content */
        content?: (string|null);

        /** Text marks */
        marks?: (anytype.IMark[]|null);

        /** Text contentType */
        contentType?: (anytype.ContentType|null);
    }

    /** Represents a Text. */
    class Text implements IText {

        /**
         * Constructs a new Text.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IText);

        /** Text content. */
        public content: string;

        /** Text marks. */
        public marks: anytype.IMark[];

        /** Text contentType. */
        public contentType: anytype.ContentType;

        /**
         * Creates a new Text instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Text instance
         */
        public static create(properties?: anytype.IText): anytype.Text;

        /**
         * Encodes the specified Text message. Does not implicitly {@link anytype.Text.verify|verify} messages.
         * @param message Text message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IText, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Text message, length delimited. Does not implicitly {@link anytype.Text.verify|verify} messages.
         * @param message Text message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IText, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Text message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Text
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.Text;

        /**
         * Decodes a Text message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Text
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.Text;

        /**
         * Verifies a Text message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Text message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Text
         */
        public static fromObject(object: { [k: string]: any }): anytype.Text;

        /**
         * Creates a plain object from a Text message. Also converts values to other types if specified.
         * @param message Text
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.Text, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Text to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Mark. */
    interface IMark {

        /** Mark type */
        type?: (anytype.MarkType|null);
    }

    /** Represents a Mark. */
    class Mark implements IMark {

        /**
         * Constructs a new Mark.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IMark);

        /** Mark type. */
        public type: anytype.MarkType;

        /**
         * Creates a new Mark instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Mark instance
         */
        public static create(properties?: anytype.IMark): anytype.Mark;

        /**
         * Encodes the specified Mark message. Does not implicitly {@link anytype.Mark.verify|verify} messages.
         * @param message Mark message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IMark, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Mark message, length delimited. Does not implicitly {@link anytype.Mark.verify|verify} messages.
         * @param message Mark message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IMark, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Mark message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Mark
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.Mark;

        /**
         * Decodes a Mark message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Mark
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.Mark;

        /**
         * Verifies a Mark message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Mark message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Mark
         */
        public static fromObject(object: { [k: string]: any }): anytype.Mark;

        /**
         * Creates a plain object from a Mark message. Also converts values to other types if specified.
         * @param message Mark
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.Mark, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Mark to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Block. */
    interface IBlock {

        /** Block id */
        id?: (string|null);

        /** Block text */
        text?: (anytype.IText|null);
    }

    /** Represents a Block. */
    class Block implements IBlock {

        /**
         * Constructs a new Block.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IBlock);

        /** Block id. */
        public id: string;

        /** Block text. */
        public text?: (anytype.IText|null);

        /** Block content. */
        public content?: "text";

        /**
         * Creates a new Block instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Block instance
         */
        public static create(properties?: anytype.IBlock): anytype.Block;

        /**
         * Encodes the specified Block message. Does not implicitly {@link anytype.Block.verify|verify} messages.
         * @param message Block message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Block message, length delimited. Does not implicitly {@link anytype.Block.verify|verify} messages.
         * @param message Block message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Block message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.Block;

        /**
         * Decodes a Block message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.Block;

        /**
         * Verifies a Block message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Block message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Block
         */
        public static fromObject(object: { [k: string]: any }): anytype.Block;

        /**
         * Creates a plain object from a Block message. Also converts values to other types if specified.
         * @param message Block
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.Block, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Block to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** StatusType enum. */
    enum StatusType {
        SUCCESS = 0,
        FAILURE = 1,
        WRONG_MNEMONIC = 2,
        NOT_FOUND = 3
    }

    /** MarkType enum. */
    enum MarkType {
        B = 0,
        I = 1,
        S = 2,
        KBD = 3,
        A = 4
    }

    /** ContentType enum. */
    enum ContentType {
        P = 0,
        CODE = 1,
        H_1 = 2,
        H_2 = 3,
        H_3 = 4,
        H_4 = 5,
        OL = 6,
        UL = 7,
        QUOTE = 8,
        TOGGLE = 9,
        CHECK = 10
    }

    /** BlockType enum. */
    enum BlockType {
        H_GRID = 0,
        V_GRID = 1,
        EDITABLE = 2,
        DIV = 3,
        VIDEO = 4,
        IMAGE = 5,
        PAGE = 6,
        NEW_PAGE = 7,
        BOOK_MARK = 8,
        FILE = 9,
        DATA_VIEW = 10
    }

    /** Properties of an Event. */
    interface IEvent {

        /** Event blockCreate */
        blockCreate?: (anytype.IBlockCreate|null);

        /** Event blockUpdate */
        blockUpdate?: (anytype.IBlockUpdate|null);

        /** Event blockRemove */
        blockRemove?: (anytype.IBlockRemove|null);
    }

    /** Represents an Event. */
    class Event implements IEvent {

        /**
         * Constructs a new Event.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IEvent);

        /** Event blockCreate. */
        public blockCreate?: (anytype.IBlockCreate|null);

        /** Event blockUpdate. */
        public blockUpdate?: (anytype.IBlockUpdate|null);

        /** Event blockRemove. */
        public blockRemove?: (anytype.IBlockRemove|null);

        /** Event message. */
        public message?: ("blockCreate"|"blockUpdate"|"blockRemove");

        /**
         * Creates a new Event instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Event instance
         */
        public static create(properties?: anytype.IEvent): anytype.Event;

        /**
         * Encodes the specified Event message. Does not implicitly {@link anytype.Event.verify|verify} messages.
         * @param message Event message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Event message, length delimited. Does not implicitly {@link anytype.Event.verify|verify} messages.
         * @param message Event message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Event message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Event
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.Event;

        /**
         * Decodes an Event message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Event
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.Event;

        /**
         * Verifies an Event message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Event message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Event
         */
        public static fromObject(object: { [k: string]: any }): anytype.Event;

        /**
         * Creates a plain object from an Event message. Also converts values to other types if specified.
         * @param message Event
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.Event, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Event to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BlockCreate. */
    interface IBlockCreate {

        /** BlockCreate id */
        id?: (string|null);

        /** BlockCreate docId */
        docId?: (string|null);

        /** BlockCreate pos */
        pos?: (number|null);
    }

    /** Represents a BlockCreate. */
    class BlockCreate implements IBlockCreate {

        /**
         * Constructs a new BlockCreate.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IBlockCreate);

        /** BlockCreate id. */
        public id: string;

        /** BlockCreate docId. */
        public docId: string;

        /** BlockCreate pos. */
        public pos: number;

        /**
         * Creates a new BlockCreate instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BlockCreate instance
         */
        public static create(properties?: anytype.IBlockCreate): anytype.BlockCreate;

        /**
         * Encodes the specified BlockCreate message. Does not implicitly {@link anytype.BlockCreate.verify|verify} messages.
         * @param message BlockCreate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IBlockCreate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BlockCreate message, length delimited. Does not implicitly {@link anytype.BlockCreate.verify|verify} messages.
         * @param message BlockCreate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IBlockCreate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BlockCreate message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BlockCreate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.BlockCreate;

        /**
         * Decodes a BlockCreate message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BlockCreate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.BlockCreate;

        /**
         * Verifies a BlockCreate message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BlockCreate message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BlockCreate
         */
        public static fromObject(object: { [k: string]: any }): anytype.BlockCreate;

        /**
         * Creates a plain object from a BlockCreate message. Also converts values to other types if specified.
         * @param message BlockCreate
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.BlockCreate, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BlockCreate to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BlockUpdate. */
    interface IBlockUpdate {

        /** BlockUpdate id */
        id?: (string|null);

        /** BlockUpdate docId */
        docId?: (string|null);
    }

    /** Represents a BlockUpdate. */
    class BlockUpdate implements IBlockUpdate {

        /**
         * Constructs a new BlockUpdate.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IBlockUpdate);

        /** BlockUpdate id. */
        public id: string;

        /** BlockUpdate docId. */
        public docId: string;

        /**
         * Creates a new BlockUpdate instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BlockUpdate instance
         */
        public static create(properties?: anytype.IBlockUpdate): anytype.BlockUpdate;

        /**
         * Encodes the specified BlockUpdate message. Does not implicitly {@link anytype.BlockUpdate.verify|verify} messages.
         * @param message BlockUpdate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IBlockUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BlockUpdate message, length delimited. Does not implicitly {@link anytype.BlockUpdate.verify|verify} messages.
         * @param message BlockUpdate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IBlockUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BlockUpdate message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BlockUpdate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.BlockUpdate;

        /**
         * Decodes a BlockUpdate message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BlockUpdate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.BlockUpdate;

        /**
         * Verifies a BlockUpdate message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BlockUpdate message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BlockUpdate
         */
        public static fromObject(object: { [k: string]: any }): anytype.BlockUpdate;

        /**
         * Creates a plain object from a BlockUpdate message. Also converts values to other types if specified.
         * @param message BlockUpdate
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.BlockUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BlockUpdate to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BlockRemove. */
    interface IBlockRemove {

        /** BlockRemove id */
        id?: (string|null);

        /** BlockRemove docId */
        docId?: (string|null);
    }

    /** Represents a BlockRemove. */
    class BlockRemove implements IBlockRemove {

        /**
         * Constructs a new BlockRemove.
         * @param [properties] Properties to set
         */
        constructor(properties?: anytype.IBlockRemove);

        /** BlockRemove id. */
        public id: string;

        /** BlockRemove docId. */
        public docId: string;

        /**
         * Creates a new BlockRemove instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BlockRemove instance
         */
        public static create(properties?: anytype.IBlockRemove): anytype.BlockRemove;

        /**
         * Encodes the specified BlockRemove message. Does not implicitly {@link anytype.BlockRemove.verify|verify} messages.
         * @param message BlockRemove message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: anytype.IBlockRemove, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BlockRemove message, length delimited. Does not implicitly {@link anytype.BlockRemove.verify|verify} messages.
         * @param message BlockRemove message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: anytype.IBlockRemove, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BlockRemove message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BlockRemove
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): anytype.BlockRemove;

        /**
         * Decodes a BlockRemove message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BlockRemove
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): anytype.BlockRemove;

        /**
         * Verifies a BlockRemove message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BlockRemove message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BlockRemove
         */
        public static fromObject(object: { [k: string]: any }): anytype.BlockRemove;

        /**
         * Creates a plain object from a BlockRemove message. Also converts values to other types if specified.
         * @param message BlockRemove
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: anytype.BlockRemove, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BlockRemove to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
