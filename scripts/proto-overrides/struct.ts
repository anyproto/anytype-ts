// Hand-optimized override of the ts-proto generated google/protobuf/struct.ts.
// Maintained at scripts/proto-overrides/struct.ts and copied over the generated file
// by scripts/generate-protos.sh — do not edit middleware/google/protobuf/struct.ts directly.
//
// Why: Struct/Value decode is the hottest protobuf path in the app — every relation value
// of every record (ObjectSearch, ObjectSearchSubscribe, ObjectDetailsSet/Amend, ObjectShow
// details) goes through it. The stock ts-proto codegen allocates a transient Value wrapper
// per value and a Struct_FieldsEntry object per field, then copies the whole fields object
// again in Struct.unwrap. This version decodes values straight into plain JS objects/arrays
// and makes wrap/unwrap zero-copy. Wire format is unchanged.
//
// Kept in sync with: protoc-gen-ts_proto v2.11.5 output for google/protobuf/struct.proto
// (options: outputJsonMethods=false,initializeFieldsAsUndefined=false).

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";

export const protobufPackage = "google.protobuf";

/**
 * Represents a JSON `null`.
 *
 * `NullValue` is a sentinel, using an enum with only one value to represent
 * the null value for the `Value` type union.
 */
export enum NullValue {
  /** NULL_VALUE - Null value. */
  NULL_VALUE = 0,
  UNRECOGNIZED = -1,
}

/**
 * Represents a JSON object.
 *
 * An unordered map of dynamically typed values.
 */
export interface Struct {
  /** Unordered map of dynamically typed values. */
  fields: { [key: string]: any | undefined };
}

export interface Struct_FieldsEntry {
  key: string;
  value: any | undefined;
}

/**
 * Represents a JSON value.
 *
 * `Value` represents a dynamically typed value which can be either
 * null, a number, a string, a boolean, a recursive struct value, or a
 * list of values.
 */
export interface Value {
  /** Represents a JSON `null`. */
  nullValue?: NullValue | undefined;
  /** Represents a JSON number. */
  numberValue?: number | undefined;
  /** Represents a JSON string. */
  stringValue?: string | undefined;
  /** Represents a JSON boolean (`true` or `false` literal in JSON). */
  boolValue?: boolean | undefined;
  /** Represents a JSON object. */
  structValue?: { [key: string]: any } | undefined;
  /** Represents a JSON array. */
  listValue?: Array<any> | undefined;
}

/** Represents a JSON array. */
export interface ListValue {
  /** Repeated field of dynamically typed values. */
  values: any[];
}

/**
 * Decode a Value message body directly to its unwrapped JS representation
 * (string | number | boolean | object | array | null), skipping the transient
 * Value wrapper object. A valid proto3 oneof carries exactly one variant;
 * if the message is empty, `undefined` is returned (same as Value.unwrap on
 * an empty Value). Invalid multi-variant Values resolve last-field-wins in
 * wire order (the generated Value.unwrap used a fixed priority order) —
 * conformant encoders never emit more than one variant.
 */
function decodeValueUnwrapped(reader: BinaryReader, length: number): any {
  const end = reader.pos + length;
  let result: any = undefined;
  while (reader.pos < end) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1: {
        if (tag !== 8) {
          break;
        }

        reader.int32();
        result = null;
        continue;
      }
      case 2: {
        if (tag !== 17) {
          break;
        }

        result = reader.double();
        continue;
      }
      case 3: {
        if (tag !== 26) {
          break;
        }

        result = reader.string();
        continue;
      }
      case 4: {
        if (tag !== 32) {
          break;
        }

        result = reader.bool();
        continue;
      }
      case 5: {
        if (tag !== 42) {
          break;
        }

        result = decodeStructFields(reader, reader.uint32());
        continue;
      }
      case 6: {
        if (tag !== 50) {
          break;
        }

        result = decodeListValues(reader, reader.uint32());
        continue;
      }
    }
    if ((tag & 7) === 4 || tag === 0) {
      break;
    }
    reader.skip(tag & 7);
  }
  return result;
}

/**
 * Decode a Struct message body directly into a plain object, inlining the
 * Struct_FieldsEntry parsing so no per-field entry objects are allocated.
 */
