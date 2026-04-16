type RawRecord = Record<string, unknown>;

export type ComparedRow = {
  index: number;
  matchKey: string;
  manualPresent: boolean;
  exportPresent: boolean;
  manualName: string;
  exportName: string;
  manualPrice: number | null;
  exportPrice: number | null;
  manualQuantity: number;
  exportQuantity: number;
  matchedQuantity: number;
  manualRowCount: number;
  exportRowCount: number;
  manualSampleRow: number | null;
  exportSampleRow: number | null;
  nameMatches: boolean;
  priceMatches: boolean;
  hasActualPriceMismatch: boolean;
  hasQuantityMismatch: boolean;
  suggestedExportIndex: number | null;
  suggestedExportName: string;
  suggestionConfidence: number | null;
  hasHighConfidenceSuggestion: boolean;
};

export type BigOrderComparison = {
  totalManualRows: number;
  totalExportRows: number;
  totalManualCost: number;
  totalExportCost: number;
  totalCostDelta: number;
  comparedRowCount: number;
  perfectMatchCount: number;
  mismatchCount: number;
  titleMismatchCount: number;
  priceMismatchCount: number;
  quantityMismatchCount: number;
  fuzzySuggestionCount: number;
  missingRowCount: number;
  highConfidenceSuggestionCount: number;
  hasExactTitleAndPriceMatch: boolean;
  mismatches: ComparedRow[];
};

function toTrimmedString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return String(value).trim();
}

