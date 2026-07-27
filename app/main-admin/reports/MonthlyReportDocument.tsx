import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { MonthlyReportData, MonthlyReportTotals } from "./actions";

type MonthlyReportDocumentProps = {
  report: MonthlyReportData;
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
    marginBottom: 14,
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
    fontSize: 16,
    fontWeight: 700,
    marginTop: 4,
  },
  subtitle: {
    color: "#475569",
    fontSize: 8,
    marginTop: 4,
  },
  branchSection: {
    marginBottom: 14,
  },
  branchTitle: {
    color: "#1d3a8a",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  noteBox: {
    backgroundColor: "#f8fafc",
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  noteText: {
    color: "#475569",
    fontSize: 8,
  },
  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  row: {
    alignItems: "stretch",
    borderBottom: "1 solid #e2e8f0",
    flexDirection: "row",
  },
  headerRow: {
    backgroundColor: "#0f1729",
    borderBottom: "1 solid #0f1729",
  },
  totalsRow: {
    backgroundColor: "#f8fbff",
  },
  lastRow: {
    borderBottom: "0 solid transparent",
  },
  cell: {
    borderRight: "1 solid #e2e8f0",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  lastCell: {
    borderRight: "0 solid transparent",
  },
  headerCellText: {
    color: "#ffffff",
    fontSize: 6.5,
    fontWeight: 700,
  },
  bodyCellText: {
    color: "#0f1729",
    fontSize: 7,
  },
  totalsCellText: {
    color: "#0f1729",
    fontSize: 7,
    fontWeight: 700,
  },
  rightAligned: {
    textAlign: "right",
  },
  summarySection: {
    borderTop: "1 solid #c9a227",
    marginTop: 6,
    paddingTop: 10,
  },
  summaryTable: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    marginTop: 6,
    overflow: "hidden",
  },
  summaryLabelCell: {
    width: "34%",
  },
  summaryValueCell: {
    width: "13.2%",
  },
});

const columns = [
  { key: "number", label: "No.", width: "4%", align: "left" as const },
  { key: "name", label: "Name", width: "18%", align: "left" as const },
  { key: "memberId", label: "Member ID", width: "8%", align: "left" as const },
  { key: "kbgSharesBf", label: "KBG Shares B/F", width: "7.8%", align: "right" as const },
  { key: "oldSavingsBf", label: "Old Savings B/F", width: "7.8%", align: "right" as const },
  { key: "previousBalanceBf", label: "Previous Balance B/F", width: "7.8%", align: "right" as const },
  { key: "subs", label: "Subs", width: "7.8%", align: "right" as const },
  { key: "cumulativeSaving", label: "Cumulative Saving", width: "7.8%", align: "right" as const },
  { key: "previousEmergBf", label: "Previous Emerg B/F", width: "7.8%", align: "right" as const },
  { key: "emergSubs", label: "Emerg Subs", width: "7.8%", align: "right" as const },
  { key: "withdrawal", label: "Withdrawal", width: "7.8%", align: "right" as const },
  { key: "emergencyBalance", label: "Emergency Balance", width: "7.8%", align: "right" as const },
];

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderSummaryTotals(totals: MonthlyReportTotals) {
  return [
    { label: "Subs", value: formatAmount(totals.subs) },
    { label: "Cumulative Saving", value: formatAmount(totals.cumulativeSaving) },
    { label: "Emerg Subs", value: formatAmount(totals.emergSubs) },
    { label: "Withdrawal", value: formatAmount(totals.withdrawal) },
    { label: "Emergency Balance", value: formatAmount(totals.emergencyBalance) },
  ];
}

