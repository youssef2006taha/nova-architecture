const dashboardRoles = [
  { role: "Student", path: "/dashboard/student", label: "studentDashboard" },
  { role: "Instructor", path: "/dashboard/instructor", label: "instructorDashboard" },
  { role: "Admin", path: "/dashboard/admin", label: "adminDashboard" },
];

export function getDashboardRoles(user) {
  const roles = new Set(
    Array.isArray(user?.roles)
      ? user.roles
          .filter((role) => typeof role === "string")
          .map((role) => role.trim().toLowerCase())
      : [],
  );

  return dashboardRoles.filter(({ role }) => roles.has(role.toLowerCase()));
}

export function getDashboardNavigationRoles(user) {
  const roles = new Set(getDashboardRoles(user).map(({ role }) => role));
  if (roles.has("Admin")) roles.add("Instructor");
  return dashboardRoles.filter(({ role }) => roles.has(role));
}

export function userHasRole(user, role) {
  return getDashboardRoles(user).some(
    (dashboardRole) => dashboardRole.role.toLowerCase() === role.toLowerCase(),
  );
}