function normalizeSemanticTitle(value: string): string {
  return toTrimmedString(value)
    .replace(/\bCapicorn\b/gi, 'Capricorn')
    .replace(/^11:11:00$/i, '11:11')
    .replace(/\bDiamond Cut\s+/gi, '')
    .replace(/\bPaperClip\b/gi, 'Paper Clip')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMatchText(value: string): string {
  return normalizeSemanticTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
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

function tokenizeTitle(value: string): string[] {
  const loose = normalizeSemanticTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!loose) {
    return [];
  }

  return loose.split(/\s+/g).filter(Boolean);
}

function buildBigrams(value: string): Set<string> {
  const compact = normalizeSemanticTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
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

  const manualCompact = normalizeMatchText(manualName);
  const exportCompact = normalizeMatchText(exportName);

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
  exportIndex: number | null;
  exportName: string;
  exportQuantity: number;
  exportPrice: number | null;
};

function findBestFuzzySuggestion(
  manualName: string,
  manualQuantity: number,
  manualPrice: number | null,
  availableExportRows: ExportSearchRow[],
  tokenIndex: Map<string, string[]>,
): { exportIndex: number | null; exportName: string; confidence: number } | null {
  if (availableExportRows.length === 0) {
    return null;
  }

  const manualTokens = tokenizeTitle(manualName);
  const candidateNames = new Set<string>();

  manualTokens.forEach((token) => {
    const matches = tokenIndex.get(token);
    if (!matches) {
      return;
    }

    matches.forEach((name) => {
      candidateNames.add(name);
    });
  });

  const candidates =
    candidateNames.size > 0
      ? availableExportRows.filter((row) => candidateNames.has(row.exportName))
      : availableExportRows;

  let bestMatch: { exportIndex: number | null; exportName: string; confidence: number } | null = null;

  candidates.forEach((candidate) => {
    const nameScore = scoreTitleSimilarity(manualName, candidate.exportName);
    const quantityBase = Math.max(manualQuantity, candidate.exportQuantity, 1);
    const quantityScore = 1 - Math.abs(manualQuantity - candidate.exportQuantity) / quantityBase;

    let priceScore = 0.5;
    if (manualPrice !== null && candidate.exportPrice !== null) {
      priceScore = manualPrice === candidate.exportPrice ? 1 : 0;
    }

    const confidence = Math.max(0, Math.min(1, 0.75 * nameScore + 0.15 * quantityScore + 0.1 * priceScore));

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

function calculateDatasetTotal(rows: RawRecord[], priceField: string, quantityField: string): number {
  return rows.reduce((sum, row) => {
    const price = toPriceNumber(row[priceField]);
    const quantity = toQuantityNumber(row[quantityField]);

    if (price === null) {
      return sum;
    }

    return sum + price * quantity;
  }, 0);
}

function parseLineProperties(raw: unknown): Record<string, string> {
  const text = toTrimmedString(raw);
  if (!text) {
    return {};
  }

  const props: Record<string, string> = {};
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex <= 0) {
        return;
      }

      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      if (key && value) {
        props[key] = value;
      }
    });

  return props;
}

function extractFirstThreeDigitNumber(value: string): string {
  return value.match(/\b\d{3}\b/)?.[0] ?? '';
}

function isGenericPropertyDrivenTitle(title: string): boolean {
  const normalizedTitle = normalizeSemanticTitle(title).toLowerCase();
  return ['angel numbers', 'astrological sign', 'zodiac constellations'].includes(normalizedTitle);
}

function extractAngelHintsFromProps(props: Record<string, string>): string[] {
  const hints: string[] = [];
  Object.entries(props).forEach(([key, value]) => {
    if (!key.includes('angel number')) {
      return;
    }

    hints.push(value);
    const digitMatch = value.match(/\b\d{3}\b/);
    if (digitMatch) {
      hints.push(digitMatch[0]);
    }
  });

  return hints;
}

function extractAngelHintsFromManualRow(row: RawRecord): string[] {
  const hints: string[] = [];
  const variation = toTrimmedString(row['Variation Name']);
  if (variation) {
    const variationNumber = variation.match(/\b\d{3}\b/);
    if (variationNumber) {
      hints.push(variationNumber[0]);
    }
  }

  Object.keys(row).forEach((key) => {
    const normalizedKey = key.toLowerCase();
    if (!normalizedKey.includes('angel number')) {
      return;
    }

    const value = toTrimmedString(row[key]);
    if (value) {
      hints.push(value);
      const numberMatch = value.match(/\b\d{3}\b/);
      if (numberMatch) {
        hints.push(numberMatch[0]);
      }
    }
  });

  return [...new Set(hints.filter(Boolean))];
}

function extractSignHintsFromProps(props: Record<string, string>): string[] {
  const sign = toTrimmedString(props['sign']);
  if (!sign) {
    return [];
  }

  return [normalizeSemanticTitle(sign)];
}

function buildCanonicalTitle(baseTitle: string, hints: string[]): string {
  const cleanTitle = normalizeSemanticTitle(baseTitle);
  if (!cleanTitle) {
    return '';
  }

  const normalizedBase = cleanTitle.toLowerCase();

  if (normalizedBase === 'angel numbers') {
    const numberHint = hints.map(extractFirstThreeDigitNumber).find(Boolean);
    if (numberHint) {
      return `${numberHint} Angel Numbers`;
    }
  }

  if (normalizedBase === 'astrological sign') {
    const signHint = hints.find(Boolean);
    if (signHint) {
      return `${signHint} Astrological Sign`;
    }
  }

  if (normalizedBase === 'zodiac constellations') {
    const signHint = hints.find(Boolean);
    if (signHint) {
      return `${signHint} Zodiac Constellations`;
    }
  }

  return cleanTitle;
}

function buildComparableName(baseTitle: string, hints: string[]): string {
  const canonicalTitle = buildCanonicalTitle(baseTitle, hints);
  if (canonicalTitle) {
    return canonicalTitle;
  }

  const cleanTitle = normalizeSemanticTitle(baseTitle);
  const titleKey = normalizeMatchText(cleanTitle);
  const parts = [cleanTitle];

  hints.forEach((hint) => {
    const cleanHint = toTrimmedString(hint);
    if (!cleanHint) {
      return;
    }

    const hintKey = normalizeMatchText(cleanHint);
    if (!hintKey || titleKey.includes(hintKey)) {
      return;
    }

    parts.push(cleanHint);
  });

  return parts.join(' ').trim();
}

function makeDisplayName(baseTitle: string, comparableName: string): string {
  if (isGenericPropertyDrivenTitle(baseTitle) && toTrimmedString(comparableName)) {
    return normalizeSemanticTitle(comparableName);
  }

  if (toTrimmedString(baseTitle)) {
    return normalizeSemanticTitle(baseTitle);
  }

  return normalizeSemanticTitle(comparableName) || '(blank title)';
}

export function compareBigOrderDatasets(
  manualRows: RawRecord[],
  exportRows: RawRecord[],
): BigOrderComparison {
  const HIGH_CONFIDENCE_THRESHOLD = 0.72;
  const totalManualCost = calculateDatasetTotal(manualRows, 'Unit Cost', 'Quantity Ordered');
  const totalExportCost = calculateDatasetTotal(exportRows, 'Line: Price', 'Line: Quantity');

  type PriceBucket = {
    price: number | null;
    quantity: number;
    rowCount: number;
    sampleRow: number | null;
  };

  type TitleGroup = {
    titleKey: string;
    displayName: string;
    comparableName: string;
    buckets: Map<string, PriceBucket>;
  };

  const manualGroups = new Map<string, TitleGroup>();
  const exportGroups = new Map<string, TitleGroup>();

  function upsertGroup(
    target: Map<string, TitleGroup>,
    titleKey: string,
    displayName: string,
    comparableName: string,
    price: number | null,
    quantity: number,
    rowNumber: number,
  ) {
    const priceKey = price === null ? 'null' : String(price);
    let group = target.get(titleKey);

    if (!group) {
      group = {
        titleKey,
        displayName,
        comparableName,
        buckets: new Map(),
      };
      target.set(titleKey, group);
    }

    const existingBucket = group.buckets.get(priceKey);
    if (existingBucket) {
      existingBucket.quantity += quantity;
      existingBucket.rowCount += 1;
      return;
    }

    group.buckets.set(priceKey, {
      price,
      quantity,
      rowCount: 1,
      sampleRow: rowNumber,
    });
  }

  manualRows.forEach((row, index) => {
    const title = toTrimmedString(row['Item Name']);
    const angelHints = extractAngelHintsFromManualRow(row);
    const comparableName = buildComparableName(title, angelHints);
    const displayName = makeDisplayName(title, comparableName);
    const titleKey = normalizeMatchText(comparableName || title);

    upsertGroup(
      manualGroups,
      titleKey,
      displayName,
      comparableName || displayName,
      toPriceNumber(row['Unit Cost']),
      toQuantityNumber(row['Quantity Ordered']),
      index + 1,
    );
  });

  exportRows.forEach((row, index) => {
    const title = toTrimmedString(row['Line: Title']);
    const props = parseLineProperties(row['Line: Properties']);
    const angelHints = extractAngelHintsFromProps(props);
    const signHints = extractSignHintsFromProps(props);
    const comparableName = buildComparableName(title, [...angelHints, ...signHints]);
    const displayName = makeDisplayName(title, comparableName);
    const titleKey = normalizeMatchText(comparableName || title);

    upsertGroup(
      exportGroups,
      titleKey,
      displayName,
      comparableName || displayName,
      toPriceNumber(row['Line: Price']),
      toQuantityNumber(row['Line: Quantity']),
      index + 1,
    );
  });

  const mismatches: ComparedRow[] = [];
  const comparedRows: ComparedRow[] = [];

  let perfectMatchCount = 0;
  let titleMismatchCount = 0;
  let priceMismatchCount = 0;
  let quantityMismatchCount = 0;
  let fuzzySuggestionCount = 0;
  let missingRowCount = 0;
  let highConfidenceSuggestionCount = 0;

  const unionTitleKeys = new Set<string>([...manualGroups.keys(), ...exportGroups.keys()]);
  const sortedTitleKeys = [...unionTitleKeys].sort((a, b) => a.localeCompare(b));

  const pushComparedRow = (input: Omit<ComparedRow, 'index' | 'suggestedExportIndex' | 'suggestedExportName' | 'suggestionConfidence' | 'hasHighConfidenceSuggestion'>) => {
    const comparedRow: ComparedRow = {
      ...input,
      index: comparedRows.length,
      suggestedExportIndex: null,
      suggestedExportName: '',
      suggestionConfidence: null,
      hasHighConfidenceSuggestion: false,
    };

    comparedRows.push(comparedRow);

    const isMismatch = !comparedRow.nameMatches || !comparedRow.priceMatches || comparedRow.hasQuantityMismatch;
    if (!isMismatch) {
      perfectMatchCount += 1;
      return;
    }

    mismatches.push(comparedRow);

    if (!comparedRow.nameMatches) {
      titleMismatchCount += 1;
      missingRowCount += 1;
    }
    if (comparedRow.hasActualPriceMismatch) {
      priceMismatchCount += 1;
    }
    if (comparedRow.hasQuantityMismatch) {
      quantityMismatchCount += 1;
    }
  };

  sortedTitleKeys.forEach((titleKey) => {
    const manualGroup = manualGroups.get(titleKey);
    const exportGroup = exportGroups.get(titleKey);

    if (!manualGroup || !exportGroup) {
      const sourceGroup = manualGroup ?? exportGroup;
      if (!sourceGroup) {
        return;
      }

      sourceGroup.buckets.forEach((bucket, priceKey) => {
        const manualPresent = Boolean(manualGroup);
        const exportPresent = Boolean(exportGroup);

        pushComparedRow({
          matchKey: `${titleKey}|${priceKey}|missing-side`,
          manualPresent,
          exportPresent,
          manualName: manualGroup?.displayName ?? '',
          exportName: exportGroup?.displayName ?? '',
          manualPrice: manualGroup ? bucket.price : null,
          exportPrice: exportGroup ? bucket.price : null,
          manualQuantity: manualGroup ? bucket.quantity : 0,
          exportQuantity: exportGroup ? bucket.quantity : 0,
          matchedQuantity: 0,
          manualRowCount: manualGroup ? bucket.rowCount : 0,
          exportRowCount: exportGroup ? bucket.rowCount : 0,
          manualSampleRow: manualGroup ? bucket.sampleRow : null,
          exportSampleRow: exportGroup ? bucket.sampleRow : null,
          nameMatches: false,
          priceMatches: false,
          hasActualPriceMismatch: false,
          hasQuantityMismatch: true,
        });
      });

      return;
    }

    const manualMutable = new Map(
      [...manualGroup.buckets.entries()].map(([key, bucket]) => [key, { ...bucket }]),
    );
    const exportMutable = new Map(
      [...exportGroup.buckets.entries()].map(([key, bucket]) => [key, { ...bucket }]),
    );

    // Exact price-to-price pairing first.
    manualMutable.forEach((manualBucket, priceKey) => {
      const exportBucket = exportMutable.get(priceKey);
      if (!exportBucket || manualBucket.quantity <= 0 || exportBucket.quantity <= 0) {
        return;
      }

      const matched = Math.min(manualBucket.quantity, exportBucket.quantity);
      pushComparedRow({
        matchKey: `${titleKey}|${priceKey}|exact`,
        manualPresent: true,
        exportPresent: true,
        manualName: manualGroup.displayName,
        exportName: exportGroup.displayName,
        manualPrice: manualBucket.price,
        exportPrice: exportBucket.price,
        manualQuantity: matched,
        exportQuantity: matched,
        matchedQuantity: matched,
        manualRowCount: manualBucket.rowCount,
        exportRowCount: exportBucket.rowCount,
        manualSampleRow: manualBucket.sampleRow,
        exportSampleRow: exportBucket.sampleRow,
        nameMatches: true,
        priceMatches: true,
        hasActualPriceMismatch: false,
        hasQuantityMismatch: false,
      });

      manualBucket.quantity -= matched;
      exportBucket.quantity -= matched;
    });

    const manualRemainders = [...manualMutable.values()].filter((bucket) => bucket.quantity > 0);
    const exportRemainders = [...exportMutable.values()].filter((bucket) => bucket.quantity > 0);

    // Cross-price pairing to avoid false quantity mismatches when totals align but price buckets differ.
    let manualIndex = 0;
    let exportIndex = 0;

    while (manualIndex < manualRemainders.length && exportIndex < exportRemainders.length) {
      const manualBucket = manualRemainders[manualIndex];
      const exportBucket = exportRemainders[exportIndex];

      const matched = Math.min(manualBucket.quantity, exportBucket.quantity);
      pushComparedRow({
        matchKey: `${titleKey}|cross-price|${manualIndex}-${exportIndex}`,
        manualPresent: true,
        exportPresent: true,
        manualName: manualGroup.displayName,
        exportName: exportGroup.displayName,
        manualPrice: manualBucket.price,
        exportPrice: exportBucket.price,
        manualQuantity: matched,
        exportQuantity: matched,
        matchedQuantity: matched,
        manualRowCount: manualBucket.rowCount,
        exportRowCount: exportBucket.rowCount,
        manualSampleRow: manualBucket.sampleRow,
        exportSampleRow: exportBucket.sampleRow,
        nameMatches: true,
        priceMatches:
          manualBucket.price !== null && exportBucket.price !== null && manualBucket.price === exportBucket.price,
        hasActualPriceMismatch:
          manualBucket.price !== null && exportBucket.price !== null && manualBucket.price !== exportBucket.price,
        hasQuantityMismatch: false,
      });

      manualBucket.quantity -= matched;
      exportBucket.quantity -= matched;

      if (manualBucket.quantity <= 0) {
        manualIndex += 1;
      }
      if (exportBucket.quantity <= 0) {
        exportIndex += 1;
      }
    }

    // Any leftovers are real quantity mismatches.
    manualRemainders
      .filter((bucket) => bucket.quantity > 0)
      .forEach((bucket, remainderIndex) => {
        pushComparedRow({
          matchKey: `${titleKey}|manual-leftover|${remainderIndex}`,
          manualPresent: true,
          exportPresent: false,
          manualName: manualGroup.displayName,
          exportName: '',
          manualPrice: bucket.price,
          exportPrice: null,
          manualQuantity: bucket.quantity,
          exportQuantity: 0,
          matchedQuantity: 0,
          manualRowCount: bucket.rowCount,
          exportRowCount: 0,
          manualSampleRow: bucket.sampleRow,
          exportSampleRow: null,
          nameMatches: false,
          priceMatches: false,
          hasActualPriceMismatch: false,
          hasQuantityMismatch: true,
        });
      });

    exportRemainders
      .filter((bucket) => bucket.quantity > 0)
      .forEach((bucket, remainderIndex) => {
        pushComparedRow({
          matchKey: `${titleKey}|export-leftover|${remainderIndex}`,
          manualPresent: false,
          exportPresent: true,
          manualName: '',
          exportName: exportGroup.displayName,
          manualPrice: null,
          exportPrice: bucket.price,
          manualQuantity: 0,
          exportQuantity: bucket.quantity,
          matchedQuantity: 0,
          manualRowCount: 0,
          exportRowCount: bucket.rowCount,
          manualSampleRow: null,
          exportSampleRow: bucket.sampleRow,
          nameMatches: false,
          priceMatches: false,
          hasActualPriceMismatch: false,
          hasQuantityMismatch: true,
        });
      });
  });

  const unmatchedExportRows: ExportSearchRow[] = mismatches
    .filter((row) => !row.nameMatches && row.exportPresent)
    .map((row) => ({
      exportIndex: row.exportSampleRow,
      exportName: row.exportName,
      exportQuantity: row.exportQuantity,
      exportPrice: row.exportPrice,
    }));

  const unmatchedTokenIndex = new Map<string, string[]>();
  unmatchedExportRows.forEach(({ exportIndex, exportName }) => {
    tokenizeTitle(exportName).forEach((token) => {
      const queue = unmatchedTokenIndex.get(token);
      if (queue) {
        queue.push(exportName);
        return;
      }

      unmatchedTokenIndex.set(token, [exportName]);
    });
  });

  mismatches.forEach((row) => {
    if (!row.manualPresent || row.nameMatches) {
      return;
    }

    const suggestion = findBestFuzzySuggestion(
      row.manualName,
      row.manualQuantity,
      row.manualPrice,
      unmatchedExportRows,
      unmatchedTokenIndex,
    );
    if (!suggestion) {
      return;
    }

    row.suggestedExportIndex = suggestion.exportIndex;
    row.suggestedExportName = suggestion.exportName;
    row.suggestionConfidence = suggestion.confidence;
    row.hasHighConfidenceSuggestion = suggestion.confidence >= HIGH_CONFIDENCE_THRESHOLD;
    fuzzySuggestionCount += 1;

    if (row.hasHighConfidenceSuggestion) {
      highConfidenceSuggestionCount += 1;
    }
  });

  const comparedRowCount = comparedRows.length;

  return {
    totalManualRows: manualRows.length,
    totalExportRows: exportRows.length,
    totalManualCost,
    totalExportCost,
    totalCostDelta: totalManualCost - totalExportCost,
    comparedRowCount,
    perfectMatchCount,
    mismatchCount: mismatches.length,
    titleMismatchCount,
    priceMismatchCount,
    quantityMismatchCount,
    fuzzySuggestionCount,
    missingRowCount,
    highConfidenceSuggestionCount,
    hasExactTitleAndPriceMatch: mismatches.length === 0,
    mismatches,
  };
}