export default function MonthlyReportDocument({ report }: MonthlyReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.eyebrow}>Ugenya Association Eldoret</Text>
          <Text style={styles.title}>Ugenya Association Eldoret - Monthly Report - {report.monthLabel}</Text>
          <Text style={styles.subtitle}>Generated: {formatGeneratedAt(report.generatedAt)}</Text>
        </View>

        {report.branches.map((branch) => (
          <View key={branch.branchId} style={styles.branchSection}>
            <Text style={styles.branchTitle}>{branch.branchName}</Text>

            {branch.rows.length === 0 ? (
              <View style={styles.noteBox} wrap={false}>
                <Text style={styles.noteText}>{branch.note ?? "No entries recorded."}</Text>
              </View>
            ) : (
              <View style={styles.table}>
                <View style={[styles.row, styles.headerRow]} wrap={false}>
                  {columns.map((column, index) => (
                    <View
                      key={column.key}
                      style={[
                        styles.cell,
                        { width: column.width },
                        ...(index === columns.length - 1 ? [styles.lastCell] : []),
                      ]}
                    >
                      <Text style={styles.headerCellText}>{column.label}</Text>
                    </View>
                  ))}
                </View>

                {branch.rows.map((row, index) => {
                  return (
                    <View
                      key={`${branch.branchId}-${row.memberId}`}
                      style={styles.row}
                      wrap={false}
                    >
                      <View style={[styles.cell, { width: columns[0].width }]}>
                        <Text style={styles.bodyCellText}>{index + 1}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[1].width }]}>
                        <Text style={styles.bodyCellText}>{row.memberName}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[2].width }]}>
                        <Text style={styles.bodyCellText}>{row.memberNo}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[3].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.kbgSharesBf)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[4].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.oldSavingsBf)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[5].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.previousBalanceBf)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[6].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.subs)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[7].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.cumulativeSaving)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[8].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.previousEmergBf)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[9].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.emergSubs)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[10].width }]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.withdrawal)}</Text>
                      </View>
                      <View style={[styles.cell, { width: columns[11].width }, styles.lastCell]}>
                        <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.emergencyBalance)}</Text>
                      </View>
                    </View>
                  );
                })}

                <View style={[styles.row, styles.totalsRow, styles.lastRow]} wrap={false}>
                  <View style={[styles.cell, { width: columns[0].width }]}>
                    <Text style={styles.totalsCellText} />
                  </View>
                  <View style={[styles.cell, { width: columns[1].width }]}>
                    <Text style={styles.totalsCellText}>Totals</Text>
                  </View>
                  <View style={[styles.cell, { width: columns[2].width }]}>
                    <Text style={styles.totalsCellText} />
                  </View>
                  <View style={[styles.cell, { width: columns[3].width }]}>
                    <Text style={styles.totalsCellText} />
                  </View>
                  <View style={[styles.cell, { width: columns[4].width }]}>
                    <Text style={styles.totalsCellText} />
                  </View>
                  <View style={[styles.cell, { width: columns[5].width }]}>
                    <Text style={styles.totalsCellText} />
                  </View>
                  <View style={[styles.cell, { width: columns[6].width }]}>
                    <Text style={[styles.totalsCellText, styles.rightAligned]}>{formatAmount(branch.totals.subs)}</Text>
                  </View>
                  <View style={[styles.cell, { width: columns[7].width }]}>
                    <Text style={[styles.totalsCellText, styles.rightAligned]}>{formatAmount(branch.totals.cumulativeSaving)}</Text>
                  </View>
                  <View style={[styles.cell, { width: columns[8].width }]}>
                    <Text style={styles.totalsCellText} />
                  </View>
                  <View style={[styles.cell, { width: columns[9].width }]}>
                    <Text style={[styles.totalsCellText, styles.rightAligned]}>{formatAmount(branch.totals.emergSubs)}</Text>
                  </View>
                  <View style={[styles.cell, { width: columns[10].width }]}>
                    <Text style={[styles.totalsCellText, styles.rightAligned]}>{formatAmount(branch.totals.withdrawal)}</Text>
                  </View>
                  <View style={[styles.cell, { width: columns[11].width }, styles.lastCell]}>
                    <Text style={[styles.totalsCellText, styles.rightAligned]}>{formatAmount(branch.totals.emergencyBalance)}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        <View style={styles.summarySection}>
          <Text style={styles.branchTitle}>Association-Wide Totals</Text>
          <View style={styles.summaryTable} wrap={false}>
            <View style={[styles.row, styles.headerRow]} wrap={false}>
              <View style={[styles.cell, styles.summaryLabelCell]}>
                <Text style={styles.headerCellText}>Metric</Text>
              </View>
              <View style={[styles.cell, styles.summaryValueCell, styles.lastCell]}>
                <Text style={styles.headerCellText}>Amount</Text>
              </View>
            </View>

            {renderSummaryTotals(report.grandTotals).map((item, index, items) => (
              <View
                key={item.label}
                style={[styles.row, ...(index === items.length - 1 ? [styles.lastRow] : [])]}
                wrap={false}
              >
                <View style={[styles.cell, styles.summaryLabelCell]}>
                  <Text style={styles.bodyCellText}>{item.label}</Text>
                </View>
                <View style={[styles.cell, styles.summaryValueCell, styles.lastCell]}>
                  <Text style={[styles.totalsCellText, styles.rightAligned]}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}