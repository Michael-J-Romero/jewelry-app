import type { CSSProperties } from 'react';
import manualInvoice from '@/data/bigOrder1/manualInvoice.json';
import shopifyExport from '@/data/bigOrder1/shopifyExport.json';
import { compareBigOrderDatasets, type ComparedRow } from '@/lib/big-order-comparison';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatPrice(value: number | null): string {
  if (value === null) {
    return 'missing';
  }

  return currency.format(value);
}

function mismatchReason(
  nameMatches: boolean,
  hasActualPriceMismatch: boolean,
  hasQuantityMismatch: boolean,
): string {
  if (!nameMatches && hasActualPriceMismatch && hasQuantityMismatch) {
    return 'unmatched title + price mismatch + quantity mismatch';
  }

  if (!nameMatches && hasQuantityMismatch) {
    return 'unmatched title or missing row + quantity mismatch';
  }

  if (!nameMatches) {
    return 'unmatched title or missing row';
  }

  if (hasActualPriceMismatch && hasQuantityMismatch) {
    return 'price mismatch + quantity mismatch';
  }

  if (hasQuantityMismatch) {
    return 'quantity mismatch';
  }

  if (hasActualPriceMismatch) {
    return 'price mismatch';
  }

  return 'ok';
}

function quantityLabel(row: ComparedRow): string {
  if (row.manualQuantity === row.exportQuantity) {
    return `${row.matchedQuantity}`;
  }

  return `${row.matchedQuantity} matched (${row.manualQuantity} vs ${row.exportQuantity})`;
}

function formatConfidence(value: number | null): string {
  if (value === null) {
    return 'none';
  }

  return `${Math.round(value * 100)}%`;
}

function suggestionLabel(row: ComparedRow): string {
  if (!row.suggestedExportName) {
    return 'none';
  }

  const exportRowNumber = row.suggestedExportIndex === null ? 'n/a' : String(row.suggestedExportIndex);
  return `${row.suggestedExportName} (export row ${exportRowNumber})`;
}

