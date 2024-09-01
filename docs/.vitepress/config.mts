import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "易上止正",
  description: "付出不亚于任何人的努力",

  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ["meta", { name: "theme-color", content: "#646cff" }],
    [
      "script",
      {
        src: "https://cdn.usefathom.com/script.js",
        "data-site": "CBDFBSLI",
        "data-spa": "auto",
        defer: "",
      },
    ],
  ],

  sitemap: {
    hostname: "https://blog.groveer.com",
    lastmodDateOnly: false
  },

  themeConfig: {
    nav: nav(),

    outlineTitle: "本页目录",
    outline: [2, 4],

    sidebar: {
      "/blog/": sidebarBlog(),
      "/linux-disk-manager/": sidebarQt(),
      "/neovim/": sidebarNeovim(),
    },

    editLink: {
      pattern:
        "https://github.com/groveer/website/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/groveer" }],

    footer: {
      message: "博客内容遵循 CC BY-NC-SA 4.0 协议。",
      copyright: "Copyright © 2022-至今 易上止正",
    },

    search: {
      provider: "local"
    },
  },
});

function nav() {
  return [
    { text: "博客", link: "/blog/toc", activeMatch: "/blog/" },
    {
      text: "专栏",
      items: [
        {
          text: "linux 磁盘管理",
          link: "/linux-disk-manager/index",
          activeMatch: "/linux-disk-manager/",
        },
        {
          text: "Neovim 配置",
          link: "/neovim/index",
          activeMatch: "/neovim/",
        }
      ],
    },
    { text: "关于", link: "/about/about", activeMatch: "/about/about" },
    { text: "留言板", link: "/about/talk", activeMatch: "/about/talk" },
    {
      text: "友链",
      items: [
        {
          text: "竹子",
          link: "https://blog.justforlxz.com/",
        },
      ],
    },
  ];
}

function sidebarBlog() {
  return [
    {
      text: "Linux",
      collapsed: false,
      items: [
        {
          text: "ArchLinux",
          collapsed: false,
          items: [
            { text: "系统安装", link: "/blog/archlinux-install" },
            { text: "系统配置", link: "/blog/archlinux-config" },
            {
              text: "安装 Nvidia 闭源驱动",
              link: "/blog/archlinux-install-nvidia",
            },
            { text: "WSL2安装ArchLinux", link: "/blog/wsl2-archlinux" },
          ],
        },
        {
          text: "Deepin",
          collapsed: false,
          items: [
            { text: "系统修复", link: "/blog/deepin-repair-system" },
            { text: "正确使用日志记录", link: "/blog/how-to-use-logger" },
          ],
        },
        { text: "自动登陆", link: "/blog/linux-auto-login" },
        { text: "挂载小技巧", link: "/blog/linux-mount" },
        { text: "网络管理", link: "/blog/linux-networkmanager" },
        { text: "zram & swap", link: "/blog/linux-zram" },
      ],
    },
    {
      text: "Develop",
      collapsed: false,
      items: [
        { text: "CMake 基础用法", link: "/blog/cmake-basic" },
        { text: "CMake 进阶用法", link: "/blog/cmake-advanced" },
        { text: "Qt 开发小技巧", link: "/blog/qt-tips" },
      ],
    },
    {
      text: "Tools",
      collapsed: false,
      items: [
        { text: "Git 小技巧", link: "/blog/git" },
        { text: "Latex 搭建", link: "/blog/latex" },
        { text: "Qemu 工具", link: "/blog/qemu" },
        { text: "clash 配置", link: "/blog/clash" },
        { text: "免费代理", link: "/blog/free-proxy" },
      ],
    },
    {
      text: "IDE",
      collapsed: false,
      items: [
        { text: "VsCode 配置", link: "/blog/vscode" },
        { text: "Windows Neovim 配置", link: "/blog/windows-neovim-c" },
      ],
    },
  ];
}

function sidebarQt() {
  return [
    {
      text: "前言",
      link: "linux-disk-manager/index",
    },
    {
      text: "基础知识：分区、格式化、挂载点",
      link: "linux-disk-manager/base-content",
    },
  ];
}

function sidebarNeovim() {
  return [
    {
      text: "前言",
      link: "neovim/index",
    },
    {
      text: "Neovim 基础",
      link: "neovim/basic",
    },
    {
      text: "二十分钟精通 Lua",
      link: "neovim/lua",
    }
  ];
}
