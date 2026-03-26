import test from 'node:test';
import assert from 'node:assert/strict';
import { StrategyRuntimeKernel } from '../packages/core/dist/index.js';

test('StrategyRuntimeKernel runs unified chain and uses routing provider fallback', async () => {
  const taskRuntime = {
    createTaskContext: (seed) => ({
      taskType: seed.taskType ?? 'unknown',
      thesisType: 'generic',
      riskLevel: 'medium',
      metadata: {}
    })
  };
  const stuRegistry = { getActive: () => [] };
  const strategyCompiler = {
    compile: () => ({
      promptLayer: ['prompt-A'],
      ruleLayer: [],
      routingLayer: { providers: ['router-provider'] }
    })
  };
  const ruleEngine = {
    runPreGeneration: () => ({ effects: {}, logs: [] }),
    runPostGeneration: () => ({ effects: {}, logs: [] })
  };
  const modelGateway = {
    generateText: async (_prompt, input) => ({
      provider: input.preferredProvider ?? 'none',
      model: 'mock',
      content: 'ok',
      usage: { inputTokens: 1, outputTokens: 1 }
    })
  };

  const kernel = new StrategyRuntimeKernel(taskRuntime, stuRegistry, strategyCompiler, ruleEngine, modelGateway, {
    modelLayer: 'default'
  });

  const result = await kernel.run({ taskType: 'report_generation' });
  assert.equal(result.modelResponse.provider, 'router-provider');
});
