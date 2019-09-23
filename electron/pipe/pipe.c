#include <assert.h>
#include <stdlib.h>
#include <string.h>
#define NAPI_EXPERIMENTAL
#include <node_api.h>
#include <stdio.h>
#include "./lib.h"

// An item that will be generated from the thread, passed into JavaScript, and
// ultimately marked as resolved when the JavaScript passes it back into the
// addon instance with a return value.
typedef struct ThreadItem {
  // This field is read-only once set, so it need not be protected by the mutex.
  char * method;
  char * data;
  size_t data_length;
}
ThreadItem;

// The data associated with an instance of the addon. This takes the place of
// global static variables, while allowing multiple instances of the addon to
// co-exist.
typedef struct {
  napi_threadsafe_function tsfn;
  napi_ref thread_item_constructor;
  bool js_accepts;
}
AddonData;

// This function is responsible for converting the native data coming in from
// the secondary thread to JavaScript values, and for calling the JavaScript
// function. It may also be called with `env` and `js_cb` set to `NULL` when
// Node.js is terminating and there are items coming in from the secondary
// thread left to process. In that case, this function does nothing, since it is
// the secondary thread that frees the items.
static void CallJs(napi_env env, napi_value js_cb, void * context, void * data) {
  AddonData * addon_data = (AddonData * ) context;
  napi_value constructor;

  // The semantics of this example are such that, once the JavaScript returns
  // `false`, the `ThreadItem` structures can no longer be accessed, because the
  // thread terminates and frees them all. Thus, we record the instant when
  // JavaScript returns `false` by setting `addon_data->js_accepts` to `false`
  // in `RegisterReturnValue` below, and we use the value here to decide whether
  // the data coming in from the secondary thread is stale or not.
  if (addon_data->js_accepts && !(env == NULL || js_cb == NULL)) {
    napi_value undefined, js_thread_item;
    // Retrieve the JavaScript `undefined` value. This will serve as the `this`
    // value for the function call.
    assert(napi_get_undefined(env, &undefined) == napi_ok);

    // Retrieve the constructor for the JavaScript class from which the item
    // holding the native data will be constructed.
    assert(napi_get_reference_value(env,
      addon_data->thread_item_constructor,
      &constructor) == napi_ok);

    // Construct a new instance of the JavaScript class to hold the native item.
    assert(napi_new_instance(env,
      constructor,
      0,
      NULL,
      &js_thread_item) == napi_ok);

    // Associate the native item with the newly constructed JavaScript object.
    // We assume that the JavaScript side will eventually pass this JavaScript
    // object back to us via `RegisterReturnValue`, which will allow the
    // eventual deallocation of the native data. That's why we do not provide a
    // finalizer here.
    assert(napi_wrap(env, js_thread_item, data, NULL, NULL, NULL) == napi_ok);

    napi_status status;
    // Call the JavaScript function with the item as wrapped into an instance of
    // the JavaScript `ThreadItem` class and the prime.
    status = napi_call_function(env,
      undefined,
      js_cb,
      1,
      &js_thread_item,
      NULL);
    const napi_extended_error_info *result;                                                \

	napi_get_last_error_info(env, &result);                                                \
	printf("error : %s\n", result->error_message);              \

    printf("napi_call_function status %d\n", status);
  }
}

// When the thread is finished we join it to prevent memory leaks. We can safely
// set `addon_data->tsfn` to NULL, because the thread-safe function will be
// cleaned up in the background in response to the secondary thread having
// called `napi_release_threadsafe_function()`.
static void ThreadFinished(napi_env env, void * data, void * context) {
  (void) context;
  AddonData * addon_data = (AddonData * ) data;
  addon_data->tsfn = NULL;
}

// this func is sent to the go as a pointer and will be called from there
static void CallJsProxy(void * adata, char * method, char * data, int data_length) {
  // Pass the new item into JavaScript.
  ThreadItem * item = NULL;

  item = memset(malloc(sizeof( * item)), 0, sizeof( * item));
  item->method = method;
  item->data = data;
  item->data_length = (size_t) data_length;
  AddonData * addon_data = (AddonData * ) adata;

  assert(napi_call_threadsafe_function(addon_data->tsfn,
    item,
    napi_tsfn_nonblocking) == napi_ok);

}

