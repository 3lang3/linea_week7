# Linea 第七周脚本

总共 15 个任务，可以拿到 205分，部分任务银河确认较慢可能要隔天才能verify。

> 请自行检查代码，和项目依赖，风险自担，可以自行修改。

## 环境

- nodejs [lts](https://nodejs.org/en/download)

## 安装依赖

```bash
npm install # 安装依赖
```

## 运行

`keys.txt` 放私钥，一行一个

```bash
npm run swc -a ensreg # 跑第一个任务 [ENS 注册]
npm run swc -a lineaster # 跑第二个任务 [Lineaster] (follow和collect需要有USDC)
...
```

支持并发运行，例如：

```bash
npm run swc -a ensreg -b 10 # 例如100个私钥，分十份并发跑
```

> 全部任务: ensreg, lineaster, snapshotx, lineal2domain, atticc, vitidiary, zkholdem, moonlight, metamerge, readon, battlemon, tatarot, stationx, meet, idriss
