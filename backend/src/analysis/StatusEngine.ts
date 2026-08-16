import { IAnalysisResult } from '../models/Analysis';

export class StatusEngine {
  public static analyzeResult(
    resultValue: number | string,
    referenceLow?: number,
    referenceHigh?: number
  ): 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN' | 'NEEDS_REVIEW' {
    if (typeof resultValue === 'string') {
      const numResult = parseFloat(resultValue);
      if (isNaN(numResult)) {
        return 'NEEDS_REVIEW'; // Non-numeric results need manual review or NLP analysis
      }
      resultValue = numResult;
    }

    if (referenceLow === undefined || referenceHigh === undefined) {
      return 'UNKNOWN';
    }

    if (resultValue < referenceLow) {
      return 'LOW';
    } else if (resultValue > referenceHigh) {
      return 'HIGH';
    } else {
      return 'NORMAL';
    }
  }

  public static determineOverallStatus(results: IAnalysisResult[]): 'NORMAL' | 'ABNORMAL' | 'NEEDS_REVIEW' | 'INCOMPLETE' {
    if (!results || results.length === 0) {
      return 'INCOMPLETE';
    }

    let hasAbnormal = false;
    let hasNeedsReview = false;

    for (const r of results) {
      if (r.status === 'NEEDS_REVIEW' || r.status === 'UNKNOWN') {
        hasNeedsReview = true;
      } else if (r.status === 'LOW' || r.status === 'HIGH') {
        hasAbnormal = true;
      }
    }

    if (hasNeedsReview) return 'NEEDS_REVIEW';
    if (hasAbnormal) return 'ABNORMAL';
    return 'NORMAL';
  }
}
