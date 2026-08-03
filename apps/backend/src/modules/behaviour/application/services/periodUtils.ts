// Re-exported thin wrapper so the behaviour module doesn't reach directly
// into the scoring module's internals for a handful of generic date-math
// helpers that have nothing scoring-specific about them.
export { periodKeyForNow, dateRangeForPeriod, lastNPeriodKeys } from "../../../scoring/application/services/scoringPeriodUtils";
