"use client";

import { useActionState, useEffect, useState } from "react";
import {
  addChild,
  deleteChild,
  upsertBeneficiaryDeclaration,
  upsertFamilyDetails,
} from "./actions";

type TabKey = "family" | "beneficiary";

type ActionResult = {
  status: "idle" | "success" | "error";
  message: string;
};

interface FamilyDetails {
  marital_status: "single" | "married" | "widowed" | null;
  employment_status: "employed" | "self_employed" | "unemployed" | null;
  occupation: string | null;
  residential_location: string | null;
  home_district: string | null;
  home_location: string | null;
  home_village: string | null;
  spouse_name: string | null;
  spouse_district: string | null;
  spouse_location: string | null;
  spouse_sub_location: string | null;
  spouse_village: string | null;
  spouse_id_number: string | null;
}

interface ChildRow {
  id: string;
  full_name: string;
  age: number | null;
}

interface BeneficiaryDeclaration {
  father_name: string | null;
  father_date_of_birth: string | null;
  father_id_number: string | null;
  father_status: "alive" | "deceased" | null;
  mother_name: string | null;
  mother_date_of_birth: string | null;
  mother_id_number: string | null;
  mother_status: "alive" | "deceased" | null;
  guardian_name: string | null;
  guardian_date_of_birth: string | null;
  guardian_id_number: string | null;
  beneficiary_full_name: string | null;
  beneficiary_date_of_birth: string | null;
  beneficiary_mobile: string | null;
  beneficiary_relationship: string | null;
}

interface MemberDetailsTabsProps {
  memberId: string;
  familyDetails: FamilyDetails | null;
  children: ChildRow[];
  beneficiaryDeclaration: BeneficiaryDeclaration | null;
}

const initialActionState: ActionResult = {
  status: "idle",
  message: "",
};