export default function ResultPage() {
  const result = compareBigOrderDatasets(manualInvoice, shopifyExport);
  const costsMatch = result.totalCostDelta === 0;

  return (
    <main
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 20px 48px',
      }}
    >
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Data Match Results</h1>
          <p style={{ marginTop: 10, color: '#5d5752', maxWidth: 860 }}>
            Comparing invoice Item Name + Unit Cost against export Line: Title + Line: Price by matching titles
            case-insensitively and whitespace-insensitively, expanding generic export titles with key values from
            Line: Properties, then running fuzzy similarity for unresolved titles. Dataset totals below are calculated
            from unit price x quantity on every row.
          </p>
        </div>

        <a href="/api/manual-invoice-export" style={downloadButtonStyle}>
          Download clean invoice CSV
        </a>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        <div style={cardStyle}>
          <small style={labelStyle}>manual rows</small>
          <strong style={valueStyle}>{result.totalManualRows}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>export rows</small>
          <strong style={valueStyle}>{result.totalExportRows}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>manual total cost</small>
          <strong style={valueStyle}>{formatPrice(result.totalManualCost)}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>export total cost</small>
          <strong style={valueStyle}>{formatPrice(result.totalExportCost)}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>total cost delta</small>
          <strong style={valueStyle}>{formatPrice(result.totalCostDelta)}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>perfect matches</small>
          <strong style={valueStyle}>{result.perfectMatchCount}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>total mismatches</small>
          <strong style={valueStyle}>{result.mismatchCount}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>title mismatches</small>
          <strong style={valueStyle}>{result.titleMismatchCount}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>actual price mismatches</small>
          <strong style={valueStyle}>{result.priceMismatchCount}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>quantity mismatches</small>
          <strong style={valueStyle}>{result.quantityMismatchCount}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>fuzzy suggestions</small>
          <strong style={valueStyle}>{result.fuzzySuggestionCount}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>high-confidence fuzzy suggestions</small>
          <strong style={valueStyle}>{result.highConfidenceSuggestionCount}</strong>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <p
          style={{
            margin: 0,
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #ddd4ca',
            background: result.hasExactTitleAndPriceMatch ? '#eef9f1' : '#fff5ee',
            color: '#2e2924',
          }}
        >
          {result.hasExactTitleAndPriceMatch
            ? 'All grouped rows matched by normalized title, price, and quantity totals.'
            : `Mismatch rows found: ${result.mismatchCount}.`}
        </p>
      </section>

      <section style={{ marginTop: 12 }}>
        <p
          style={{
            margin: 0,
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #ddd4ca',
            background: costsMatch ? '#eef9f1' : '#fff5ee',
            color: '#2e2924',
          }}
        >
          {costsMatch
            ? `Dataset totals match at ${formatPrice(result.totalManualCost)}.`
            : `Dataset total difference: ${formatPrice(result.totalCostDelta)} (${formatPrice(
                result.totalManualCost,
              )} manual vs ${formatPrice(result.totalExportCost)} export).`}
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <div style={{ overflowX: 'auto', border: '1px solid #ddd4ca', borderRadius: 10, background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: '#f6efe6' }}>
                <th style={headCellStyle}>comparison row</th>
                <th style={headCellStyle}>manual sample row</th>
                <th style={headCellStyle}>export sample row</th>
                <th style={headCellStyle}>reason</th>
                <th style={headCellStyle}>manual item</th>
                <th style={headCellStyle}>export title</th>
                <th style={headCellStyle}>manual price</th>
                <th style={headCellStyle}>export price</th>
                <th style={headCellStyle}>manual qty</th>
                <th style={headCellStyle}>export qty</th>
                <th style={headCellStyle}>matched qty</th>
                <th style={headCellStyle}>manual rows grouped</th>
                <th style={headCellStyle}>export rows grouped</th>
                <th style={headCellStyle}>fuzzy suggestion</th>
                <th style={headCellStyle}>confidence</th>
              </tr>
            </thead>
            <tbody>
              {result.mismatches.length === 0 ? (
                <tr>
                  <td style={bodyCellStyle} colSpan={15}>
                    No mismatches found.
                  </td>
                </tr>
              ) : (
                result.mismatches.map((row) => (
                  <tr key={row.index}>
                    <td style={bodyCellStyle}>{row.index + 1}</td>
                    <td style={bodyCellStyle}>{row.manualSampleRow === null ? 'missing' : row.manualSampleRow}</td>
                    <td style={bodyCellStyle}>{row.exportSampleRow === null ? 'missing' : row.exportSampleRow}</td>
                    <td style={bodyCellStyle}>
                      {mismatchReason(row.nameMatches, row.hasActualPriceMismatch, row.hasQuantityMismatch)}
                    </td>
                    <td style={bodyCellStyle}>{row.manualPresent ? row.manualName : 'missing manual row'}</td>
                    <td style={bodyCellStyle}>{row.exportPresent ? row.exportName : 'missing export row'}</td>
                    <td style={bodyCellStyle}>{formatPrice(row.manualPrice)}</td>
                    <td style={bodyCellStyle}>{formatPrice(row.exportPrice)}</td>
                    <td style={bodyCellStyle}>{row.manualQuantity}</td>
                    <td style={bodyCellStyle}>{row.exportQuantity}</td>
                    <td style={bodyCellStyle}>{quantityLabel(row)}</td>
                    <td style={bodyCellStyle}>{row.manualRowCount}</td>
                    <td style={bodyCellStyle}>{row.exportRowCount}</td>
                    <td style={bodyCellStyle}>{suggestionLabel(row)}</td>
                    <td style={bodyCellStyle}>{formatConfidence(row.suggestionConfidence)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const cardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #ddd4ca',
  borderRadius: 10,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const downloadButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 18px',
  borderRadius: 999,
  border: '1px solid #bda48a',
  background: '#f6efe6',
  color: '#2e2924',
  textDecoration: 'none',
  fontSize: '0.92rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
};

const labelStyle: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontSize: '0.72rem',
  color: '#756e67',
};

const valueStyle: CSSProperties = {
  fontSize: '1.3rem',
  color: '#221c16',
};

const headCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #ddd4ca',
  color: '#3f3730',
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const bodyCellStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #f0e7dc',
  fontSize: '0.93rem',
  color: '#302a24',
  verticalAlign: 'top',
};