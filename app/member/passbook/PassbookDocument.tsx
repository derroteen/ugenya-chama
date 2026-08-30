import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PassbookData } from "./actions";

type PassbookDocumentProps = {
  passbook: PassbookData;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#0f1729",
    fontFamily: "Helvetica",
    fontSize: 7,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 22,
  },
  header: {
    borderBottom: "1 solid #c9a227",
    marginBottom: 12,
    paddingBottom: 10,
  },
  eyebrow: {
    color: "#c9a227",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#0f1729",
    fontSize: 18,
    fontWeight: 700,
    marginTop: 4,
  },
  subtitle: {
    color: "#475569",
    fontSize: 8,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldLabel: {
    color: "#334155",
    fontSize: 8,
    fontWeight: 700,
    marginRight: 6,
  },
  fieldValue: {
    color: "#0f1729",
    fontSize: 8,
  },
  section: {
    marginTop: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#1d3a8a",
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
  },
  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableRow: {
    alignItems: "stretch",
    borderBottom: "1 solid #e2e8f0",
    flexDirection: "row",
  },
  headerRow: {
    backgroundColor: "#0f1729",
    borderBottom: "1 solid #0f1729",
  },
  cell: {
    borderRight: "1 solid #e2e8f0",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  lastCell: {
    borderRight: 0,
  },
  headerCellText: {
    color: "#ffffff",
    fontSize: 6.4,
    fontWeight: 700,
  },
  bodyCellText: {
    color: "#0f1729",
    fontSize: 7,
  },
  rightAligned: {
    textAlign: "right",
  },
  footer: {
    color: "#475569",
    fontSize: 6.5,
    marginTop: 12,
    borderTop: "1 solid #c9a227",
    paddingTop: 8,
  },
  emptyState: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: "#f8fafc",
  },
  emptyStateText: {
    color: "#475569",
    fontSize: 8,
  },
});

const savingsColumns = [
  { key: "month", label: "Month", width: "16.6%" },
  { key: "kbgSharesBf", label: "KBG Shares B/F", width: "16.7%" },
  { key: "oldSavingsBf", label: "Old Savings B/F", width: "16.7%" },
  { key: "previousBalanceBf", label: "Previous Balance B/F", width: "16.7%" },
  { key: "subs", label: "Subs", width: "16.7%" },
  { key: "cumulativeSaving", label: "Cumulative Saving", width: "16.6%" },
] as const;

const emergencyColumns = [
  { key: "month", label: "Month", width: "20%" },
  { key: "previousEmergBf", label: "Previous Emerg B/F", width: "20%" },
  { key: "emergSubs", label: "Emerg Subs", width: "20%" },
  { key: "withdrawal", label: "Withdrawal", width: "20%" },
  { key: "emergencyBalance", label: "Emergency Balance", width: "20%" },
] as const;

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMonthLabel(month: string) {
  if (!month) {
    return "All months";
  }

  const date = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return month;

  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderTable(
  title: string,
  rows: Array<Record<string, string | number>>,
  columns: ReadonlyArray<{ key: string; label: string; width: string }>
) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {rows.length === 0 ? (
        <View style={styles.emptyState} wrap={false}>
          <Text style={styles.emptyStateText}>No records found for the selected range.</Text>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.headerRow]} wrap={false}>
            {columns.map((column, index) => (
              <View
                key={column.key}
                style={[styles.cell, { width: column.width }, ...(index === columns.length - 1 ? [styles.lastCell] : [])]}
              >
                <Text style={styles.headerCellText}>{column.label}</Text>
              </View>
            ))}
          </View>

          {rows.map((row, index) => (
            <View key={`${title}-${row.month ?? index}`} style={styles.tableRow} wrap={false}>
              {columns.map((column, columnIndex) => {
                const value = row[column.key];
                const cellText = typeof value === "number" ? formatAmount(value) : String(value ?? "-");
                const isRightAligned = typeof value === "number";
                const textStyle = isRightAligned ? [styles.bodyCellText, styles.rightAligned] : styles.bodyCellText;

                return (
                  <View
                    key={`${title}-${column.key}-${index}`}
                    style={[
                      styles.cell,
                      { width: column.width },
                      ...(columnIndex === columns.length - 1 ? [styles.lastCell] : []),
                    ]}
                  >
                    <Text style={textStyle}>{cellText}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function PassbookDocument({ passbook }: PassbookDocumentProps) {
  const savingsRows = passbook.savingsRows.map((row) => ({
    month: row.month,
    kbgSharesBf: row.kbgSharesBf,
    oldSavingsBf: row.oldSavingsBf,
    previousBalanceBf: row.previousBalanceBf,
    subs: row.subs,
    cumulativeSaving: row.cumulativeSaving,
  }));

  const emergencyRows = passbook.emergencyRows.map((row) => ({
    month: row.month,
    previousEmergBf: row.previousEmergBf,
    emergSubs: row.emergSubs,
    withdrawal: row.withdrawal,
    emergencyBalance: row.emergencyBalance,
  }));

  const rangeLabel = `${formatMonthLabel(passbook.fromMonth) || "All months"} - ${formatMonthLabel(passbook.toMonth) || "All months"}`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.eyebrow}>Ugenya Association Eldoret</Text>
          <Text style={styles.title}>Personal Contribution Passbook</Text>
          <Text style={styles.subtitle}>{passbook.memberName} • Member ID: {passbook.memberId} • Branch: {passbook.branchName}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Range:</Text>
            <Text style={styles.fieldValue}>{rangeLabel}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Covered:</Text>
            <Text style={styles.fieldValue}>{passbook.fromMonth || "All months"} to {passbook.toMonth || "All months"}</Text>
          </View>
        </View>

        {renderTable("Savings Passbook", savingsRows, savingsColumns)}
        {renderTable("Emergency Fund Passbook", emergencyRows, emergencyColumns)}

        <Text style={styles.footer}>Generated: {formatGeneratedAt(new Date().toISOString())}</Text>
      </Page>
    </Document>
  );
}