function decodeStructFields(reader: BinaryReader, length: number): { [key: string]: any } {
  const end = reader.pos + length;
  const fields: { [key: string]: any } = {};
  while (reader.pos < end) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1: {
        if (tag !== 10) {
          break;
        }

        // Inlined Struct_FieldsEntry: field 1 = key (string), field 2 = value (Value).
        const entryEnd = reader.uint32() + reader.pos;
        let key = "";
        let value: any = undefined;
        while (reader.pos < entryEnd) {
          const entryTag = reader.uint32();
          switch (entryTag >>> 3) {
            case 1: {
              if (entryTag !== 10) {
                break;
              }

              key = reader.string();
              continue;
            }
            case 2: {
              if (entryTag !== 18) {
                break;
              }

              value = decodeValueUnwrapped(reader, reader.uint32());
              continue;
            }
          }
          if ((entryTag & 7) === 4 || entryTag === 0) {
            break;
          }
          reader.skip(entryTag & 7);
        }
        // Guard the `__proto__` setter: a wire key of "__proto__" carrying an object
        // value would otherwise mutate the returned object's prototype. The generated
        // codec effectively dropped such entries via its copying unwrap; match that.
        if (value !== undefined && key !== "__proto__") {
          fields[key] = value;
        }
        continue;
      }
    }
    if ((tag & 7) === 4 || tag === 0) {
      break;
    }
    reader.skip(tag & 7);
  }
  return fields;
}

/**
 * Decode a ListValue message body directly into a plain array.
 */
function decodeListValues(reader: BinaryReader, length: number): any[] {
  const end = reader.pos + length;
  const values: any[] = [];
  while (reader.pos < end) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1: {
        if (tag !== 10) {
          break;
        }

        values.push(decodeValueUnwrapped(reader, reader.uint32()));
        continue;
      }
    }
    if ((tag & 7) === 4 || tag === 0) {
      break;
    }
    reader.skip(tag & 7);
  }
  return values;
}

/**
 * Encode an unwrapped JS value as the body of a Value message (no framing),
 * skipping the transient Value wrapper of Value.wrap + Value.encode.
 * `undefined` encodes as an empty Value message, matching Value.wrap.
 */
function encodeValueUnwrapped(value: any, writer: BinaryWriter): void {
  if (value === null) {
    writer.uint32(8).int32(NullValue.NULL_VALUE);
  } else if (typeof value === "boolean") {
    writer.uint32(32).bool(value);
  } else if (typeof value === "number") {
    writer.uint32(17).double(value);
  } else if (typeof value === "string") {
    writer.uint32(26).string(value);
  } else if (globalThis.Array.isArray(value)) {
    writer.uint32(50).fork();
    for (const v of value) {
      writer.uint32(10).fork();
      encodeValueUnwrapped(v, writer);
      writer.join();
    }
    writer.join();
  } else if (typeof value === "object") {
    writer.uint32(42).fork();
    encodeStructFields(value, writer);
    writer.join();
  } else if (typeof value !== "undefined") {
    throw new globalThis.Error("Unsupported any value type: " + typeof value);
  }
}

/**
 * Encode a plain object as the body of a Struct message (no framing),
 * inlining Struct_FieldsEntry so no per-field entry objects are allocated.
 */
function encodeStructFields(fields: { [key: string]: any }, writer: BinaryWriter): void {
  // Object.keys: own enumerable keys only, matching the generated Object.entries
  // behavior (for...in would also serialize inherited enumerable properties).
  for (const key of globalThis.Object.keys(fields)) {
    const value = fields[key];
    if (value !== undefined) {
      writer.uint32(10).fork();
      if (key !== "") {
        writer.uint32(10).string(key);
      }
      writer.uint32(18).fork();
      encodeValueUnwrapped(value, writer);
      writer.join();
      writer.join();
    }
  }
}

