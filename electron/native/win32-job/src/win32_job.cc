#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <node_api.h>
#include <sstream>
#include <string>

struct JobWrapper {
    HANDLE handle;
    bool closed;
};

static void ThrowWindowsError(napi_env env, const char* context) {
    DWORD code = GetLastError();
    std::string message;

    LPWSTR wideMessage = nullptr;
    DWORD flags = FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS;
    DWORD length = FormatMessageW(flags, nullptr, code, MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), reinterpret_cast<LPWSTR>(&wideMessage), 0, nullptr);

    if (length && wideMessage) {
        int utf8Size = WideCharToMultiByte(CP_UTF8, 0, wideMessage, static_cast<int>(length), nullptr, 0, nullptr, nullptr);
        if (utf8Size > 0) {
            std::string utf8(utf8Size, 0);
            WideCharToMultiByte(CP_UTF8, 0, wideMessage, static_cast<int>(length), utf8.data(), utf8Size, nullptr, nullptr);
            message = utf8;
        }
        LocalFree(wideMessage);
    }

    std::ostringstream stream;
    stream << context << " failed with error " << code;
    if (!message.empty()) {
        stream << ": " << message;
    }

    napi_throw_error(env, nullptr, stream.str().c_str());
}

static void FinalizeJob(napi_env env, void* data, void* /*hint*/) {
    JobWrapper* wrapper = static_cast<JobWrapper*>(data);
    if (!wrapper) {
        return;
    }

    if (!wrapper->closed && wrapper->handle) {
        CloseHandle(wrapper->handle);
        wrapper->handle = nullptr;
    }

    delete wrapper;
}

static napi_value CreateJob(napi_env env, napi_callback_info info) {
    (void)info;

    HANDLE job = CreateJobObjectW(nullptr, nullptr);
    if (!job) {
        ThrowWindowsError(env, "CreateJobObjectW");
        return nullptr;
    }

    JOBOBJECT_EXTENDED_LIMIT_INFORMATION limitInfo = {};
    limitInfo.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

    if (!SetInformationJobObject(job, JobObjectExtendedLimitInformation, &limitInfo, sizeof(limitInfo))) {
        DWORD error = GetLastError();
        CloseHandle(job);
        SetLastError(error);
        ThrowWindowsError(env, "SetInformationJobObject");
        return nullptr;
    }

    JobWrapper* wrapper = new JobWrapper{ job, false };
    napi_value external = nullptr;
    napi_status status = napi_create_external(env, wrapper, FinalizeJob, nullptr, &external);

    if (status != napi_ok) {
        delete wrapper;
        CloseHandle(job);
        napi_throw_error(env, nullptr, "Failed to wrap job handle");
        return nullptr;
    }

    return external;
}

static napi_value AssignProcess(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_status status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to read arguments");
        return nullptr;
    }

    if (argc < 2) {
        napi_throw_type_error(env, nullptr, "Expected job handle and pid");
        return nullptr;
    }

    JobWrapper* wrapper = nullptr;
    status = napi_get_value_external(env, args[0], reinterpret_cast<void**>(&wrapper));
    if (status != napi_ok || !wrapper || !wrapper->handle) {
        napi_throw_type_error(env, nullptr, "Invalid job handle");
        return nullptr;
    }

    if (wrapper->closed) {
        napi_throw_error(env, nullptr, "Job handle already closed");
        return nullptr;
    }

    uint32_t pid = 0;
    status = napi_get_value_uint32(env, args[1], &pid);
    if (status != napi_ok) {
        napi_throw_type_error(env, nullptr, "PID must be an unsigned integer");
        return nullptr;
    }

    HANDLE process = OpenProcess(PROCESS_TERMINATE | PROCESS_SET_QUOTA | PROCESS_QUERY_INFORMATION, FALSE, pid);
    if (!process) {
        ThrowWindowsError(env, "OpenProcess");
        return nullptr;
    }

    if (!AssignProcessToJobObject(wrapper->handle, process)) {
        DWORD error = GetLastError();
        CloseHandle(process);
        SetLastError(error);
        ThrowWindowsError(env, "AssignProcessToJobObject");
        return nullptr;
    }

    CloseHandle(process);

    napi_value result = nullptr;
    napi_status status = napi_get_undefined(env, &result);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to get undefined result");
        return nullptr;
    }
    return result;
}

static napi_value CloseJob(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_status status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to read arguments");
        return nullptr;
    }

    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Expected job handle");
        return nullptr;
    }

    JobWrapper* wrapper = nullptr;
    status = napi_get_value_external(env, args[0], reinterpret_cast<void**>(&wrapper));
    if (status != napi_ok || !wrapper) {
        napi_throw_type_error(env, nullptr, "Invalid job handle");
        return nullptr;
    }

    if (!wrapper->closed && wrapper->handle) {
        CloseHandle(wrapper->handle);
        wrapper->handle = nullptr;
        wrapper->closed = true;
    }

    napi_value result = nullptr;
    napi_status undefStatus = napi_get_undefined(env, &result);
    if (undefStatus != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to get undefined result");
        return nullptr;
    }
    return result;
}

static napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor descriptors[] = {
        { "createJob", nullptr, CreateJob, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "assignProcess", nullptr, AssignProcess, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "closeJob", nullptr, CloseJob, nullptr, nullptr, nullptr, napi_default, nullptr }
    };

    napi_status status = napi_define_properties(env, exports, sizeof(descriptors) / sizeof(descriptors[0]), descriptors);
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to define exports");
        return nullptr;
    }
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)

#else
#include <node_api.h>

static napi_value Init(napi_env env, napi_value exports) {
    napi_throw_error(env, nullptr, "win32 job object addon is only available on Windows");
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
#endif
