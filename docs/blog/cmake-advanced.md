---
title: CMake 进阶用法
date: 2022-09-08 19:46:21
tags:
  - CMake
  - Qt
categories:
  - Development
cover: https://pic.3gbizhi.com/2020/0816/20200816070447569.jpg
feature: true
---
# {{ $frontmatter.title }}

使用 CMake 创建一个简单的基于 Qt 的开发库，并且逐步添加单元测试和文档示例（doxygen）。

## 一个简单的基于 Qt 的开发库

首先基于上一章的基础用法创建一个简单的 CMakeLists.txt，并且创建两个目录：include、src，其中include 目录放置 demo.h，src 目录放置 demo.cpp 文件

demo.h 内容：

```cpp
#ifndef DEMO_H
#define DEMO_H

#include <QObject>

namespace Example {
class Demo : public QObject
{
    Q_OBJECT
public:
    Demo(QObject *parent = nullptr);
    ~Demo();
    int add(const int a, const int b);
};
}  // namespace Example

#endif

```

demo.cpp 内容：

```cpp
#include "include/demo.h"

namespace Example {

Demo::Demo(QObject *parent) : QObject(parent) {}

Demo::~Demo() {}

int Demo::add(const int a, const int b) { return a + b; }

} // namespace Example
```

`CMakeLists.txt`内容为：

```cmake
cmake_minimum_required(VERSION 3.13)

# If do't define version number, specify the version number
set(VERSION "1.0.0" CACHE STRING "define project version")

# project 有两种写法，这里建议使用这种写法，补全信息有助于后续使用
project(qtdemo
    LANGUAGES CXX
    HOMEPAGE_URL https://github.com/Groveer/qtdemo
    DESCRIPTION "qt program demo."
    VERSION ${VERSION})

# 定义GNU标准安装目录，使用此定义可兼容不同发行版之间的安装目录差异
include(GNUInstallDirs)
# 设置C++标准
set(CMAKE_CXX_STANDARD 17)
# 设置为检查C++标准打开，若未设置CMAKE_CXX_STANDARD，则会报错
set(CMAKE_CXX_STANDARD_REQUIRED on)
# 若使用标准C++开发，则不需要以下两行，使用Qt则需要
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
# 设置包含当前目录，建议头文件的包含写全路径
set(CMAKE_INCLUDE_CURRENT_DIR ON)
# 打开所有编译警告，理论上项目中不允许有编译警告
# 关于编译选项，项目中不应该添加任何额外的参数，若发行版需要，则应由发行版的配置文件添加，若Debug需要，则应只添加到Debug模式中
# 在外部添加编译参数的方法，例：cmake -DCMAKE_CXX_FLAGS="-Wl,--as-needed"
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra")
# 生成编译命令，用于支持clangd
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# 若未指定安装前缀，则指定前缀为/usr
# 注意大部分发行版默认会将前缀设置为/usr/local，所以若需要安装到/usr，还需在编译时指定
if (CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT)
    set(CMAKE_INSTALL_PREFIX /usr)
endif ()

# 若未指定编译类型，则指定为Release，防止某些发行版不指定编译类型
if (NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Choose Debug or Release" FORCE)
endif()

# 若当前编译类型为Debug，添加asan以检测内存泄漏
# 对应的还有CMAKE_CXX_FLAGS_RELEASE，Debug模式无需加-g参数，Release模式也无需加-O优化，默认cmake会帮我们加上
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -fsanitize=address -fno-omit-frame-pointer")

# 某些平台可能需要手动指定mieee参数，否则会有浮点数精度问题，如sw_64
# 使用方式：cmake -DENABLE_MIEEE
if (DEFINED ENABLE_MIEEE)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mieee")
endif()

# 若目标库安装了.cmake文件，则可以直接使用find_package
#find_package(PkgConfig REQUIRED)
# 若目标库未安装.cmake文件，但是安装了.pc文件，则可以使用pkgconfig
#pkg_search_module(XCB REQUIRED xcb)
find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Core)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Core Gui)

# 建议对不同的模块进行分类，可使用通配符，可指定具名文件
file(GLOB_RECURSE SRCS
    "src/*.cpp"
)
file(GLOB_RECURSE INCLUDES
    "include/*.h"
)

set(BIN_NAME ${PROJECT_NAME})

# 生成lib库，动态库用SHARED，静态库用STATIC，插件用MODULE
add_library(${BIN_NAME} SHARED
    ${SRCS}
    ${INCLUDES}
)

# 只有设置了属性，才会生成带版本号的lib库
set_target_properties(${LIB_NAME} PROPERTIES
    VERSION ${CMAKE_PROJECT_VERSION}
    SOVERSION ${CMAKE_PROJECT_VERSION_MAJOR}
)

# 安全编译选项，二进制需使用‘-fPIE’编译参数和‘-pie’链接参数，库需使用‘-fPIC’编译参数，两者之间有冲突不能同时使用，注意区分
target_compile_options(${BIN_NAME} PRIVATE -fPIC)

# 这里针对当前二进制定义了一个宏，保存着版本号，方便程序代码中调用，若程序中需要自定义宏变量并且在代码中使用，可参考此方法。
# 注意CMAKE_PROJECT_XXX系列变量，某些属性是cmake帮助提供，但某些属性是project方法设置的，所以这里需要注意变量是否可用。
# 至于是使用add_compile_xxx还是target_compile_xxx，视情况而定，一个是指定所有对象，一个是指定具体的二进制
target_compile_definitions(${BIN_NAME} PRIVATE
    VERSION="${CMAKE_PROJECT_VERSION}"
)

# Qt 从5.15版本开始，可以直接使用Qt::Core，而不需要加版本号，但为了兼容性，把版本号加上为好
target_include_directories(${BIN_NAME} PUBLIC
    Qt${QT_VERSION_MAJOR}::Core
)

target_link_libraries(${BIN_NAME} PRIVATE
    Qt${QT_VERSION_MAJOR}::Core
)

# 指定安装目录，一般常用有3个： TARGETS（编译出来的目标二进制）、FILES（指定路径的文件，通常是配置文件或服务文件）、DIRECTORY（一般是配置文件较多时使用）。
install(TARGETS ${BIN_NAME} DESTINATION ${CMAKE_INSTALL_BINDIR})
```

