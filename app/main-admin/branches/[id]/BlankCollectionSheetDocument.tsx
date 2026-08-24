import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BlankCollectionSheetData } from "./blank-sheet-actions";

type BlankCollectionSheetDocumentProps = {
  sheet: BlankCollectionSheetData;
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
    fontSize: 16,
    fontWeight: 700,
    marginTop: 4,
  },
  subtitle: {
    color: "#475569",
    fontSize: 8,
    marginTop: 4,
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 14,
  },
  fieldGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 700,
    marginRight: 6,
  },
  fieldBlank: {
    borderBottom: "1 solid #0f1729",
    minWidth: 160,
    height: 12,
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
  lastRow: {
    borderBottom: "0 solid transparent",
  },
  cell: {
    borderRight: "1 solid #e2e8f0",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 9,
  },
  lastCell: {
    borderRight: "0 solid transparent",
  },
  headerCellText: {
    color: "#ffffff",
    fontSize: 6.3,
    fontWeight: 700,
  },
  bodyCellText: {
    color: "#0f1729",
    fontSize: 7,
  },
  rightAligned: {
    textAlign: "right",
  },
  footerNote: {
    color: "#94a3b8",
    fontSize: 6.5,
    marginTop: 10,
  },
});

const columns = [
  { key: "number", label: "No.", width: "4%" },
  { key: "name", label: "Name", width: "15%" },
  { key: "memberId", label: "Member ID", width: "7%" },
  { key: "kbgSharesBf", label: "KBG Shares B/F", width: "7%" },
  { key: "oldSavingsBf", label: "Old Savings B/F", width: "7%" },
  { key: "previousBalanceBf", label: "Previous Balance B/F", width: "7.5%" },
  { key: "subs", label: "Subs", width: "7.5%" },
  { key: "cumulativeSaving", label: "Cumulative Saving", width: "7.5%" },
  { key: "previousEmergBf", label: "Previous Emerg B/F", width: "7.5%" },
  { key: "emergSubs", label: "Emerg Subs", width: "7.5%" },
  { key: "cumulativeEmergFund", label: "Cumulative Emerg Fund", width: "7.5%" },
  { key: "withdrawal", label: "Withdrawal", width: "7.5%" },
  { key: "emergencyBalance", label: "Emergency Balance", width: "7.5%" },
] as const;

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BlankCollectionSheetDocument({ sheet }: BlankCollectionSheetDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.eyebrow}>Ugenya Association Eldoret</Text>
          <Text style={styles.title}>{sheet.branchName} - Monthly Collection Sheet (Blank Template)</Text>
          <Text style={styles.subtitle}>For manual completion at the branch meeting.</Text>
        </View>

        <View style={styles.fieldsRow}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Month:</Text>
            <View style={styles.fieldBlank} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date:</Text>
            <View style={styles.fieldBlank} />
          </View>
        </View>

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

          {sheet.rows.map((row, index) => (
            <View key={row.memberId} style={styles.row} wrap={false}>
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
                <Text style={styles.bodyCellText} />
              </View>
              <View style={[styles.cell, { width: columns[7].width }]}>
                <Text style={styles.bodyCellText} />
              </View>
              <View style={[styles.cell, { width: columns[8].width }]}>
                <Text style={[styles.bodyCellText, styles.rightAligned]}>{formatAmount(row.previousEmergBf)}</Text>
              </View>
              <View style={[styles.cell, { width: columns[9].width }]}>
                <Text style={styles.bodyCellText} />
              </View>
              <View style={[styles.cell, { width: columns[10].width }]}>
                <Text style={styles.bodyCellText} />
              </View>
              <View style={[styles.cell, { width: columns[11].width }]}>
                <Text style={styles.bodyCellText} />
              </View>
              <View style={[styles.cell, { width: columns[12].width }, styles.lastCell]}>
                <Text style={styles.bodyCellText} />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>
          Previous Balance B/F and Previous Emerg B/F are pre-filled from the latest stored records. All other
          fields are left blank for manual entry.
        </Text>
      </Page>
    </Document>
  );
}
