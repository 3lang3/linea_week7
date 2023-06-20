import { parseArgs } from "node:util";
import { getTxtContent } from "./utils";
import path from "node:path";

type CallbackFn = (p: {
  pk: string,
  action: string,
}) => Promise<void>;

export const cli = async (cb: CallbackFn, run = true) => {
  if (!run) return;
  const {
    values: { action, batch },
  } = parseArgs({
    options: {
      /** 执行动作 */
      action: {
        type: "string",
        short: "a",
        default: '',
      },
      /** 任务并行切割分组 */
      batch: {
        type: "string",
        short: "b",
        default: '',
      },
    },
  });

  const keys = getTxtContent(path.resolve(__dirname, '../keys.txt')) as string[];
  const [startIdx, endIdx] = [0, keys.length - 1];
  // 将startIdx和endIdx的区间分成slice份
  const s = batch || 1;
  const sliceSize = Math.ceil((endIdx - startIdx + 1) / +s);
  const fns = [];
  for (let i = 0; i < +s; i++) {
    const start = startIdx + i * sliceSize;
    let end = startIdx + (i + 1) * sliceSize - 1;
    end = end >= endIdx ? endIdx : end;
    for (let j = start; j <= end; j++) {
      const pk = keys[j];
      fns.push(async () => {
        await cb?.({
          action, pk
        });
      })
    }
  }
  console.time('total');
  await Promise.all(fns.map(fn => fn()));
  console.timeEnd('total');
}