export const Struct: MessageFns<Struct> & StructWrapperFns = {
  encode(message: Struct, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    encodeStructFields(message.fields ?? {}, writer);
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Struct {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const len = length === undefined ? reader.len - reader.pos : length;
    return { fields: decodeStructFields(reader, len) };
  },

  create<I extends Exact<DeepPartial<Struct>, I>>(base?: I): Struct {
    return Struct.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Struct>, I>>(object: I): Struct {
    const fields: { [key: string]: any | undefined } = {};
    const source = object.fields ?? {};
    for (const key in source) {
      const value = (source as { [key: string]: any | undefined })[key];
      if (value !== undefined) {
        fields[key] = value;
      }
    }
    return { fields };
  },

  // Zero-copy: the fields object is only ever read by encode, never mutated.
  wrap(object: { [key: string]: any } | undefined): Struct {
    return { fields: object ?? {} };
  },

  // Zero-copy: decode builds a fresh fields object, so sharing it is safe.
  unwrap(message: Struct): { [key: string]: any } {
    return message.fields ?? {};
  },
};

export const Struct_FieldsEntry: MessageFns<Struct_FieldsEntry> = {
  encode(message: Struct_FieldsEntry, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      writer.uint32(18).fork();
      encodeValueUnwrapped(message.value, writer);
      writer.join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Struct_FieldsEntry {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message: Struct_FieldsEntry = { key: "", value: undefined };
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.value = decodeValueUnwrapped(reader, reader.uint32());
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<Struct_FieldsEntry>, I>>(base?: I): Struct_FieldsEntry {
    return Struct_FieldsEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Struct_FieldsEntry>, I>>(object: I): Struct_FieldsEntry {
    return { key: object.key ?? "", value: object.value ?? undefined };
  },
};

function createBaseValue(): Value {
  return {};
}

export const Value: MessageFns<Value> & AnyValueWrapperFns = {
  encode(message: Value, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.nullValue !== undefined) {
      writer.uint32(8).int32(message.nullValue);
    }
    if (message.numberValue !== undefined) {
      writer.uint32(17).double(message.numberValue);
    }
    if (message.stringValue !== undefined) {
      writer.uint32(26).string(message.stringValue);
    }
    if (message.boolValue !== undefined) {
      writer.uint32(32).bool(message.boolValue);
    }
    if (message.structValue !== undefined) {
      writer.uint32(42).fork();
      encodeStructFields(message.structValue, writer);
      writer.join();
    }
    if (message.listValue !== undefined) {
      writer.uint32(50).fork();
      for (const v of message.listValue) {
        writer.uint32(10).fork();
        encodeValueUnwrapped(v, writer);
        writer.join();
      }
      writer.join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Value {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 8) {
            break;
          }

          message.nullValue = reader.int32() as any;
          continue;
        }
        case 2: {
          if (tag !== 17) {
            break;
          }

          message.numberValue = reader.double();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.stringValue = reader.string();
          continue;
        }
        case 4: {
          if (tag !== 32) {
            break;
          }

          message.boolValue = reader.bool();
          continue;
        }
        case 5: {
          if (tag !== 42) {
            break;
          }

          message.structValue = decodeStructFields(reader, reader.uint32());
          continue;
        }
        case 6: {
          if (tag !== 50) {
            break;
          }

          message.listValue = decodeListValues(reader, reader.uint32());
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  create<I extends Exact<DeepPartial<Value>, I>>(base?: I): Value {
    return Value.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Value>, I>>(object: I): Value {
    const message = createBaseValue();
    message.nullValue = object.nullValue ?? undefined;
    message.numberValue = object.numberValue ?? undefined;
    message.stringValue = object.stringValue ?? undefined;
    message.boolValue = object.boolValue ?? undefined;
    message.structValue = object.structValue ?? undefined;
    message.listValue = object.listValue ?? undefined;
    return message;
  },

  wrap(value: any): Value {
    const result = createBaseValue();
    if (value === null) {
      result.nullValue = NullValue.NULL_VALUE;
    } else if (typeof value === "boolean") {
      result.boolValue = value;
    } else if (typeof value === "number") {
      result.numberValue = value;
    } else if (typeof value === "string") {
      result.stringValue = value;
    } else if (globalThis.Array.isArray(value)) {
      result.listValue = value;
    } else if (typeof value === "object") {
      result.structValue = value;
    } else if (typeof value !== "undefined") {
      throw new globalThis.Error("Unsupported any value type: " + typeof value);
    }
    return result;
  },

  unwrap(message: any): string | number | boolean | Object | null | Array<any> | undefined {
    if (message.stringValue !== undefined) {
      return message.stringValue;
    } else if (message?.numberValue !== undefined) {
      return message.numberValue;
    } else if (message?.boolValue !== undefined) {
      return message.boolValue;
    } else if (message?.structValue !== undefined) {
      return message.structValue as any;
    } else if (message?.listValue !== undefined) {
      return message.listValue;
    } else if (message?.nullValue !== undefined) {
      return null;
    }
    return undefined;
  },
};

export const ListValue: MessageFns<ListValue> & ListValueWrapperFns = {
  encode(message: ListValue, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.values) {
      writer.uint32(10).fork();
      encodeValueUnwrapped(v, writer);
      writer.join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ListValue {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const len = length === undefined ? reader.len - reader.pos : length;
    return { values: decodeListValues(reader, len) };
  },

  create<I extends Exact<DeepPartial<ListValue>, I>>(base?: I): ListValue {
    return ListValue.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListValue>, I>>(object: I): ListValue {
    return { values: object.values?.map((e) => e) || [] };
  },

  // Zero-copy: the values array is only ever read by encode, never mutated.
  wrap(array: Array<any> | undefined): ListValue {
    return { values: array ?? [] };
  },

  // Zero-copy: decode builds a fresh values array, so sharing it is safe.
  unwrap(message: ListValue): Array<any> {
    if (message?.hasOwnProperty("values") && globalThis.Array.isArray(message.values)) {
      return message.values;
    } else {
      return message as any;
    }
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

export interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
  fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}

export interface StructWrapperFns {
  wrap(object: { [key: string]: any } | undefined): Struct;
  unwrap(message: Struct): { [key: string]: any };
}

export interface AnyValueWrapperFns {
  wrap(value: any): Value;
  unwrap(message: any): string | number | boolean | Object | null | Array<any> | undefined;
}

export interface ListValueWrapperFns {
  wrap(array: Array<any> | undefined): ListValue;
  unwrap(message: ListValue): Array<any>;
}
