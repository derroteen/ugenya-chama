"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { TRANSACTION_TYPES, type TransactionType } from "./transaction-types";

export type BusinessTransaction = {
  id: string;
  transactionDate: string;
  transactionType: TransactionType;
  description: string;
  amount: number;
};

export type AddTransactionResult = {
  status: "success" | "error";
  message: string;
};

function getClientIpFromHeaders(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeMonth(month: string) {
  return /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
}

async function ensureAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    throw new Error("You do not have permission to manage business transactions.");
  }

  return { supabase, userId: user.id };
}

export async function loadVentureTransactions(ventureId: string, month: string): Promise<BusinessTransaction[]> {
  const { supabase } = await ensureAdminAccess();

  const normalizedMonth = normalizeMonth(month);
  const [year, monthNum] = normalizedMonth.split("-").map(Number);
  const startDate = `${normalizedMonth}-01`;
  const endDate = new Date(Date.UTC(year, monthNum, 0)).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("business_transactions")
    .select("id, transaction_date, transaction_type, description, amount")
    .eq("venture_id", ventureId)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    transactionDate: row.transaction_date,
    transactionType: row.transaction_type as TransactionType,
    description: row.description ?? "",
    amount: toNumber(row.amount),
  }));
}

export async function addTransaction(
  ventureId: string,
  transactionDateInput: string,
  transactionTypeInput: string,
  descriptionInput: string,
  amountInput: string
): Promise<AddTransactionResult> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);
    const rateLimit = checkRateLimit(ip, "add_business_transaction", 60);
    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many attempts. Please try again in 15 minutes.",
      };
    }

    const { supabase, userId } = await ensureAdminAccess();

    const transactionDate = transactionDateInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      return { status: "error", message: "A valid transaction date is required." };
    }

    const transactionType = transactionTypeInput.trim() as TransactionType;
    if (!TRANSACTION_TYPES.includes(transactionType)) {
      return { status: "error", message: "Invalid transaction type." };
    }

    const description = descriptionInput.trim();
    if (description.length > 500) {
      return { status: "error", message: "Description must be 500 characters or fewer." };
    }

    const amountRaw = amountInput.trim();
    const amount = Number(amountRaw);
    if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
      return { status: "error", message: "Amount must be a positive number." };
    }

    const { error } = await supabase.from("business_transactions").insert({
      venture_id: ventureId,
      transaction_date: transactionDate,
      transaction_type: transactionType,
      description: description || null,
      amount,
      created_by: userId,
    });

    if (error) throw error;

    revalidatePath(`/main-admin/business/${ventureId}`);

    return { status: "success", message: "Transaction added successfully." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error && error.message ? error.message : "Unable to add transaction.",
    };
  }
}
