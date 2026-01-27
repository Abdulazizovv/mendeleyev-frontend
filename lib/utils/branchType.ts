import type { BranchType } from "@/types/auth";

/**
 * Branch Type Utilities
 * Helper functions for branch type-specific features
 */

export const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  school: "Maktab",
  center: "O'quv Markazi",
};

export interface NavigationItem {
  name: string;
  href: string;
  icon?: string;
  description?: string;
}

/**
 * Get navigation items based on branch type
 * Updated to use new routing: /school and /training-center
 */
export const getNavigationItems = (branchType: BranchType): NavigationItem[] => {
  const baseRoute = branchType === "center" ? "/training-center" : "/school";
  
  const commonItems: NavigationItem[] = [
    {
      name: "O'quvchilar",
      href: `${baseRoute}/students`,
      description: "O'quvchilarni boshqarish",
    },
  ];

  if (branchType === "school") {
    return [
      ...commonItems,
      {
        name: "Akademik Yillar",
        href: `${baseRoute}/academic-years`,
        description: "Akademik yillar va choraklarni boshqarish",
      },
      {
        name: "Sinflar",
        href: `${baseRoute}/classes`,
        description: "Sinflarni boshqarish",
      },
      {
        name: "Fanlar",
        href: `${baseRoute}/subjects`,
        description: "Fanlarni boshqarish",
      },
      {
        name: "Dars Jadvali",
        href: `${baseRoute}/schedule`,
        description: "Dars jadvalini boshqarish",
      },
      {
        name: "Xodimlar",
        href: `${baseRoute}/staff`,
        description: "Xodimlarni boshqarish",
      },
      {
        name: "Xonalar va Binolar",
        href: `${baseRoute}/rooms`,
        description: "Xonalar va binolarni boshqarish",
      },
      {
        name: "Rollar",
        href: `${baseRoute}/roles`,
        description: "Rollarni boshqarish",
      },
      {
        name: "Moliya",
        href: `${baseRoute}/finance`,
        description: "Moliya boshqaruvi",
      },
    ];
  } else {
    // training_center
    return [
      ...commonItems,
      {
        name: "Akademik Yillar",
        href: `${baseRoute}/academic-years`,
        description: "Akademik yillar va choraklarni boshqarish",
      },
      {
        name: "Guruhlar",
        href: `${baseRoute}/groups`,
        description: "Guruhlarni boshqarish",
      },
      {
        name: "Kurslar",
        href: `${baseRoute}/courses`,
        description: "Kurslarni boshqarish",
      },
      {
        name: "Dars Jadvali",
        href: `${baseRoute}/schedule`,
        description: "Dars jadvalini boshqarish",
      },
      {
        name: "Xodimlar",
        href: `${baseRoute}/staff`,
        description: "Xodimlarni boshqarish",
      },
      {
        name: "Xonalar va Binolar",
        href: `${baseRoute}/rooms`,
        description: "Xonalar va binolarni boshqarish",
      },
      {
        name: "Rollar",
        href: `${baseRoute}/roles`,
        description: "Rollarni boshqarish",
      },
      {
        name: "Moliya",
        href: `${baseRoute}/finance`,
        description: "Moliya boshqaruvi",
      },
    ];
  }
};

/**
 * Check if a feature is available for branch type
 */
export const isFeatureAvailable = (
  branchType: BranchType,
  feature: string
): boolean => {
  const schoolFeatures = [
    "classes",
    "subjects",
    "teachers",
    "finance",
    "students",
    "grades",
    "curriculum",
  ];

  const centerFeatures = [
    "groups",
    "courses",
    "finance",
    "students",
    "instructors",
  ];

  if (branchType === "school") {
    return schoolFeatures.includes(feature);
  } else {
    return centerFeatures.includes(feature);
  }
};

/**
 * Get dashboard widgets based on branch type
 */
export const getDashboardWidgets = (branchType: BranchType) => {
  const commonWidgets = [
    { id: "students", name: "O'quvchilar", visible: true },
    { id: "finance", name: "Moliya", visible: true },
  ];

  if (branchType === "school") {
    return [
      ...commonWidgets,
      { id: "classes", name: "Sinflar", visible: true },
      { id: "subjects", name: "Fanlar", visible: true },
      { id: "attendance", name: "Davomat", visible: true },
    ];
  } else {
    return [
      ...commonWidgets,
      { id: "groups", name: "Guruhlar", visible: true },
      { id: "courses", name: "Kurslar", visible: true },
      { id: "schedule", name: "Jadval", visible: true },
    ];
  }
};

/**
 * Get student terminology based on branch type
 */
export const getStudentTerminology = (branchType: BranchType) => {
  if (branchType === "school") {
    return {
      singular: "O'quvchi",
      plural: "O'quvchilar",
      container: "Sinf",
      containerPlural: "Sinflar",
    };
  } else {
    return {
      singular: "O'quvchi",
      plural: "O'quvchilar",
      container: "Guruh",
      containerPlural: "Guruhlar",
    };
  }
};

/**
 * Get finance features based on branch type
 */
export const getFinanceFeatures = (branchType: BranchType) => {
  const commonFeatures = [
    "cash_registers",
    "transactions",
    "student_payments",
  ];

  if (branchType === "school") {
    return [
      ...commonFeatures,
      "subscription_plans",
      "discounts",
      "teacher_salaries",
      "staff_salaries",
      "budgeting",
    ];
  } else {
    return [
      ...commonFeatures,
      "course_fees",
      "instructor_payments",
      "expense_tracking",
    ];
  }
};
