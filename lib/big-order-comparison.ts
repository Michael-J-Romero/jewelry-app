type RawRecord = Record<string, unknown>;

export type ComparedRow = {
  index: number;
  manualPresent: boolean;
  exportPresent: boolean;
  manualName: string;
  exportName: string;
  manualPrice: number | null;
  exportPrice: number | null;
  manualQuantity: number;
  exportQuantity: number;
  matchedQuantity: number;
  nameMatches: boolean;
  priceMatches: boolean;
  hasQuantityMismatch: boolean;
  suggestedExportIndex: number | null;
  suggestedExportName: string;
  suggestionConfidence: number | null;
  hasHighConfidenceSuggestion: boolean;
};

export type BigOrderComparison = {
  totalManualRows: number;
  totalExportRows: number;
  comparedRowCount: number;
  perfectMatchCount: number;
  mismatchCount: number;
  titleMismatchCount: number;
  priceMismatchCount: number;
  missingRowCount: number;
  highConfidenceSuggestionCount: number;
  hasExactTitleAndPriceMatch: boolean;
  mismatches: ComparedRow[];
};

function toTrimmedString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function toQuantityNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[\s,]/g, '').trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 1;
}

function normalizeLoose(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenizeTitle(value: string): string[] {
  const loose = normalizeLoose(value);
  if (!loose) {
    return [];
  }

  return loose.split(/\s+/g).filter(Boolean);
}

function buildBigrams(value: string): Set<string> {
  const compact = normalizeLoose(value).replace(/\s+/g, '');
  if (!compact) {
    return new Set();
  }

  if (compact.length === 1) {
    return new Set([compact]);
  }

  const result = new Set<string>();
  for (let index = 0; index < compact.length - 1; index += 1) {
    result.add(compact.slice(index, index + 2));
  }

  return result;
}

function diceCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 1;
  }

  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let overlap = 0;
  const smaller = a.size <= b.size ? a : b;
  const bigger = a.size <= b.size ? b : a;

  smaller.forEach((token) => {
    if (bigger.has(token)) {
      overlap += 1;
    }
  });

  return (2 * overlap) / (a.size + b.size);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 1;
  }

  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) {
      intersection += 1;
    }
  });

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function scoreTitleSimilarity(manualName: string, exportName: string): number {
  const manualTokens = new Set(tokenizeTitle(manualName));
  const exportTokens = new Set(tokenizeTitle(exportName));
  const tokenScore = jaccardSimilarity(manualTokens, exportTokens);

  const manualBigrams = buildBigrams(manualName);
  const exportBigrams = buildBigrams(exportName);
  const charScore = diceCoefficient(manualBigrams, exportBigrams);

  const manualCompact = normalizeLoose(manualName).replace(/\s+/g, '');
  const exportCompact = normalizeLoose(exportName).replace(/\s+/g, '');

  const containsBoost =
    manualCompact && exportCompact && (manualCompact.includes(exportCompact) || exportCompact.includes(manualCompact))
      ? 1
      : 0;

  const lengthBase = Math.max(manualCompact.length, exportCompact.length, 1);
  const lengthScore = 1 - Math.abs(manualCompact.length - exportCompact.length) / lengthBase;

  const confidence = 0.45 * charScore + 0.35 * tokenScore + 0.15 * lengthScore + 0.05 * containsBoost;
  return Math.max(0, Math.min(1, confidence));
}

type ExportSearchRow = {
  exportIndex: number;
  exportName: string;
};

function findBestFuzzySuggestion(
  manualName: string,
  availableExportRows: ExportSearchRow[],
  tokenIndex: Map<string, number[]>,
): { exportIndex: number; exportName: string; confidence: number } | null {
  if (availableExportRows.length === 0) {
    return null;
  }

  const manualTokens = tokenizeTitle(manualName);
  const candidateIndexes = new Set<number>();

  manualTokens.forEach((token) => {
    const matches = tokenIndex.get(token);
    if (!matches) {
      return;
    }

    matches.forEach((index) => {
      candidateIndexes.add(index);
    });
  });

  const candidates =
    candidateIndexes.size > 0
      ? availableExportRows.filter((row) => candidateIndexes.has(row.exportIndex))
      : availableExportRows;

  let bestMatch: { exportIndex: number; exportName: string; confidence: number } | null = null;

  candidates.forEach((candidate) => {
    const confidence = scoreTitleSimilarity(manualName, candidate.exportName);

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = {
        exportIndex: candidate.exportIndex,
        exportName: candidate.exportName,
        confidence,
      };
    }
  });

  return bestMatch;
}

function toPriceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/[$,\s]/g, '').trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function compareBigOrderDatasets(
  manualRows: RawRecord[],
  exportRows: RawRecord[],
): BigOrderComparison {
  const HIGH_CONFIDENCE_THRESHOLD = 0.72;

  type ParsedRow = {
    index: number;
    title: string;
    normalizedTitle: string;
    price: number | null;
    quantity: number;
  };

  type TitleGroup = {
    normalizedTitle: string;
    displayTitle: string;
    manualEntries: ParsedRow[];
    exportEntries: ParsedRow[];
  };

  const parsedManualRows: ParsedRow[] = manualRows.map((row, index) => {
    const title = toTrimmedString(row['Item Name']);
    return {
      index,
      title,
      normalizedTitle: normalizeTitle(title),
      price: toPriceNumber(row['Unit Cost']),
      quantity: toQuantityNumber(row['Quantity Ordered']),
    };
  });

  const parsedExportRows: ParsedRow[] = exportRows.map((row, index) => {
    const title = toTrimmedString(row['Line: Title']);
    return {
      index,
      title,
      normalizedTitle: normalizeTitle(title),
      price: toPriceNumber(row['Line: Price']),
      quantity: toQuantityNumber(row['Line: Quantity']),
    };
  });

  const groupsByTitle = new Map<string, TitleGroup>();

  function getOrCreateGroup(normalizedTitle: string, displayTitle: string): TitleGroup {
    const existing = groupsByTitle.get(normalizedTitle);
    if (existing) {
      if (!existing.displayTitle && displayTitle) {
        existing.displayTitle = displayTitle;
      }
      return existing;
    }

    const created: TitleGroup = {
      normalizedTitle,
      displayTitle,
      manualEntries: [],
      exportEntries: [],
    };
    groupsByTitle.set(normalizedTitle, created);
    return created;
  }

  parsedManualRows.forEach((row) => {
    const group = getOrCreateGroup(row.normalizedTitle, row.title);
    group.manualEntries.push(row);
  });

  parsedExportRows.forEach((row) => {
    const group = getOrCreateGroup(row.normalizedTitle, row.title);
    group.exportEntries.push(row);
  });

  const mismatches: ComparedRow[] = [];
  const comparedRows: ComparedRow[] = [];

  let perfectMatchCount = 0;
  let titleMismatchCount = 0;
  let priceMismatchCount = 0;
  let missingRowCount = 0;
  let highConfidenceSuggestionCount = 0;

  const sortedGroups = [...groupsByTitle.values()].sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));

  sortedGroups.forEach((group) => {
    const manualTotalQuantity = group.manualEntries.reduce((sum, row) => sum + row.quantity, 0);
    const exportTotalQuantity = group.exportEntries.reduce((sum, row) => sum + row.quantity, 0);
    const manualTitle = group.manualEntries[0]?.title ?? '';
    const exportTitle = group.exportEntries[0]?.title ?? '';

    if (group.manualEntries.length === 0 || group.exportEntries.length === 0) {
      const comparedRow: ComparedRow = {
        index: comparedRows.length,
        manualPresent: group.manualEntries.length > 0,
        exportPresent: group.exportEntries.length > 0,
        manualName: manualTitle,
        exportName: exportTitle,
        manualPrice: group.manualEntries[0]?.price ?? null,
        exportPrice: group.exportEntries[0]?.price ?? null,
        manualQuantity: manualTotalQuantity,
        exportQuantity: exportTotalQuantity,
        matchedQuantity: 0,
        nameMatches: false,
        priceMatches: false,
        hasQuantityMismatch: manualTotalQuantity !== exportTotalQuantity,
        suggestedExportIndex: null,
        suggestedExportName: '',
        suggestionConfidence: null,
        hasHighConfidenceSuggestion: false,
      };

      comparedRows.push(comparedRow);
      mismatches.push(comparedRow);
      titleMismatchCount += 1;
      priceMismatchCount += 1;
      missingRowCount += 1;
      return;
    }

    const manualByPrice = new Map<string, { price: number | null; quantity: number }>();
    const exportByPrice = new Map<string, { price: number | null; quantity: number }>();

    group.manualEntries.forEach((entry) => {
      const key = entry.price === null ? 'null' : String(entry.price);
      const existing = manualByPrice.get(key);
      if (existing) {
        existing.quantity += entry.quantity;
        return;
      }

      manualByPrice.set(key, { price: entry.price, quantity: entry.quantity });
    });

    group.exportEntries.forEach((entry) => {
      const key = entry.price === null ? 'null' : String(entry.price);
      const existing = exportByPrice.get(key);
      if (existing) {
        existing.quantity += entry.quantity;
        return;
      }

      exportByPrice.set(key, { price: entry.price, quantity: entry.quantity });
    });

    const allPriceKeys = new Set<string>([...manualByPrice.keys(), ...exportByPrice.keys()]);

    allPriceKeys.forEach((priceKey) => {
      const manualPriceData = manualByPrice.get(priceKey);
      const exportPriceData = exportByPrice.get(priceKey);

      const manualQuantity = manualPriceData?.quantity ?? 0;
      const exportQuantity = exportPriceData?.quantity ?? 0;
      const matchedQuantity = Math.min(manualQuantity, exportQuantity);

      const hasManual = manualQuantity > 0;
      const hasExport = exportQuantity > 0;
      const nameMatches = hasManual && hasExport;
      const priceMatches =
        hasManual &&
        hasExport &&
        manualPriceData?.price !== null &&
        exportPriceData?.price !== null &&
        manualPriceData?.price === exportPriceData?.price;

      const hasQuantityMismatch = manualQuantity !== exportQuantity;
      const isMismatch = !nameMatches || !priceMatches || hasQuantityMismatch;

      const comparedRow: ComparedRow = {
        index: comparedRows.length,
        manualPresent: hasManual,
        exportPresent: hasExport,
        manualName: manualTitle,
        exportName: exportTitle,
        manualPrice: manualPriceData?.price ?? null,
        exportPrice: exportPriceData?.price ?? null,
        manualQuantity,
        exportQuantity,
        matchedQuantity,
        nameMatches,
        priceMatches,
        hasQuantityMismatch,
        suggestedExportIndex: null,
        suggestedExportName: '',
        suggestionConfidence: null,
        hasHighConfidenceSuggestion: false,
      };

      comparedRows.push(comparedRow);

      if (isMismatch) {
        mismatches.push(comparedRow);

        if (!nameMatches) {
          titleMismatchCount += 1;
          missingRowCount += 1;
        }

        if (!priceMatches || hasQuantityMismatch) {
          priceMismatchCount += 1;
        }
        return;
      }

      perfectMatchCount += 1;
    });
  });

  const unmatchedExportRows: ExportSearchRow[] = sortedGroups
    .filter((group) => group.manualEntries.length === 0 && group.exportEntries.length > 0)
    .map((group) => ({
      exportIndex: group.exportEntries[0]?.index ?? -1,
      exportName: group.exportEntries[0]?.title ?? '',
    }))
    .filter((row) => row.exportIndex >= 0);

  const unmatchedTokenIndex = new Map<string, number[]>();
  unmatchedExportRows.forEach(({ exportIndex, exportName }) => {
    tokenizeTitle(exportName).forEach((token) => {
      const queue = unmatchedTokenIndex.get(token);
      if (queue) {
        queue.push(exportIndex);
        return;
      }

      unmatchedTokenIndex.set(token, [exportIndex]);
    });
  });

  mismatches.forEach((row) => {
    if (!row.manualPresent || row.nameMatches) {
      return;
    }

    const suggestion = findBestFuzzySuggestion(row.manualName, unmatchedExportRows, unmatchedTokenIndex);
    if (!suggestion) {
      return;
    }

    row.suggestedExportIndex = suggestion.exportIndex;
    row.suggestedExportName = suggestion.exportName;
    row.suggestionConfidence = suggestion.confidence;
    row.hasHighConfidenceSuggestion = suggestion.confidence >= HIGH_CONFIDENCE_THRESHOLD;

    if (row.hasHighConfidenceSuggestion) {
      highConfidenceSuggestionCount += 1;
    }
  });

  const comparedRowCount = comparedRows.length;

  return {
    totalManualRows: manualRows.length,
    totalExportRows: exportRows.length,
    comparedRowCount,
    perfectMatchCount,
    mismatchCount: mismatches.length,
    titleMismatchCount,
    priceMismatchCount,
    missingRowCount,
    highConfidenceSuggestionCount,
    hasExactTitleAndPriceMatch: mismatches.length === 0,
    mismatches,
  };
}