export interface NewMemberFormState {
  status: "idle" | "error" | "success";
  errorMessage?: string;
  memberId?: string;
  initialPassword?: string;
  successPhone?: string;
  successBranchName?: string;
  defaults?: {
    fullName: string;
    phone: string;
    idNumber: string;
    selectedBranchId: string;
    sheetOrder: string;
  };
}

export const initialNewMemberFormState: NewMemberFormState = {
  status: "idle",
};