然后使用`cmake`命令生成库：

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
```

## 添加单元测试程序

项目根目录下创建`tests`目录，在其中新增两个文件：`main.cpp`和`ut_demo.cpp`。

main.cpp 内容：

```cpp
#include <gtest/gtest.h>

#include <QCoreApplication>
#include <QTimer>

int main(int argc, char *argv[])
{
    testing::InitGoogleTest(&argc, argv);
    QCoreApplication app(argc, argv);
    QTimer::singleShot(0, [] {
        int ret = RUN_ALL_TESTS();
        qApp->exit(ret);
    });
    return app.exec();
}

```

ut_demo.cpp 内容：

```cpp
#include "include/demo.h"

#include <gtest/gtest.h>

using namespace Example;

class TestDemo : public testing::Test
{
public:
    void SetUp() override { m_demo = new Demo; }
    void TearDown() override
    {
        delete m_demo;
        m_demo = nullptr;
    }

public:
    Demo *m_demo = nullptr;
};

TEST_F(TestDemo, add)
{
    EXPECT_EQ(3, m_demo->add(1, 2));
}
```

然后在`CMakeLists.txt`中添加单元测试二进制生成方式，以下内容追加到`CMakeLists.txt`中：

```cmake
if (CMAKE_BUILD_TYPE STREQUAL "Debug" OR BUILD_TESTING)

    find_package(GTest REQUIRED)

    set(TEST_NAME ut-demo)

    file(GLOB_RECURSE TEST_FILES
        "tests/*.cpp"
    )

    add_executable(${TEST_NAME}
        ${INCLUDES} #若是对二进制进行测试，需要在此包含要测试的h和cpp文件
        ${TEST_FILES}
    )

    target_include_directories(${TEST_NAME} PUBLIC
        Qt${QT_VERSION_MAJOR}::Core
    )

    target_link_libraries(${TEST_NAME} PRIVATE
        Qt${QT_VERSION_MAJOR}::Core
        GTest::gtest
        ${BIN_NAME} # 若是对库进行测试，可直接在此链接，不需要在上面包含cpp文件
        -lpthread
        -lgcov
    )

    # 若需要打桩，可能需要这些编译参数
    # target_compile_options(${TEST_NAME} PRIVATE -fno-access-control -fno-inline -Wno-pmf-conversions)

    # 这里是针对两种编译器的编译参数差异化进行处理，该编译参数是用来生成单元测试覆盖率
    if (CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
        target_compile_options(${TEST_NAME} PRIVATE -fprofile-instr-generate -ftest-coverage)
    endif()
    if (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
        target_compile_options(${TEST_NAME} PRIVATE -fprofile-arcs -ftest-coverage)
    endif()

    # 这两行是为了方便ctest调用
    enable_testing()
    add_test(NAME ${TEST_NAME} COMMAND ${TEST_NAME})

endif()
```

最后执行命令生成单元测试程序：

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
```

可使用以下命令运行单元测试程序：

```bash
ctest --test-dir build -VV
```

`-VV`参数会详细打印每个测试用例情况。

## 利用 doxygen 生成开发文档

为了将文档和代码进行隔离，在项目根目录创建 docs 目录，并在该目录创建 demo.dox 文件:

```dox
/*!
@~chinese
@file demo.h

demo.h 文件的详细描述

@class Example::Demo demo.h
@brief Demo 类

Demo 类的详细描述。

@fn int Demo::add(int a, int b)
@brief
add 函数的详细描述
@param a
参数a的描述
@param b
参数b的描述
@return
返回值的描述

*/
```

然后在`CMakeLists.txt`中添加：

```cmake
set (BUILD_DOCS ON CACHE BOOL "set open doxygen")

find_package(Doxygen REQUIRED)

if (BUILD_DOCS AND DOXYGEN_FOUND)
    set (QCH_INSTALL_DESTINATION ${CMAKE_INSTALL_PREFIX}/share/qt/doc CACHE STRING "QCH install location")
    set (DOXYGEN_GENERATE_HTML "YES" CACHE STRING "Doxygen HTML output")
    set (DOXYGEN_GENERATE_XML "NO" CACHE STRING "Doxygen XML output")
    set (DOXYGEN_GENERATE_QHP "YES" CACHE STRING "Doxygen QHP output")
    set (DOXYGEN_FILE_PATTERNS *.cpp *.h *.md *.dox CACHE STRING "Doxygen File Patterns")
    set (DOXYGEN_PROJECT_NUMBER ${CMAKE_PROJECT_VERSION} CACHE STRING "set project version") # Should be the same as this project is using.
    set (DOXYGEN_EXTRACT_STATIC YES)
    set (DOXYGEN_OUTPUT_LANGUAGE "Chinese")
    set (DOXYGEN_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/docs/)
    set (DOXYGEN_QHG_LOCATION "qhelpgenerator")
    set (DOXYGEN_QHP_NAMESPACE "org.deepin.dde.${CMAKE_PROJECT_NAME}")
    set (DOXYGEN_QCH_FILE "${CMAKE_PROJECT_NAME}.qch")
    set (DOXYGEN_QHP_VIRTUAL_FOLDER ${CMAKE_PROJECT_NAME})
    set (DOXYGEN_HTML_EXTRA_STYLESHEET "" CACHE STRING "Doxygen custom stylesheet for HTML output")
    set (DOXYGEN_TAGFILES "qtcore.tags=qthelp://doc.qt.io/qt-5/" CACHE STRING "Doxygen tag files")
    set (DOXYGEN_MACRO_EXPANSION "YES")
    set (DOXYGEN_EXPAND_ONLY_PREDEF "YES")
    # 若定义了命名空间宏，则需要在此进行设置，否则doxygen无法识别命名空间
    # set (DOXYGEN_PREDEFINED
    #     "DEMO_BEGIN_NAMESPACE=namespace Example {"
    #     "DEMO_END_NAMESPACE=}"
    #     "DEMO_USE_NAMESPACE=using namespace Example;"
    # )

    doxygen_add_docs (doxygen_demo
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/docs
        ALL
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        COMMENT "Generate documentation via Doxygen"
    )

    install (FILES ${CMAKE_CURRENT_BINARY_DIR}/docs/html/${CMAKE_PROJECT_NAME}.qch DESTINATION ${QCH_INSTALL_DESTINATION})
endif ()
```

看起来这里的变量设置的有点多，其实这些变量在官方文档都有说明，只是在变量前面加上 CMAKE 前缀，就可以被 cmake 识别，官方文档参考[这里]()。

重新执行`cmake --build build`就可以在`build/docs/html/`目录打开`index.html`文件，该文件就是开发文档，使用浏览器打开即可。

该示例演示了 doxygen 生成 .html 和 .qch 文件，html 不用过多介绍，.qch 其实就是 qtcreator 的帮助文档，只有设置了 DOXYGEN_GENERATE_QHP 变量才会生成 .qch 文件，下面的一些变量其实就是对 qch 的一些配置。

## 配置模板文件

在开发库的过程中，可能会需要预处理一些文件，生成我们想要的目标文件，然后再进行使用或安装，比如配置 .pc 文件以方便库的使用者可以很方便的查找该库。关于 .pc 文件和 pkg-config 的使用，不属于本章的范畴，不做过多讲解。

为了遵循规范，需要将 qtdemo.pc.in 文件新建在 misc 目录中，并写入以下内容：

```shell
Name: @BIN_NAME@
Description: @CMAKE_PROJECT_DESCRIPTION@
URL: @CMAKE_PROJECT_HOMEPAGE_URL@
Version: @PROJECT_VERSION@
Requires: @PC_REQ_PUBLIC@
Requires.private: @PC_REQ_PRIVATE@
Cflags: -I"@CMAKE_INSTALL_FULL_INCLUDEDIR@/@BIN_NAME@"
Libs: -L"@CMAKE_INSTALL_FULL_LIBDIR@" -l@BIN_NAME@
Libs.private: -L"@CMAKE_INSTALL_FULL_LIBDIR@" -l@BIN_NAME@ -l@PC_LIBS_PRIVATE@
```

从中可以看出这就是一个键值对的配置文件，只不过其中的 value 都是使用的 CMakeLists.txt 中的变量。

然后需要在 CMakeLists.txt 文件中添加以下内容：

```cmake
# 这里设置的变量是为了传递给pc文件使用，无必要可以删除
# 本库所依赖的其他库文件。所依赖的库文件的版本号可以通过使用如下比较操作符指定：=,<,>,<=,>=
set(PC_REQ_PUBLIC)
# 本库所依赖的一些私有库文件，但是这些私有库文件并不需要暴露给应用程序。这些私有库文件的版本指定方式与Requires中描述的类似。
set(PC_REQ_PRIVATE)
# 本库所需要的一些私有库的链接选项。
set(PC_LIBS_PRIVATE Qt${QT_VERSION_MAJOR}Core)

configure_file(misc/${BIN_NAME}.pc.in ${BIN_NAME}.pc @ONLY)
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/${BIN_NAME}.pc DESTINATION ${CMAKE_INSTALL_LIBDIR}/pkgconfig)
```

在经过编译后，就可以在 build 目录中发现生成了 qtdemo.pc 文件，打开后发现使用 cmake 变量的值都已经被换成实际编译中所获取的值。

同样的方式，还可以生成`.cmake`和`.pri`文件。

misc/qtdemoConfig.cmake.in 内容就是指定`include`目录和链接库的名称，注意`cmake`查找`.cmake`的规则为项目名称+Config.cmake：

```cmake
set(@BIN_NAME@_INCLUDE_DIR @CMAKE_INSTALL_FULL_INCLUDEDIR@/@BIN_NAME@)
set(@BIN_NAME@_LIBRARIES @BIN_NAME@)
include_directories("${@BIN_NAME@_INCLUDE_DIR}")
```

`CMakeLists.txt`添加：

```cmake
configure_file(misc/${BIN_NAME}Config.cmake.in ${BIN_NAME}Config.cmake @ONLY)
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/${BIN_NAME}Config.cmake DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/${BIN_NAME})
```

misc/qt_lib_qtdemo.pri.in 内容为：

```shell
QT.@BIN_NAME@.VERSION = @CMAKE_PROJECT_VERSION@
QT.@BIN_NAME@.MAJOR_VERSION = @PROJECT_VERSION_MAJOR@
QT.@BIN_NAME@.MINOR_VERSION = @PROJECT_VERSION_MINOR@
QT.@BIN_NAME@.PATCH_VERSION = @PROJECT_VERSION_PATCH@
QT.@BIN_NAME@.name = @BIN_NAME@
QT.@BIN_NAME@.module = @BIN_NAME@
QT.@BIN_NAME@.libs = @CMAKE_INSTALL_FULL_LIBDIR@
QT.@BIN_NAME@.includes = @CMAKE_INSTALL_FULL_INCLUDEDIR@/@BIN_NAME@
QT.@BIN_NAME@.frameworks = @BIN_FW@
QT.@BIN_NAME@.depends = @BIN_DEPS@
QT.@BIN_NAME@.module_config = @BIN_CFG@
QT.@BIN_NAME@.DEFINES = @BIN_DEFS@
```

`CMakeLists.txt`添加：

```cmake
set(BIN_FW)
set(BIN_DEPS "core")
set(BIN_CFG)
set(BIN_DEFS)
# 注意这里的QMKSPECS_INSTALL_DIR在不同的发行版甚至是不同的Qt版本上路径是不一样的，在各自发行版上打包需要注意。
set(QMKSPECS_INSTALL_DIR "${CMAKE_INSTALL_LIBDIR}/qt${QT_VERSION_MAJOR}/mkspecs/modules" CACHE STRING "install dir for qt pri files")
configure_file(misc/qt_lib_${BIN_NAME}.pri.in qt_lib_${BIN_NAME}.pri @ONLY)
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/qt_lib_${BIN_NAME}.pri DESTINATION "${QMKSPECS_INSTALL_DIR}")
```
