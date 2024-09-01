# 二十分钟精通 Lua

虽然 Neovim 支持 Vimscript 作为其配置，但随着社区生态的发展，Vimscript 设计上的局限性，语法较为混乱，不太适合处理复杂的编程任务的缺陷逐渐显现。而 Lua 作为一种通用的编程语言，语法清晰、功能强大，更适合开发和维护复杂的插件和配置。

## 注释

```lua
-- comment
print("Hi") -- comment

--[[
 multi-line 
 comment
]]
```

## 变量

```lua
local x = 10 -- number
local name = "sid" -- string
local isAlive = true -- boolean
local a = nil --no value or invalid value

-- increment in numbers
local n = 1
n = n + 1
print(n) -- 2

-- strings
-- Concatenate strings
local phrase = "I am"
local name = "Sid"

print(phrase .. " " .. name) -- I am Sid
print("I am " .. "Sid")
```

## 比较运算符

```txt
 == equal
 < less than
 > greater than
 <= less than or equal to
 >= greater than or equal to
 ~= not equal
```

## 条件语句

```lua
-- Number comparisons
local age = 10

if age > 18 then
  print("over 18") -- this will not be executed
end

-- elseif and else
age = 20

if age > 18 then
  print("over 18")
elseif age == 18 then
  print("18 huh")
else
  print("kiddo")
end

-- Boolean comparison
local isAlive = true

if isAlive then
    print("Be grateful!")
end

-- String comparisons
local name = "sid"

if name ~= "sid" then
  print("not sid")
end
```

## 组合语句

```lua
local age = 22

if age == 10 and x > 0 then -- both should be true
  print("kiddo!")
elseif x == 18 or x > 18 then -- 1 or more are true
  print("over 18")
end

-- result: over 18
```

## 取反

可以使用not关键字反转值：

```lua
local isAlive = true

if not isAlive then
  print(" ye ded!")
end
```

## 函数

```lua
local function print_num(a)
  print(a)
end

-- or

local print_num = function(a)
  print(a)
end

print_num(5) -- prints 5 

-- multiple parameters
function sum(a, b)
  return a + b
end
```

## 作用域

变量有不同的作用域。一旦到达范围的末尾，该范围内的值就无法再访问。

```lua
function foo()
  local n = 10
end

print(n) -- nil , n isn't accessible outside foo()
```

## 循环

循环的不同方法：

### while

```lua
local i = 1

while i <= 3 do
   print("hi")
   i = i + 1
end
```

### for

```lua
for i = 1, 3 do
   print("hi")
end
-- Both print "hi" 3 times
```

## 表

表可用于存储复杂的数据。

表的类型：数组（列表）和字典（键，值）。

### 数组

其中的项目可以通过“索引”访问。

```lua
local colors = { "red", "green", "blue" }

print(colors[1]) -- red

-- Different ways to loop through lists
-- #colors is the length of the table, #tablename is the syntax

for i = 1, #colors do
  print(colors[i])
end

-- ipairs 
for index, value in ipairs(colors) do
   print(colors[index])
   -- or
   print(value)
end

-- If you dont use index or value here then you can replace it with _ 
for _, value in ipairs(colors) do
   print(value)
end
```

### 词典

词典包含键值对：

```lua
local info = { 
   name = "sid",
   age = 20,
   isAlive = true
}

-- both print sid
print(info["name"])
print(info.name)

-- Loop by pairs
for key, value in pairs(info) do
   print(key .. " " .. tostring(value))
end

-- prints name sid, age 20 etc
```

### 嵌套表

```lua
-- Nested lists
local data = {
    { "sid", 20 },
    { "tim", 90 },
}

for i = 1, #data do
  print(data[i][1] .. " is " .. data[i][2] .. " years old")
end

-- Nested dictionaries
local data = {
    sid = { age = 20 },
    tim = { age = 90 },
}
```

## 模块

模块用于从其他文件导入代码：

```lua
require("path")

-- for example in ~/.config/nvim/lua , all dirs and files are accessable via require
-- Do note that all files in that lua folder are in path!
-- ~/.config/nvim/lua/abc.lua 
-- ~/.config/nvim/lua/abc/init.lua

 require "abc"

-- both do the same thing
```

## vim.tbl_deep_extend

```lua
-- table 1
local person = {
    name = "joe",
    age = 19,
    skills = {"python", "html"},
}

-- table 2
local someone = {
    name = "siduck",
    skills = {"js", "lua"},
}

-- "force" will overwrite equal values from the someone table over the person table
local result = vim.tbl_deep_extend("force", person, someone)

-- result : 
{
    name = "siduck",
    age = 19,
    skills = {"js", "lua"},
}

-- The list tables wont merge cuz they dont have keys 
```

使用 :h vim.tbl_deep_extend 了解更多信息