// This binding can be called from JavaScript to start the asynchronous prime
// generator.
static napi_value SetEventHandlerProxy(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value js_cb, work_name;
  AddonData * addon_data;
  // The binding accepts one parameter - the JavaScript callback function to
  // call.
  assert(napi_get_cb_info(env,
    info, &
    argc, &
    js_cb,
    NULL,
    (void * ) &addon_data) == napi_ok);

  // We do not create a second thread if one is already running.
  assert(addon_data->tsfn == NULL && "Work already in progress");

  addon_data->js_accepts = true;

  // This string describes the asynchronous work.
  assert(napi_create_string_utf8(env,
    "Event handler",
    NAPI_AUTO_LENGTH, &
    work_name) == napi_ok);

  // The thread-safe function will be created with an unlimited queue and with
  // an initial thread count of 1. The secondary thread will release the
  // thread-safe function, decreasing its thread count to 0, thereby setting off
  // the process of cleaning up the thread-safe function.
  assert(napi_create_threadsafe_function(env,
    js_cb,
    NULL,
    work_name,
    0,
    1,
    addon_data,
    ThreadFinished,
    addon_data,
    CallJs,
    &addon_data->tsfn) == napi_ok);

  SetEventHandler((void*) addon_data);
  SetProxyFunc(CallJsProxy);
  return NULL;
}

static bool
is_thread_item(napi_env env, napi_ref constructor_ref, napi_value value) {
  bool validate;
  napi_value constructor;
  assert(napi_get_reference_value(env,
    constructor_ref, &
    constructor) == napi_ok);
  assert(napi_instanceof(env, value, constructor, &validate) == napi_ok);
  return validate;
}

// Constructor for instances of the `ThreadItem` class. This doesn't need to do
// anything since all we want the class for is to be able to type-check
// JavaScript objects that carry within them a pointer to a native `ThreadItem`
// structure.
static napi_value ThreadItemConstructor(napi_env env, napi_callback_info info) {
  return NULL;
}

// Getter for the `data` property of the `ThreadItem` class.
static napi_value GetData(napi_env env, napi_callback_info info) {
  napi_value jsthis, data_property;
  AddonData * ad;
  assert(napi_ok == napi_get_cb_info(env, info, 0, 0, &jsthis, (void * ) &ad));
  assert(is_thread_item(env, ad->thread_item_constructor, jsthis));
  ThreadItem * item;
  assert(napi_ok == napi_unwrap(env, jsthis, (void ** ) &item));
  assert(napi_ok == napi_create_external_buffer(env, item->data_length, item->data, NULL, NULL, &data_property));
  return data_property;
}

// Getter for the `method` property of the `ThreadItem` class.
static napi_value GetMethod(napi_env env, napi_callback_info info) {
  napi_value jsthis, method_property;
  AddonData * ad;
  assert(napi_ok == napi_get_cb_info(env, info, 0, 0, &jsthis, (void * ) &ad));
  assert(is_thread_item(env, ad->thread_item_constructor, jsthis));
  ThreadItem * item;
  assert(napi_ok == napi_unwrap(env, jsthis, (void ** ) &item));
  assert(napi_ok == napi_create_string_utf8(env, item->method, NAPI_AUTO_LENGTH, &method_property));
  return method_property;
}

static void addon_is_unloading(napi_env env, void * data, void * hint) {
  AddonData * addon_data = (AddonData * ) data;
  assert(napi_delete_reference(env,
    addon_data->thread_item_constructor) == napi_ok);
  free(data);
}


// Runs command in Go code
static napi_value SendCommand(napi_env env, napi_callback_info info) {
  AddonData * addon_data =
    memset(malloc(sizeof( * addon_data)), 0, sizeof( * addon_data));

  // Attach the addon data to the exports object to ensure that they are
  // destroyed together.
  /*assert(napi_wrap(env,
    exports,
    addon_data,
    addon_is_unloading,
    NULL,
    NULL) == napi_ok);*/

  napi_value thread_item_class;
  napi_property_descriptor thread_item_properties[] = {
    {
      "method",
      0,
      0,
      GetMethod,
      0,
      0,
      napi_enumerable,
      addon_data
    },
    {
      "data",
      0,
      0,
      GetData,
      0,
      0,
      napi_enumerable,
      addon_data
    }
  };

  assert(napi_define_class(env,
    "ThreadItem",
    NAPI_AUTO_LENGTH,
    ThreadItemConstructor,
    addon_data,
    2,
    thread_item_properties, &
    thread_item_class) == napi_ok);

  assert(napi_create_reference(env,
      thread_item_class,
      1,
      &(addon_data->thread_item_constructor)) ==
    napi_ok);

  napi_status status;

  size_t argc = 3;
  napi_value argv[3];
  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  assert(status == napi_ok);

  addon_data->js_accepts = true;

  if (argc < 3) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments");
    return NULL;
  }

  napi_valuetype valuetype0;

  status = napi_typeof(env, argv[0], &valuetype0);
  assert(status == napi_ok);
