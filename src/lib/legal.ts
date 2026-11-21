// Single source of truth for the Grievance Officer / legal contact details.
// Change them here and every legal page, the grievance page and the
// "Questions about this policy?" box update together.
//
// Required by the IT (Intermediary Guidelines and Digital Media Ethics Code)
// Rules, 2021 (as amended 2022): name + contact details of the Grievance
// Officer and how users can complain must be published on the platform.

export const GRIEVANCE_OFFICER = {
  name: "Ravish Bisht",
  email: "ravish@doonmeet.in",
  location: "Dehradun, Uttarakhand, India",
} as const;

// Response timelines we commit to (IT Rules 2021, Rule 3(2) as amended).
export const GRIEVANCE_TIMELINES = {
  acknowledgeHours: 24,
  resolveDays: 15,
  /** Content showing private areas / sexual acts / impersonation (Rule 3(2)(b)). */
  urgentRemovalHours: 24,
  /** Complaints asking for removal of unlawful content (Rule 3(2)(a)(i) proviso). */
  removalRequestHours: 72,
  /** Window to appeal the Grievance Officer's decision to the GAC. */
  appealDays: 30,
} as const;

export const GAC_PORTAL_URL = "https://gac.gov.in";
