import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AnnualFinancialReportData } from "./actions";

type AnnualReportDocumentProps = {
  report: AnnualFinancialReportData;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#0f1729",
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  header: {
    borderBottom: "1 solid #c9a227",
    marginBottom: 14,
    paddingBottom: 10,
  },
  eyebrow: {
    color: "#c9a227",
    fontSize: 9,
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
  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  row: {
    borderBottom: "1 solid #e2e8f0",
    flexDirection: "row",
  },
  headerRow: {
    backgroundColor: "#0f1729",
  },
  cell: {
    borderRight: "1 solid #e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: "center",
  },
  monthCell: {
    width: "15%",
  },
  amountCell: {
    width: "14%",
    alignItems: "flex-end",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: 700,
  },
  bodyText: {
    color: "#0f1729",
    fontSize: 7,
  },
  totalRow: {
    backgroundColor: "#fff9e6",
  },
  totalText: {
    color: "#0f1729",
    fontSize: 7,
    fontWeight: 700,
  },
  broughtForwardRow: {
    backgroundColor: "#eef2ff",
  },
  broughtForwardText: {
    color: "#1d3a8a",
    fontSize: 7,
    fontStyle: "italic",
  },
  positionSection: {
    marginBottom: 12,
  },
  positionTitle: {
    color: "#1d3a8a",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  positionGrid: {
    flexDirection: "row",
    gap: 10,
  },
  positionCard: {
    flex: 1,
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  positionCardHighlight: {
    backgroundColor: "#fff9e6",
    borderColor: "#c9a227",
  },
  positionLabel: {
    color: "#475569",
    fontSize: 6.5,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 700,
  },
  positionValue: {
    color: "#0f1729",
    fontSize: 11,
    fontWeight: 700,
    marginTop: 4,
  },
  positionNote: {
    color: "#64748b",
    fontSize: 6.5,
    marginTop: 8,
  },
});

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

export default function AnnualReportDocument({ report }: AnnualReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.eyebrow}>Ugenya Association Eldoret</Text>
          <Text style={styles.title}>Annual Financial Report - {report.year}</Text>
          <Text style={styles.subtitle}>Generated: {formatGeneratedAt(report.generatedAt)}</Text>
        </View>

        <View style={styles.positionSection}>
          <Text style={styles.positionTitle}>Savings Position Summary</Text>
          <View style={styles.positionGrid}>
            <View style={styles.positionCard}>
              <Text style={styles.positionLabel}>2025 Totals</Text>
              <Text style={styles.positionValue}>{formatAmount(report.savingsPosition.priorYearsTotal)}</Text>
            </View>
            <View style={styles.positionCard}>
              <Text style={styles.positionLabel}>{report.year} Total</Text>
              <Text style={styles.positionValue}>{formatAmount(report.savingsPosition.currentYearTotal)}</Text>
            </View>
            <View style={[styles.positionCard, styles.positionCardHighlight]}>
              <Text style={styles.positionLabel}>Grand Total (Savings)</Text>
              <Text style={styles.positionValue}>{formatAmount(report.savingsPosition.grandTotal)}</Text>
            </View>
            <View style={styles.positionCard}>
              <Text style={styles.positionLabel}>{report.year} Total (Emergency Fund)</Text>
              <Text style={styles.positionValue}>{formatAmount(report.emergencyPosition.currentYearTotal)}</Text>
            </View>
          </View>
          <Text style={styles.positionNote}>
            2025 Totals is each member&apos;s fixed old-savings balance carried in from before this system
            tracked contributions month by month.{" "}
            {report.year} Total is everything added since - including, for any stretch of months with no
            monthly records, the brought-forward balance recorded as at the first month that does have
            records.
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <View style={[styles.cell, styles.monthCell]}>
              <Text style={styles.headerText}>Month</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.headerText}>Subs</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.headerText}>Emergency</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.headerText}>Withdrawals</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.headerText}>Business Income</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.headerText}>Business Exp.</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.headerText}>Net Position</Text>
            </View>
          </View>

          {report.rows.map((row) => {
            const rowStyle = row.isBroughtForward ? [styles.row, styles.broughtForwardRow] : [styles.row];
            const textStyle = row.isBroughtForward ? styles.broughtForwardText : styles.bodyText;

            return (
              <View key={row.month} style={rowStyle}>
                <View style={[styles.cell, styles.monthCell]}>
                  <Text style={textStyle}>{row.monthLabel}</Text>
                </View>
                <View style={[styles.cell, styles.amountCell]}>
                  <Text style={textStyle}>{formatAmount(row.totalSubs)}</Text>
                </View>
                <View style={[styles.cell, styles.amountCell]}>
                  <Text style={textStyle}>{formatAmount(row.totalEmergencyContributions)}</Text>
                </View>
                <View style={[styles.cell, styles.amountCell]}>
                  <Text style={textStyle}>{formatAmount(row.totalWithdrawals)}</Text>
                </View>
                <View style={[styles.cell, styles.amountCell]}>
                  <Text style={textStyle}>{formatAmount(row.businessIncome)}</Text>
                </View>
                <View style={[styles.cell, styles.amountCell]}>
                  <Text style={textStyle}>{formatAmount(row.businessExpenses)}</Text>
                </View>
                <View style={[styles.cell, styles.amountCell]}>
                  <Text style={textStyle}>{formatAmount(row.netPosition)}</Text>
                </View>
              </View>
            );
          })}

          <View style={[styles.row, styles.totalRow]}>
            <View style={[styles.cell, styles.monthCell]}>
              <Text style={styles.totalText}>{report.yearTotal.monthLabel}</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.totalText}>{formatAmount(report.yearTotal.totalSubs)}</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.totalText}>{formatAmount(report.yearTotal.totalEmergencyContributions)}</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.totalText}>{formatAmount(report.yearTotal.totalWithdrawals)}</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.totalText}>{formatAmount(report.yearTotal.businessIncome)}</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.totalText}>{formatAmount(report.yearTotal.businessExpenses)}</Text>
            </View>
            <View style={[styles.cell, styles.amountCell]}>
              <Text style={styles.totalText}>{formatAmount(report.yearTotal.netPosition)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
