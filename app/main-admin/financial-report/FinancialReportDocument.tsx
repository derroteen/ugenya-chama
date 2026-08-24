import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { FinancialReportData } from "./actions";

type FinancialReportDocumentProps = {
  report: FinancialReportData;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#0f1729",
    fontFamily: "Helvetica",
    fontSize: 8,
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
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#1d3a8a",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  summaryTable: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  row: {
    borderBottom: "1 solid #e2e8f0",
    flexDirection: "row",
  },
  headerRow: {
    backgroundColor: "#0f1729",
  },
  labelCell: {
    width: "63%",
    borderRight: "1 solid #e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  valueCell: {
    width: "37%",
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: "flex-end",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: 700,
  },
  bodyText: {
    color: "#0f1729",
    fontSize: 8,
  },
  highlightText: {
    color: "#0f1729",
    fontWeight: 700,
  },
  ventureCard: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    marginBottom: 8,
    padding: 8,
  },
  ventureTitle: {
    color: "#0f1729",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  inlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  note: {
    color: "#475569",
    fontSize: 7,
    marginTop: 4,
  },
  totalBox: {
    border: "1 solid #c9a227",
    backgroundColor: "#fff9e6",
    borderRadius: 4,
    padding: 8,
  },
  totalTitle: {
    color: "#7a5c00",
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 4,
  },
  totalValue: {
    color: "#0f1729",
    fontSize: 12,
    fontWeight: 700,
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

export default function FinancialReportDocument({ report }: FinancialReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.eyebrow}>Ugenya Association Eldoret</Text>
          <Text style={styles.title}>Monthly Financial Report - {report.monthLabel}</Text>
          <Text style={styles.subtitle}>Generated: {formatGeneratedAt(report.generatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Savings & Emergency Fund Summary</Text>
          <View style={styles.summaryTable}>
            <View style={[styles.row, styles.headerRow]}>
              <View style={styles.labelCell}>
                <Text style={styles.headerText}>Item</Text>
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.headerText}>Amount (KSh)</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}><Text style={styles.bodyText}>Total Subs collected</Text></View>
              <View style={styles.valueCell}><Text style={styles.bodyText}>{formatAmount(report.savingsSummary.totalSubs)}</Text></View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}><Text style={styles.bodyText}>Total Emergency Fund contributions</Text></View>
              <View style={styles.valueCell}><Text style={styles.bodyText}>{formatAmount(report.savingsSummary.totalEmergencyContributions)}</Text></View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}><Text style={styles.bodyText}>Total withdrawals</Text></View>
              <View style={styles.valueCell}><Text style={styles.bodyText}>{formatAmount(report.savingsSummary.totalWithdrawals)}</Text></View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}><Text style={[styles.bodyText, styles.highlightText]}>Net position</Text></View>
              <View style={styles.valueCell}><Text style={[styles.bodyText, styles.highlightText]}>{formatAmount(report.savingsSummary.netPosition)}</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Business Activity Summary</Text>

          {report.businessSummaries.length === 0 ? (
            <View style={styles.summaryTable}>
              <View style={styles.row}>
                <View style={styles.labelCell}><Text style={styles.bodyText}>No active business ventures found.</Text></View>
              </View>
            </View>
          ) : (
            report.businessSummaries.map((venture) => (
              <View key={venture.ventureId} style={styles.ventureCard}>
                <Text style={styles.ventureTitle}>{venture.ventureName}</Text>

                <View style={styles.inlineRow}>
                  <Text style={styles.bodyText}>Total income</Text>
                  <Text style={styles.bodyText}>{formatAmount(venture.totalIncome)}</Text>
                </View>

                <View style={styles.inlineRow}>
                  <Text style={styles.bodyText}>Fuel</Text>
                  <Text style={styles.bodyText}>{formatAmount(venture.fuel)}</Text>
                </View>

                <View style={styles.inlineRow}>
                  <Text style={styles.bodyText}>Driver payment</Text>
                  <Text style={styles.bodyText}>{formatAmount(venture.driverPayment)}</Text>
                </View>

                <View style={styles.inlineRow}>
                  <Text style={styles.bodyText}>Maintenance</Text>
                  <Text style={styles.bodyText}>{formatAmount(venture.maintenance)}</Text>
                </View>

                <View style={styles.inlineRow}>
                  <Text style={styles.bodyText}>Other expense</Text>
                  <Text style={styles.bodyText}>{formatAmount(venture.otherExpense)}</Text>
                </View>

                <View style={styles.inlineRow}>
                  <Text style={[styles.bodyText, styles.highlightText]}>Net profit/loss</Text>
                  <Text style={[styles.bodyText, styles.highlightText]}>{formatAmount(venture.netProfit)}</Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.totalBox}>
            <Text style={styles.totalTitle}>Business totals</Text>
            <View style={styles.inlineRow}>
              <Text style={styles.bodyText}>Income</Text>
              <Text style={styles.bodyText}>{formatAmount(report.businessTotals.totalIncome)}</Text>
            </View>
            <View style={styles.inlineRow}>
              <Text style={styles.bodyText}>Expenses</Text>
              <Text style={styles.bodyText}>{formatAmount(report.businessTotals.totalExpenses)}</Text>
            </View>
            <View style={styles.inlineRow}>
              <Text style={[styles.bodyText, styles.highlightText]}>Net profit/loss</Text>
              <Text style={[styles.bodyText, styles.highlightText]}>{formatAmount(report.businessTotals.netProfit)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Overall Position</Text>

          <View style={styles.summaryTable}>
            <View style={[styles.row, styles.headerRow]}>
              <View style={styles.labelCell}><Text style={styles.headerText}>Item</Text></View>
              <View style={styles.valueCell}><Text style={styles.headerText}>Amount (KSh)</Text></View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}><Text style={styles.bodyText}>Savings collected + emergency collected + business income</Text></View>
              <View style={styles.valueCell}><Text style={styles.bodyText}>{formatAmount(report.overallPosition.totalInflow)}</Text></View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}><Text style={styles.bodyText}>Withdrawals + business expenses</Text></View>
              <View style={styles.valueCell}><Text style={styles.bodyText}>{formatAmount(report.overallPosition.totalOutflow)}</Text></View>
            </View>

            <View style={styles.row}>
              <View style={styles.labelCell}><Text style={[styles.bodyText, styles.highlightText]}>Net Association Position</Text></View>
              <View style={styles.valueCell}><Text style={[styles.bodyText, styles.highlightText]}>{formatAmount(report.overallPosition.netAssociationPosition)}</Text></View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
