import manualInvoice from '@/data/bigOrder1/manualInvoice.json';

type ManualInvoiceRow = Record<string, unknown>;

const EXPORT_COLUMNS = [
  'Line #',
  'Item Name',
  'Variation',
  'SKU',
  'Options',
  'Unit Cost',
  'Quantity',
  'Line Total',
] as const;

function toTrimmedString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return String(value).trim();
}

function toNumber(value: unknown): number | null {
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

function formatMoney(value: number | null): string {
  if (value === null) {
    return '';
  }

  return value.toFixed(2);
}

function getOptionsLabel(row: ManualInvoiceRow): string {
  const pairs: string[] = [];

  Object.keys(row)
    .filter((key) => /^Option Name \d+$/i.test(key))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .forEach((nameKey) => {
      const suffix = nameKey.match(/\d+/)?.[0] ?? '';
      const valueKey = `Option Value ${suffix}`;
      const name = toTrimmedString(row[nameKey]);
      const value = toTrimmedString(row[valueKey]);

      if (!name && !value) {
        return;
      }

      if (name && value) {
        pairs.push(`${name}: ${value}`);
        return;
      }

      pairs.push(name || value);
    });

  return pairs.join(' | ');
}

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildCsv(): string {
  const lines = [EXPORT_COLUMNS.join(',')];

  manualInvoice.forEach((row, index) => {
    const unitCost = toNumber(row['Unit Cost']);
    const quantity = toNumber(row['Quantity Ordered']) ?? 1;
    const totalCost = toNumber(row['Total Cost']) ?? (unitCost === null ? null : unitCost * quantity);

    const exportRow = [
      String(index + 1),
      toTrimmedString(row['Item Name']),
      toTrimmedString(row['Variation Name']),
      toTrimmedString(row['SKU (BARCODE)']),
      getOptionsLabel(row),
      formatMoney(unitCost),
      String(quantity),
      formatMoney(totalCost),
    ];

    lines.push(exportRow.map(escapeCsvValue).join(','));
  });

  return lines.join('\r\n');
}

export async function GET() {
  const csv = buildCsv();
  const timestamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="manual-invoice-clean-${timestamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}