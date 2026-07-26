export type NewAdminRole = "main_admin";

export interface NewAdminFormState {
  status: "idle" | "error" | "success";
  errorMessage?: string;
  email?: string;
  generatedPassword?: string;
  role?: NewAdminRole;
  branchName?: string;
  defaults?: {
    fullName: string;
    email: string;
    role: NewAdminRole;
    branchId: string;
  };
}

export const initialNewAdminFormState: NewAdminFormState = {
  status: "idle",
  defaults: {
    fullName: "",
    email: "",
    role: "main_admin",
    branchId: "",
  },
};