//	printf("status0 %d, %d==%d\n", status, valuetype0, napi_string);

  napi_valuetype valuetype1;
  status = napi_typeof(env, argv[1], &valuetype1);
  assert(status == napi_ok);
	//printf("status1 %d, %d==%d\n", status, valuetype1, napi_object);

  napi_valuetype valuetype2;
  status = napi_typeof(env, argv[2], &valuetype2);
 assert(status == napi_ok);
	//printf("status2 %d, %d==%d \n", status, valuetype2, napi_function);

  if (valuetype0 != napi_string || valuetype1 != napi_object || valuetype2 != napi_function ) {
    napi_throw_type_error(env, NULL, "Wrong arguments");
    return NULL;
  }

  size_t command_size;
  assert(napi_get_value_string_utf8(env, argv[0], NULL, 0, &command_size) == napi_ok);
  char *command = malloc(command_size+1);
  assert(napi_get_value_string_utf8(env, argv[0], command, command_size+1, NULL) == napi_ok);

  size_t data_size;
  status = napi_get_buffer_info(env, argv[1], NULL, &data_size);
  assert(status == napi_ok);

  void* data = malloc(data_size+1);
  status = napi_get_buffer_info(env, argv[1], &data, NULL);

  char *name;
  int size = asprintf(&name, "Callback for %s", command);
  napi_value work_name;
  assert(napi_create_string_utf8(env,
    name,
    size, &
    work_name) == napi_ok);
  	//printf("SendCommand: %s %s %p\n", command, data, &addon_data->tsfn );

  assert(napi_create_threadsafe_function(env,
    argv[2],
    NULL,
    work_name,
    0,
    1,
    addon_data,
    ThreadFinished,
    addon_data,
    CallJs,
    &addon_data->tsfn) == napi_ok);

  //napi_create_reference(env, args[1], 1, &value1ref);

  Command(command, data, data_size, addon_data);
  return NULL;
}

// Initialize an instance of this addon. This function may be called multiple
// times if multiple instances of Node.js are running on multiple threads, or if
// there are multiple Node.js contexts running on the same thread. The return
// value and the formal parameters in comments remind us that the function body
// that follows, within which we initialize the addon, has available to it the
// variables named in the formal parameters, and that it must return a
// `napi_value`.
/*napi_value*/
NAPI_MODULE_INIT( /*napi_env env, napi_value exports*/ ) {
  // Create the native data that will be associated with this instance of the
  // addon.
  AddonData * addon_data =
    memset(malloc(sizeof( * addon_data)), 0, sizeof( * addon_data));

  // Attach the addon data to the exports object to ensure that they are
  // destroyed together.
  assert(napi_wrap(env,
    exports,
    addon_data,
    addon_is_unloading,
    NULL,
    NULL) == napi_ok);

  // Initialize the various members of the `AddonData` associated with this
  // addon instance.
  napi_value thread_item_class;
  napi_property_descriptor thread_item_properties[] = {
    {
      "method",
      0,
      0,
      GetMethod,
      0,
      0,
      napi_enumerable,
      addon_data
    },
    {
      "data",
      0,
      0,
      GetData,
      0,
      0,
      napi_enumerable,
      addon_data
    }
  };

  assert(napi_define_class(env,
    "ThreadItem",
    NAPI_AUTO_LENGTH,
    ThreadItemConstructor,
    addon_data,
    2,
    thread_item_properties, &
    thread_item_class) == napi_ok);

  assert(napi_create_reference(env,
      thread_item_class,
      1,
      &(addon_data->thread_item_constructor)) ==
    napi_ok);

  // Expose the two bindings this addon provides.
  napi_property_descriptor export_properties[] = {
    {
      "sendCommand",
      NULL,
      SendCommand,
      NULL,
      NULL,
      NULL,
      napi_default,
      NULL
    },
    {
      "setEventHandler",
      NULL,
      SetEventHandlerProxy,
      NULL,
      NULL,
      NULL,
      napi_default,
      addon_data
    }
  };

  assert(napi_define_properties(env,
    exports,
    sizeof(export_properties) /
    sizeof(export_properties[0]),
    export_properties) == napi_ok);

  return exports;
}
