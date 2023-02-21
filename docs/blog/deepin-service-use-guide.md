---
title: Deepin 服务框架使用指南
date: 2023-01-18 09:16:12
tags:
  - Linux
  - Service
categories:
  - Deepin
cover: https://pic.3gbizhi.com/2019/0912/20190912025701205.jpg
feature: false
---
# {{ $frontmatter.title }}

本篇文章将介绍 Deepin 后端服务框架如何使用，主要实现两个部分：一个接口，一个配置。

## 概述和用法

### 核心功能

- 插件服务，把服务以一个插件方式加载运行
- dbus 接口私有化（接口隐藏、接口白名单）
- dbus 插件服务的按需启动
- 独立应用的 dbus 接口私有化 sdk

### 服务加载插件流程

1. 如图所示，deepin-service-manager 由 systemd 服务拉起来；
2. service 起来后读取所有的 json 配置文件，根据配置文件进行分组；
3. 按照分好的组通过 systemd 启动子进程实例，并传入组名；
4. 子进程启动，按照传入的组名进行过滤，注册该组的服务，并且根据配置文件（Resident、OnDemand）决定是否立即加载 so 插件。

### 普通插件开发

#### 提供配置文件

```json
{
  "name": "org.deepin.service.demo", // [必选]dbus name，框架中会注册该name
  "libPath": "demo.so", // [必选]插件so名称
  "group": "core", // [可选]插件按进程分组，默认分组为 core
  "pluginType": "qt", // [可选]插件类型，暂时只有 qt 和 sd 两种，默认为 qt
  "policyVersion": "1.0", // [可选]配置文件版本，预留配置，无实际用途
  "policyStartType": "Resident", // [可选]启动方式，Resident（常驻）、OnDemand（按需启动）。默认Resident。
  "dependencies": [], // [可选]若依赖其他服务，可将服务名填在此处，在依赖启动之前不会启动此服务
  "startDelay": 0, // [可选]若需要延时启动，可将延时时间填在此处，单位为秒
  "idleTime": 10 // [可选]若服务是按需启动，则可以设置闲时时间，超时则会卸载服务
}
```

>配置文件中必选字段为必须要填写字段，否则插件无法正常启动，可选字段可视情况选择填写即可！

配置文件安装路径规则：

1. qdbus/sdbus

    **system**:

    ```shell
    /usr/share/deepin-service-manager/system/demo.json
    ```

    **session**:

    ```shell
    /usr/share/deepin-service-manager/user/demo.json
    ```

2. sdk

    目前只实现了 Qt 的 SDK 实现方式：

    ```shell
    /usr/share/deepin-service-manager/other/demo.json
    ```

#### 实现入口函数

1. qdbus

    ```cpp
    #include <QDBusConnection>
    #include "service.h" // 实现的dbusobject，基本支持qdbus原规则

    static Service *service = nullptr;

    // name:dbus name,配置文件中的"name"，
    // data:自定义数据
    extern "C" int DSMRegister(const char *name, void *data)
    {
        (void)data;
        service = new Service();
        QDBusConnection::RegisterOptions opts =
            QDBusConnection::ExportAllSlots | QDBusConnection::ExportAllSignals |
            QDBusConnection::ExportAllProperties;

        QDBusConnection::connectToBus(QDBusConnection::SessionBus, QString(name))
            .registerObject("/org/deepin/services/demo1", service, opts);
        return 0;
    }

    // 插件卸载时，若需要释放资源请在此实现
    extern "C" int DSMUnRegister(const char *name, void *data)
    {
        (void)name;
        (void)data;
        service->deleteLater();
        service = nullptr;
        return 0;
    }
    ```

2. sdbus

    ```c
    #include "service.h"

    extern "C" int DSMRegister(const char *name, void *data)
    {
        (void)name;
        if (!data) {
            return -1;
        }
        sd_bus *bus = (sd_bus *)data;
        sd_bus_slot *slot = NULL;
        if (sd_bus_add_object_vtable(bus,
                                    &slot,
                                    "/org/deepin/service/sdbus/demo1",
                                    "org.deepin.service.sdbus.demo1",
                                    calculator_vtable,
                                    NULL) < 0) {
            return -1;
        }
        return 0;
    }

    extern "C" int DSMUnRegister(const char *name, void *data)
    {
        (void)name;
        (void)data;
        return 0;
    }
    ```

**实现的 so 安装路径为 `/usr/lib/deepin-service-manager/`**

