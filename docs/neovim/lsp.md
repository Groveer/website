# Neovim 与 LSP

## 什么是 LSP？

不知道大家是否曾经想过一个问题——为什么代码编辑器/IDE 能给你提供代码补全提示？乍一想这似乎是理所当然的，但问题在于——世界上的代码编辑器这么多，难道需要每个编辑器单独去适配每一门编程语言吗？如果出现了一个新的编程语言，为了让它能够真正投入使用，编程语言的开发团队难道还需要给每个编辑器专门开发一个单独的插件吗？

在 LSP (Language Server Protocol) 出现之前，事情还真是如此——每个编辑器/IDE 都维护着一份不同的针对某个特定编程语言的代码补全策略，所以那时你会发现如果你想用某个特定的编程语言写代码，你几乎就绑死了特定的几个代码编辑器/IDE，因为在其他的代码编辑器里你可能压根得不到任何代码提示，写起来就像记事本。

而 VS Code 提出的 LSP (Language Server Protocol) 一定程度上解决了这一问题——这是一个独立的、通用的、与编辑器无关的协议，规定了编辑器要如何与一个独立的“语言服务器（Language Server）”通信，从而提供代码补全、代码分析等功能。VS Code 中几乎所有的编程语言支持都通过 LSP 来完成——开发者需要先开发一个独立的 Language Server，然后编写一个 VS Code 插件作为一层薄薄的“桥梁”（即客户端），从而为这门编程语言提供代码补全等功能。这样做的好处显而易见——主要的工作量在于 Language Server，而它的“客户端（Client）”工作量通常较小，只起到一个简单的桥梁作用，于是你可以把这样一个通用的 Language Server 用于多个编辑器/IDE，然后只需要简单地为每个编辑器/IDE 编写一个简单的插件即可，于是整体工作量就大大减小了。

如今许多新兴的和不那么主流的代码编辑器都依靠 LSP 来为大多数编程语言提供支持，包括 Neovim、Sublime Text 以及 Helix 等。许多流行的编程语言也有了质量很高的 Language Server 实现，使得它们可以比较轻松地在这些支持 LSP 协议的编辑器中使用，从而获得一致的体验。

>> [!NOTE]
> 值得阐明的是，也仍有一些编辑器/IDE 并不使用 LSP 而是使用自己的代码补全系统，比如 JetBrains 的 IntelliJ IDEA 仍使用自己的代码补全系统为 Java 提供支持，从而提供更好的性能和更好的代码补全体验（但同样是 JetBrains，它旗下的 CLion 在背后用的就是 clangd，LLVM 项目维护的一个 C/C++ 的 LSP 实现）。

## 在 Neovim 中配置 LSP

Neovim 自身已经内置了 LSP 支持（参考 :h lsp）——但它没有包含任何预定义配置。因此如果你只依赖 Neovim 内置的 LSP 支持，你需要自己下载某个 Language Server 的可执行文件，然后在你的配置文件中通过 vim.lsp.config.\<lsp_name> = { ... } 配置它的可执行文件路径、启动方式以及对各种事件的响应，相当于你自己实现了一个 LSP 客户端（就像一个 VS Code 插件一样）。最后，你需要调用 vim.lsp.enable("\<lsp_name>") 来启用它。

在上一篇文章里面，配置目录为：

```text
~/.config/nvim/
├── init.lua
└── lua/
    ├── configs.lua
    ├── options.lua
    ├── keymaps.lua
    └── plugins.lua
```

加入 LSP 后，可以是这样：
```text
~/.config/nvim/
├── init.lua
├── lsp/
    ├── clangd.lua
    └── lua_ls.lua
└── lua/
    ├── lsp.lua
    ├── configs.lua
    ├── options.lua
    ├── keymaps.lua
    └── plugins.lua
```

在 lsp 目录中配置每个 LSP 服务，在 lsp.lua 中配置 LSP 客户端，包括默认配置，快捷键等等，可以参考本人的[配置](https://github.com/Groveer/nvvim/blob/main/lua/nvvim/configs/lsp.lua)

>> [!TIP]
> 以前有个`nvim-lspconfig`的插件可以自动帮我们配置这些，我们仅仅只需要写个名字即可，但由于官方支持越来越完善，这个项目现在仅仅是作为一个仓库和参考配置，具体的配置还是需要我们自己配。

## 使用 Mason 来安装 LSP 服务

LSP 服务并不是配置一下就可以使用了，还需要进行安装，以 C++ 举例，在`~/.config/nvim/lsp/clangd.lua`中需要指定运行该服务所需的命令行以及参数，那么二进制怎么安装呢，这就需要一个插件来帮我们安装这些，这个插件就是[mason.nvim](https://github.com/williamboman/mason.nvim)。

可以通过`:Mason`命令来安装二进制，安装的二进制路径为：`~/.local/share/nvim/mason/bin/`，所以需要将这个路径添加到环境变量，这里只需要将路径加到 Neovim 的环境变量即可：

```lua
local is_windows = vim.uv.os_uname().sysname == "Windows_NT"
local sep = is_windows and "\\" or "/"
local delim = is_windows and ";" or ":"
vim.env.PATH = table.concat({ vim.fn.stdpath("data"), "mason", "bin" }, sep) .. delim .. vim.env.PATH
```

这个写法是为了 Windows 兼容性。

至此，我们的 Neovim 就可以当作一个 IDE 完全体啦！

## 写在最后

其实这整个系列，并没完全描述清楚 Neovim 的玩法，只是介绍个大概，只能说 Neovim 的世界太过庞大，我本人也并不认为就一定会了解它的方方面面，但是作为一款编辑器和IDE已经完全够用，已经能完全符合我的办公需求。

Neovim 还有很多所谓的发行版，大家可以在[github topic](https://github.com/topics/neovim)上参考一些优秀的发行版，对于新手，本人建议使用[NvChad](https://github.com/NvChad/NvChad)和[kickstart](https://github.com/nvim-lua/kickstart.nvim)，NvChad 配置较少，仅仅实现了基本的IDE功能，适合扩展，kickstart 更像是一个教学配置，可以帮助新手更快的入门。
