import { AsyncMonitor, lock } from '@/AsyncMonitor';
import * as testsUtils from './utils';

describe(AsyncMonitor.name, () => {
  test('lock decorator ensures mutual exclusion', async () => {
    const aMockBegin = jest.fn();
    const aMockFinish = jest.fn();
    const bMockBegin = jest.fn();
    const bMockFinish = jest.fn();
    @AsyncMonitor()
    class X {
      @lock()
      async a() {
        aMockBegin();
        await testsUtils.sleep(20);
        await testsUtils.sleep(40);
        aMockFinish();
      }

      @lock()
      async b() {
        bMockBegin();
        await testsUtils.sleep(10);
        await testsUtils.sleep(30);
        bMockFinish();
      }
    }
    const x = new X();
    await Promise.all([x.a(), x.b()]);
    const call1 = aMockBegin.mock.invocationCallOrder[0];
    const call2 = aMockFinish.mock.invocationCallOrder[0];
    const call3 = bMockBegin.mock.invocationCallOrder[0];
    const call4 = bMockFinish.mock.invocationCallOrder[0];
    expect(call1).toBeLessThan(call2);
    expect(call2).toBeLessThan(call3);
    expect(call3).toBeLessThan(call4);
  });
});