> 注意：不同平台的 lib 路径可能不一样，推荐使用[GNUInstallDirs](https://cmake.org/cmake/help/latest/module/GNUInstallDirs.html?highlight=gnuinstalldirs)

### 带权限的插件开发

配置文件增加权限规则即可。

```json
{
  "name": "org.deepin.services.demo",
  "libPath": "demo.so",
  "group": "core", // 可选，默认core。
  "pluginType": "qt", // 可选
  "policyVersion": "1.0", // 可选，配置文件版本，预留配置，无实际用途
  "policyStartType": "Resident", // 启动方式，Resident（常驻）、OnDemand（按需启动）。可选，默认Resident。
  "dependencies": [], // [可选]若依赖其他服务，可将服务名填在此处，在依赖启动之前不会启动此服务
  "startDelay": 0, // [可选]若需要延时启动，可将延时时间填在此处，单位为秒

  "whitelists": [
    // 白名单规则，给下面 policy 做权限规则配置，单独存在无意义
    {
      "name": "w1",
      "process": ["/usr/bin/aaa", "/usr/bin/bbb"]
    },
    {
      "name": "w2",
      "process": ["/usr/bin/aaa", "/usr/bin/ccc", "/usr/bin/python3"]
    },
    {
      "name": "all",
      "description": "No configuration is required, which means no restrictions"
    }
  ],
  "policy": [
    // 若需要权限管控，则应按此配置进行
    {
      "path": "/qdbus/demo1",
      "pathhide": true, // 隐藏该path，但可调用。可选，默认false
      "permission": true, // 开启权限。可选，默认false。注意该功能在 V20 上不可用，V23可正常使用，原因是Qt的DBus实现有问题。
      "subpath": true, // 子path也应用该权限（针对动态生成的子路径）。可选，默认false
      "whitelist": "w1", // 开启权限后，调用上方的白名单规则
      // path->interfaces->methods，权限层级，未指定的下级继承上级的权限配置，指定了的覆盖上级配置
      "interfaces": [
        {
          "interface": "org.deepin.service.demo",
          "whitelist": "w1",
          // "permission":true, // 不填则继承上级PATH的配置
          "methods": [
            {
              "method": "Multiply", // 具体方法的权限管控
              "whitelist": "w2"
            }
          ],
          "properties": [
            {
              "property": "Age",
              "permission": false
            }
          ]
        }
      ]
    },
    {
      "path": "/qdbus/demo2", // 此配置只隐藏路径, 不做权限管控，适合 V20 使用
      "pathhide": true
    }
  ]
}
```

### 独立应用开发

1. 提供配置文件，配置规则同上。
2. 加载 libqdbus-service.so
3. dbus object 继承 QDBusService，且调用 QDBusService::InitPolicy。

```c++
#include "qdbusservice.h"
#include <QDBusContext>
class Service : public QDBusService,
                protected QDBusContext
{
    Q_OBJECT
public:
    explicit Service(QObject *parent = 0) {
        QDBusService::InitPolicy(QDBusConnection::SessionBus, "other/demo.json");
    }
}
```

## 查看插件是否生效

将 .so 和 .json 文件放到指定位置后，执行命令：

1. system

    ```bash
    sudo systemctl restart deepin-service-manager@system.service
    ```

2. session

    ```bash
    systemctl --user restart deepin-service-manager@user.service
    ```

重启服务后，即可通过 DBus 命令行或 d-feet 工具查看 json 中的 DBus 服务已被启动，服务名即 json 中的`name`字段配置的内容。

在`org.deepin.service.manager`服务中：

- `/manager`路径下可查看当前服务中已启动的所有分组进程
- `/group/<group name>`路径下可查看当前分组中加载的所有插件

### 注意事项

#### 服务分类

在该服务中，分为主服务与分组服务，主服务启动，会根据配置文件，自动启动分组服务，举个例子：

现有一个插件，json 配置中，`group`字段配置为`app`，那么该插件就属于`app`组，

为方便调试，该服务有`Debug`版本和`Release`版本
在 Debug 版本中，分组服务以子进程的方式进行启动，所以以该命令可重启所有服务：

```bash
sudo systemctl restart deepin-service-manager@system.service
```

在 Release 版本中，分组服务与主服务

## 更新日志

- 2023/02/08:
  - 新增依赖配置，配置依赖服务后，在依赖未启动时不会启动本服务
  - 新增延时启动，可配置本服务延时启动
- 2023/02/06:
  - 重命名入口函数 DSMRegisterObject->DSMRegister;
  - 新增卸载函数，用于释放内存：DSMUnRegister;
  - json 配置路径更新：去掉了路径中的`qt-service`和`sd-service`，转而使用 json 文件中的`pluginType`来匹配。
