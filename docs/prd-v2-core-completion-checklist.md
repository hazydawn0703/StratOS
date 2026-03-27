# PRD V2 Core Framework Completion Checklist (up to Phase S)

> Scope: Framework core capabilities required by current V2 delivery line, with emphasis on chapter 16.5 / 16.6 and their upstream dependencies.

## Overall verdict

- **Core framework is functionally complete for current V2 baseline delivery path** (candidate lifecycle, promotion governance, manual approval, run-level audit, SLA/dead-letter, replay summaries, transport facade).
- **Not yet fully productized** in two areas: persistent run summary index backend and real HTTP/controller integration wiring outside app transport simulation.

## Checklist

| PRD-aligned capability | Status | Evidence |
|---|---|---|
| Candidate → evaluation → experiment → promotion governance chain | ✅ Complete | `ExperimentEngine` + lifecycle guard + promotion flow tests |
| Manual approval workflow (`manual_review`, approve/reject, audit fields) | ✅ Complete | `PromotionDecision`, `approvePromotion`, `rejectPromotion` |
| Run-level traceability (`run_id` in audit/events/summaries) | ✅ Complete | governance events + promotion audit + replay run summary |
| SLA breach detection for pending approvals | ✅ Complete | `checkApprovalSLA` and `approval_sla_breached` events |
| Queue retry and dead-letter path for SLA alerts | ✅ Complete | `InMemoryQueueAdapter` retry/dead-letter/requeue + tests |
| Governance event persistence abstraction (in-memory + db facade) | ✅ Complete | `GovernanceEventStore`, `DatabaseGovernanceEventStore` |
| Run summary index + query (time-window/pagination/sort) | ✅ Complete (in-memory) | replay index APIs + list filters/sort/pagination |
| Governance query facade for upper API/console | ✅ Complete (application transport layer) | `FinanceGovernanceTransportFacade` / `FinanceGovernanceHttpController` |
| Production HTTP/API integration outside app transport | 🟡 Pending | Controller exists in app layer; no external server/router binding yet |
| Persistent storage for run summary index | 🟡 Pending | Current replay index is in-memory map |

## Conclusion

- For **core framework capabilities**, delivery is at **“complete and test-covered”** level.
- For **production integration**, delivery is at **“ready-to-wire”** level.
