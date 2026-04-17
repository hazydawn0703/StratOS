import { runSql } from './db-common.mjs';

runSql("INSERT OR IGNORE INTO finance_portfolios(id,name,base_currency,created_at) VALUES ('seed-p1','Seed Portfolio','USD',datetime('now'));\n");
runSql("INSERT OR IGNORE INTO finance_watchlist_items(id,ticker,thesis,priority,added_at) VALUES ('seed-w1','NVDA','AI demand remains strong','high',datetime('now'));\n");
runSql("INSERT OR IGNORE INTO finance_benchmark_samples(id,sample_set,task_type,input_json,expected_json,created_at) VALUES ('seed-bm-1','default','stock_deep_dive','{\"ticker\":\"NVDA\"}','{\"shouldAdmit\":true}',datetime('now'));\n");
console.log('finance db seeded');