function valueOrDash(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function toInputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function MemberDetailsTabs({
  memberId,
  familyDetails,
  children,
  beneficiaryDeclaration,
}: MemberDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("family");
  const [editingFamily, setEditingFamily] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState(false);

  const [familyState, familyAction, familyPending] = useActionState(
    async (_previousState: ActionResult, formData: FormData) =>
      upsertFamilyDetails(memberId, formData),
    initialActionState
  );

  const [beneficiaryState, beneficiaryAction, beneficiaryPending] = useActionState(
    async (_previousState: ActionResult, formData: FormData) =>
      upsertBeneficiaryDeclaration(memberId, formData),
    initialActionState
  );

  const [childAddState, childAddAction, childAddPending] = useActionState(
    async (_previousState: ActionResult, formData: FormData) => addChild(memberId, formData),
    initialActionState
  );

  const [childDeleteState, childDeleteAction] = useActionState(
    async (_previousState: ActionResult, formData: FormData) => deleteChild(memberId, formData),
    initialActionState
  );

  useEffect(() => {
    if (familyState.status === "success") {
      setEditingFamily(false);
    }
  }, [familyState.status]);

  useEffect(() => {
    if (beneficiaryState.status === "success") {
      setEditingBeneficiary(false);
    }
  }, [beneficiaryState.status]);

  const hasFamilyDetails = Boolean(familyDetails);
  const hasBeneficiaryDeclaration = Boolean(beneficiaryDeclaration);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 pt-4 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("family")}
            className={`rounded-t-lg border px-4 py-2 text-sm font-semibold transition ${
              activeTab === "family"
                ? "border-[#c9a227] bg-[#fff9e8] text-[#8b6a12]"
                : "border-transparent text-slate-600 hover:text-[#0f1729]"
            }`}
          >
            Family Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("beneficiary")}
            className={`rounded-t-lg border px-4 py-2 text-sm font-semibold transition ${
              activeTab === "beneficiary"
                ? "border-[#c9a227] bg-[#fff9e8] text-[#8b6a12]"
                : "border-transparent text-slate-600 hover:text-[#0f1729]"
            }`}
          >
            Beneficiary Declaration
          </button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "family" ? (
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#0f1729]">Family Details</h2>
              <button
                type="button"
                onClick={() => setEditingFamily((current) => !current)}
                className="inline-flex items-center rounded-lg border border-[#1d3a8a] bg-white px-4 py-2 text-sm font-semibold text-[#1d3a8a] transition hover:bg-slate-50"
              >
                {editingFamily ? "Cancel" : hasFamilyDetails ? "Edit" : "Add"}
              </button>
            </div>

            {!hasFamilyDetails && !editingFamily ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                Not yet recorded.
              </p>
            ) : null}

            {hasFamilyDetails && !editingFamily ? (
              <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marital Status</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.marital_status)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employment Status</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.employment_status)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Occupation</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.occupation)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Residential Location</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.residential_location)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Home District</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.home_district)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Home Location</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.home_location)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Home Village</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.home_village)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spouse Name</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.spouse_name)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spouse District</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.spouse_district)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spouse Location</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.spouse_location)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spouse Sub-Location</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.spouse_sub_location)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spouse Village</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.spouse_village)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spouse ID Number</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(familyDetails?.spouse_id_number)}</dd>
                </div>
              </dl>
            ) : null}

            {editingFamily ? (
              <form action={familyAction} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {familyState.status !== "idle" ? (
                  <p
                    className={`rounded-lg px-3 py-2 text-sm ${
                      familyState.status === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {familyState.message}
                  </p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="maritalStatus" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Marital Status
                    </label>
                    <select
                      id="maritalStatus"
                      name="maritalStatus"
                      defaultValue={familyDetails?.marital_status ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="employmentStatus" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Employment Status
                    </label>
                    <select
                      id="employmentStatus"
                      name="employmentStatus"
                      defaultValue={familyDetails?.employment_status ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="employed">Employed</option>
                      <option value="self_employed">Self Employed</option>
                      <option value="unemployed">Unemployed</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="occupation" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Occupation
                    </label>
                    <input
                      id="occupation"
                      name="occupation"
                      defaultValue={familyDetails?.occupation ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="residentialLocation" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Residential Location
                    </label>
                    <input
                      id="residentialLocation"
                      name="residentialLocation"
                      defaultValue={familyDetails?.residential_location ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="homeDistrict" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Home District
                    </label>
                    <input
                      id="homeDistrict"
                      name="homeDistrict"
                      defaultValue={familyDetails?.home_district ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="homeLocation" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Home Location
                    </label>
                    <input
                      id="homeLocation"
                      name="homeLocation"
                      defaultValue={familyDetails?.home_location ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="homeVillage" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Home Village
                    </label>
                    <input
                      id="homeVillage"
                      name="homeVillage"
                      defaultValue={familyDetails?.home_village ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="spouseName" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Spouse Name
                    </label>
                    <input
                      id="spouseName"
                      name="spouseName"
                      defaultValue={familyDetails?.spouse_name ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="spouseDistrict" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Spouse District
                    </label>
                    <input
                      id="spouseDistrict"
                      name="spouseDistrict"
                      defaultValue={familyDetails?.spouse_district ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="spouseLocation" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Spouse Location
                    </label>
                    <input
                      id="spouseLocation"
                      name="spouseLocation"
                      defaultValue={familyDetails?.spouse_location ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="spouseSubLocation" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Spouse Sub-Location
                    </label>
                    <input
                      id="spouseSubLocation"
                      name="spouseSubLocation"
                      defaultValue={familyDetails?.spouse_sub_location ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="spouseVillage" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Spouse Village
                    </label>
                    <input
                      id="spouseVillage"
                      name="spouseVillage"
                      defaultValue={familyDetails?.spouse_village ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="spouseIdNumber" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                      Spouse ID Number
                    </label>
                    <input
                      id="spouseIdNumber"
                      name="spouseIdNumber"
                      defaultValue={familyDetails?.spouse_id_number ?? ""}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={familyPending}
                  className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {familyPending ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          className="opacity-30"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          d="M21 12a9 9 0 00-9-9"
                          className="opacity-100"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Family Details"
                  )}
                </button>
              </form>
            ) : null}

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[#0f1729]">Children</h3>

              {childAddState.status !== "idle" ? (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                    childAddState.status === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {childAddState.message}
                </p>
              ) : null}

              {childDeleteState.status !== "idle" ? (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                    childDeleteState.status === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {childDeleteState.message}
                </p>
              ) : null}

              {children.length === 0 ? (
                <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                  No children recorded.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {children.map((child) => (
                    <li
                      key={child.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
                    >
                      <span className="text-sm text-[#0f1729]">
                        {child.full_name} {child.age !== null ? `(${child.age} yrs)` : ""}
                      </span>
                      <form action={childDeleteAction}>
                        <input type="hidden" name="childId" value={child.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={childAddAction} className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label htmlFor="childName" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                    Child Name
                  </label>
                  <input
                    id="childName"
                    name="childName"
                    required
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="childAge" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                    Age
                  </label>
                  <input
                    id="childAge"
                    name="childAge"
                    type="number"
                    min={0}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={childAddPending}
                    className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {childAddPending ? "Adding..." : "Add Child"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {activeTab === "beneficiary" ? (
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#0f1729]">Beneficiary Declaration</h2>
              <button
                type="button"
                onClick={() => setEditingBeneficiary((current) => !current)}
                className="inline-flex items-center rounded-lg border border-[#1d3a8a] bg-white px-4 py-2 text-sm font-semibold text-[#1d3a8a] transition hover:bg-slate-50"
              >
                {editingBeneficiary ? "Cancel" : hasBeneficiaryDeclaration ? "Edit" : "Add"}
              </button>
            </div>

            {!hasBeneficiaryDeclaration && !editingBeneficiary ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                Not yet recorded.
              </p>
            ) : null}

            {hasBeneficiaryDeclaration && !editingBeneficiary ? (
              <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Father Name</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.father_name)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Father DOB</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(toInputDate(beneficiaryDeclaration?.father_date_of_birth ?? null))}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Father ID</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.father_id_number)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Father Status</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.father_status)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mother Name</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.mother_name)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mother DOB</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(toInputDate(beneficiaryDeclaration?.mother_date_of_birth ?? null))}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mother ID</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.mother_id_number)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mother Status</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.mother_status)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guardian Name</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.guardian_name)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guardian DOB</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(toInputDate(beneficiaryDeclaration?.guardian_date_of_birth ?? null))}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guardian ID</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.guardian_id_number)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary Name</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.beneficiary_full_name)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary DOB</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(toInputDate(beneficiaryDeclaration?.beneficiary_date_of_birth ?? null))}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficiary Mobile</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.beneficiary_mobile)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Relationship</dt>
                  <dd className="mt-1 text-sm text-[#0f1729]">{valueOrDash(beneficiaryDeclaration?.beneficiary_relationship)}</dd>
                </div>
              </dl>
            ) : null}

            {editingBeneficiary ? (
              <form action={beneficiaryAction} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {beneficiaryState.status !== "idle" ? (
                  <p
                    className={`rounded-lg px-3 py-2 text-sm ${
                      beneficiaryState.status === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {beneficiaryState.message}
                  </p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fatherName" className="mb-1 block text-sm font-semibold text-[#0f1729]">Father Name</label>
                    <input id="fatherName" name="fatherName" defaultValue={beneficiaryDeclaration?.father_name ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="fatherDateOfBirth" className="mb-1 block text-sm font-semibold text-[#0f1729]">Father DOB</label>
                    <input id="fatherDateOfBirth" name="fatherDateOfBirth" type="date" defaultValue={toInputDate(beneficiaryDeclaration?.father_date_of_birth ?? null)} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="fatherIdNumber" className="mb-1 block text-sm font-semibold text-[#0f1729]">Father ID</label>
                    <input id="fatherIdNumber" name="fatherIdNumber" defaultValue={beneficiaryDeclaration?.father_id_number ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="fatherStatus" className="mb-1 block text-sm font-semibold text-[#0f1729]">Father Status</label>
                    <select id="fatherStatus" name="fatherStatus" defaultValue={beneficiaryDeclaration?.father_status ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option value="alive">Alive</option>
                      <option value="deceased">Deceased</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="motherName" className="mb-1 block text-sm font-semibold text-[#0f1729]">Mother Name</label>
                    <input id="motherName" name="motherName" defaultValue={beneficiaryDeclaration?.mother_name ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="motherDateOfBirth" className="mb-1 block text-sm font-semibold text-[#0f1729]">Mother DOB</label>
                    <input id="motherDateOfBirth" name="motherDateOfBirth" type="date" defaultValue={toInputDate(beneficiaryDeclaration?.mother_date_of_birth ?? null)} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="motherIdNumber" className="mb-1 block text-sm font-semibold text-[#0f1729]">Mother ID</label>
                    <input id="motherIdNumber" name="motherIdNumber" defaultValue={beneficiaryDeclaration?.mother_id_number ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="motherStatus" className="mb-1 block text-sm font-semibold text-[#0f1729]">Mother Status</label>
                    <select id="motherStatus" name="motherStatus" defaultValue={beneficiaryDeclaration?.mother_status ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option value="alive">Alive</option>
                      <option value="deceased">Deceased</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="guardianName" className="mb-1 block text-sm font-semibold text-[#0f1729]">Guardian Name</label>
                    <input id="guardianName" name="guardianName" defaultValue={beneficiaryDeclaration?.guardian_name ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="guardianDateOfBirth" className="mb-1 block text-sm font-semibold text-[#0f1729]">Guardian DOB</label>
                    <input id="guardianDateOfBirth" name="guardianDateOfBirth" type="date" defaultValue={toInputDate(beneficiaryDeclaration?.guardian_date_of_birth ?? null)} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="guardianIdNumber" className="mb-1 block text-sm font-semibold text-[#0f1729]">Guardian ID</label>
                    <input id="guardianIdNumber" name="guardianIdNumber" defaultValue={beneficiaryDeclaration?.guardian_id_number ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label htmlFor="beneficiaryFullName" className="mb-1 block text-sm font-semibold text-[#0f1729]">Beneficiary Name</label>
                    <input id="beneficiaryFullName" name="beneficiaryFullName" defaultValue={beneficiaryDeclaration?.beneficiary_full_name ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="beneficiaryDateOfBirth" className="mb-1 block text-sm font-semibold text-[#0f1729]">Beneficiary DOB</label>
                    <input id="beneficiaryDateOfBirth" name="beneficiaryDateOfBirth" type="date" defaultValue={toInputDate(beneficiaryDeclaration?.beneficiary_date_of_birth ?? null)} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="beneficiaryMobile" className="mb-1 block text-sm font-semibold text-[#0f1729]">Beneficiary Mobile</label>
                    <input id="beneficiaryMobile" name="beneficiaryMobile" defaultValue={beneficiaryDeclaration?.beneficiary_mobile ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="beneficiaryRelationship" className="mb-1 block text-sm font-semibold text-[#0f1729]">Relationship</label>
                    <input id="beneficiaryRelationship" name="beneficiaryRelationship" defaultValue={beneficiaryDeclaration?.beneficiary_relationship ?? ""} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={beneficiaryPending}
                  className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {beneficiaryPending ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          className="opacity-30"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          d="M21 12a9 9 0 00-9-9"
                          className="opacity-100"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Beneficiary Declaration"
                  )}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

      </div>
    </section>
  );
}
