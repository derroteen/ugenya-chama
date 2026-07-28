"use server";

import { randomInt } from "crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { NewAdminRole, NewAdminFormState } from "./form-state";

const ALLOWED_ROLES: NewAdminRole[] = ["main_admin"];
const MAX_FULL_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 120;
const MAX_ROLE_LENGTH = 30;

function isAllowedRole(value: string): value is NewAdminRole {
  return ALLOWED_ROLES.includes(value as NewAdminRole);
}

function generateSecurePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let index = 0; index < length; index += 1) {
    password += alphabet[randomInt(0, alphabet.length)];
  }
  return password;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateMaxLength(value: string, fieldName: string, maxLength: number) {
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
}

function toErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      if (maybeMessage.toLowerCase().includes("already")) {
        return "An account with this email already exists.";
      }
      return maybeMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (error.message.toLowerCase().includes("already")) {
      return "An account with this email already exists.";
    }
    return error.message;
  }

  return "Unable to create admin account right now. Please try again.";
}

export async function createAdminAccount(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create admin accounts.");
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfileError || callerProfile?.role !== "superadmin") {
    throw new Error("Only superadmins are allowed to create admin accounts.");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const roleInput = String(formData.get("role") ?? "").trim();

  validateMaxLength(fullName, "Full Name", MAX_FULL_NAME_LENGTH);
  validateMaxLength(email, "Email", MAX_EMAIL_LENGTH);
  validateMaxLength(roleInput, "Role", MAX_ROLE_LENGTH);

  if (!fullName || !email || !roleInput) {
    throw new Error("Full Name, Email, and Role are required.");
  }

  if (!isAllowedRole(roleInput)) {
    throw new Error("Role must be main_admin.");
  }

  const generatedPassword = generateSecurePassword(12);
  const admin = createAdminClient();

  const { data: authCreation, error: authError } = await admin.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
  });

  if (authError || !authCreation.user) {
    throw authError ?? new Error("Could not create the auth user.");
  }

  const newUserId = authCreation.user.id;

  const { error: profileInsertError } = await admin.from("profiles").insert({
    id: newUserId,
    role: roleInput,
    branch_id: null,
    full_name: fullName,
    email,
  });

  if (profileInsertError) {
    await admin.auth.admin.deleteUser(newUserId);
    throw profileInsertError;
  }

  return {
    email,
    generatedPassword,
    role: roleInput,
    branchName: "-",
  };
}

export async function createAdminAccountAction(
  _previousState: NewAdminFormState,
  formData: FormData
): Promise<NewAdminFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const roleInput = String(formData.get("role") ?? "").trim();

  try {
    validateMaxLength(fullName, "Full Name", MAX_FULL_NAME_LENGTH);
    validateMaxLength(email, "Email", MAX_EMAIL_LENGTH);
    validateMaxLength(roleInput, "Role", MAX_ROLE_LENGTH);
  } catch (error) {
    return {
      status: "error",
      errorMessage: toErrorMessage(error),
      defaults: {
        fullName,
        email,
        role: isAllowedRole(roleInput) ? roleInput : "main_admin",
        branchId: "",
      },
    };
  }

  const defaults = {
    fullName,
    email,
    role: isAllowedRole(roleInput) ? roleInput : "main_admin",
    branchId: "",
  };

  try {
    const result = await createAdminAccount(formData);

    return {
      status: "success",
      email: result.email,
      generatedPassword: result.generatedPassword,
      role: result.role,
      branchName: result.branchName,
      defaults: {
        fullName: "",
        email: "",
        role: "main_admin",
        branchId: "",
      },
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: toErrorMessage(error),
      defaults,
    };
  }
}
