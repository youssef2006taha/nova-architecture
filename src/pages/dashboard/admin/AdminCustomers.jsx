import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAdminUsers,
  updateAdminUserLock,
  updateAdminUserRoles,
} from "../../../api/admin/admin.api";
import { showToast } from "../../../features/ui/toast/toastSlice";
import useTranslation from "../../../hooks/useTranslation";
import { getAdminErrorMessage } from "./adminDashboardUtils";

const PAGE_SIZE = 10;
const ROLES = ["Student", "Instructor", "Admin"];

const getRequestKey = ({ page, search, role, retryKey }) =>
  `${page}:${search}:${role}:${retryKey}`;

const haveSameRoles = (first, second) =>
  first.length === second.length &&
  first.every((role) => second.includes(role));

export default function AdminCustomers() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const mountedRef = useRef(true);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [pendingUserId, setPendingUserId] = useState(null);
  const requestKey = getRequestKey({ page, search, role, retryKey });
  const loading = result.key !== requestKey;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const key = getRequestKey({ page, search, role, retryKey });

    getAdminUsers(
      { search, role, page, pageSize: PAGE_SIZE },
      { signal: controller.signal },
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        if (
          !data ||
          !Array.isArray(data.users) ||
          data.totalCount == null ||
          (typeof data.totalCount === "string" && !data.totalCount.trim()) ||
          !Number.isInteger(Number(data.totalCount)) ||
          Number(data.totalCount) < 0 ||
          !Number.isInteger(Number(data.page)) ||
          Number(data.page) < 1 ||
          !Number.isInteger(Number(data.pageSize)) ||
          Number(data.pageSize) < 1 ||
          data.users.some(
            (user) =>
              user?.id == null ||
              typeof user.fullName !== "string" ||
              !user.fullName.trim() ||
              typeof user.email !== "string" ||
              !user.email.trim() ||
              typeof user.isActive !== "boolean" ||
              !Array.isArray(user.roles) ||
              user.roles.some((userRole) => typeof userRole !== "string"),
          )
        ) {
          setResult({
            key,
            data: null,
            error: { type: "invalid" },
          });
          return;
        }
        setResult({ key, data, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          data: null,
          error: { type: "load", status: error?.response?.status },
        });
      });

    return () => controller.abort();
  }, [page, role, search, retryKey]);

  const getIsCurrentUser = (user) => {
    const currentUserId = currentUser?.id ?? currentUser?.userId;
    const sameId =
      currentUserId != null && String(currentUserId) === String(user.id);
    const sameEmail =
      typeof currentUser?.email === "string" &&
      currentUser.email.toLowerCase() === user.email.toLowerCase();

    return sameId || sameEmail;
  };

  const notifyError = (error) => {
    if (!mountedRef.current) return;
    dispatch(
      showToast({
        message: getAdminErrorMessage(
          error,
          t.dashboard.adminActionError,
          t.dashboard,
        ),
        severity: "error",
      }),
    );
  };

  const requestSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
    setEditingUserId(null);
  };

  const changeRoleFilter = (event) => {
    setRole(event.target.value);
    setPage(1);
    setEditingUserId(null);
  };

  const openRoleEditor = (user) => {
    setSelectedRoles([...user.roles]);
    setEditingUserId(user.id);
  };

  const saveRoles = async (event, user) => {
    event.preventDefault();
    const isCurrentUser = getIsCurrentUser(user);

    if (
      selectedRoles.some((selectedRole) => !ROLES.includes(selectedRole)) ||
      user.roles.some((userRole) => !ROLES.includes(userRole))
    ) {
      dispatch(
        showToast({
          message: t.dashboard.cannotManageUndocumentedRoles,
          severity: "error",
        }),
      );
      return;
    }

    if (
      isCurrentUser &&
      user.roles.includes("Admin") &&
      !selectedRoles.includes("Admin")
    ) {
      dispatch(
        showToast({
          message: t.dashboard.ownAdminRoleProtected,
          severity: "error",
        }),
      );
      return;
    }

    if (haveSameRoles(user.roles, selectedRoles)) return;

    setPendingUserId(user.id);
    try {
      await updateAdminUserRoles(user.id, selectedRoles);
      if (!mountedRef.current) return;
      setEditingUserId(null);
      dispatch(
        showToast({
          message: t.dashboard.userRolesUpdated,
          severity: "success",
        }),
      );
      setRetryKey((value) => value + 1);
    } catch (error) {
      notifyError(error);
    } finally {
      if (mountedRef.current) setPendingUserId(null);
    }
  };

  const toggleAccountStatus = async (user) => {
    const isCurrentUser = getIsCurrentUser(user);
    if (isCurrentUser && user.isActive) return;

    const lock = user.isActive;
    const confirmed = window.confirm(
      lock
        ? t.dashboard.confirmLockUser
        : t.dashboard.confirmUnlockUser,
    );
    if (!confirmed) return;

    setPendingUserId(user.id);
    try {
      await updateAdminUserLock(user.id, lock);
      if (!mountedRef.current) return;
      dispatch(
        showToast({
          message: lock
            ? t.dashboard.userLocked
            : t.dashboard.userUnlocked,
          severity: "success",
        }),
      );
      setRetryKey((value) => value + 1);
    } catch (error) {
      notifyError(error);
    } finally {
      if (mountedRef.current) setPendingUserId(null);
    }
  };

  const resultError = result.error
    ? result.error.type === "invalid"
      ? t.dashboard.adminInvalidUsers
      : getAdminErrorMessage(
          { response: { status: result.error.status } },
          t.dashboard.adminLoadError,
          t.dashboard,
        )
    : null;
  const data = loading || resultError ? null : result.data;
  const totalPages = data
    ? Math.max(
        1,
        Math.ceil(Number(data.totalCount) / Number(data.pageSize)),
      )
    : 1;
  const roleLabels = {
    Student: t.dashboard.roleStudent,
    Instructor: t.dashboard.roleInstructor,
    Admin: t.dashboard.roleAdmin,
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">{t.dashboard.adminUsers}</h2>
        <form
          onSubmit={requestSearch}
          className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.45fr)_auto]"
        >
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            aria-label={t.dashboard.searchUsers}
            placeholder={t.dashboard.searchUsers}
            className="min-w-0 rounded-xl border border-primary/15 bg-bg-surface px-3 py-2 text-sm"
          />
          <label className="sr-only" htmlFor="admin-user-role-filter">
            {t.dashboard.filterByRole}
          </label>
          <select
            id="admin-user-role-filter"
            value={role}
            onChange={changeRoleFilter}
            className="min-w-0 rounded-xl border border-primary/15 bg-bg-surface px-3 py-2 text-sm"
          >
            <option value="">{t.dashboard.allRoles}</option>
            {ROLES.map((userRole) => (
              <option key={userRole} value={userRole}>
                {roleLabels[userRole]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-inverse"
          >
            {t.dashboard.search}
          </button>
        </form>
      </div>
      {loading ? (
        <p className="py-10 text-center text-text-muted" role="status">
          {t.dashboard.adminLoading}
        </p>
      ) : result.error ? (
        <div className="space-y-3 py-10 text-center" role="alert">
          <p>{resultError}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="font-bold text-primary hover:underline"
          >
            {t.dashboard.retry}
          </button>
        </div>
      ) : data.users.length === 0 ? (
        <p className="py-10 text-center text-text-muted">
          {t.dashboard.noUsers}
        </p>
      ) : (
        <>
          <div className="divide-y divide-primary/10 rounded-2xl border border-primary/10 bg-bg-surface">
            {data.users.map((user) => {
              const isCurrentUser = getIsCurrentUser(user);
              const hasUndocumentedRole = user.roles.some(
                (userRole) => !ROLES.includes(userRole),
              );
              const isPending = pendingUserId !== null;

              return (
                <article
                  key={user.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{user.fullName}</h3>
                    <p className="truncate text-sm text-text-muted">
                      {user.email}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((userRole, index) => (
                          <span
                            key={`${userRole}-${index}`}
                            className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                          >
                            {ROLES.includes(userRole)
                              ? roleLabels[userRole]
                              : t.dashboard.unknownRole}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-text-muted">
                          {t.dashboard.noRoles}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {user.isActive
                          ? t.dashboard.accountActive
                          : t.dashboard.accountLocked}
                      </span>
                    </div>
                    {hasUndocumentedRole && (
                      <p className="mt-2 text-xs text-text-muted" role="note">
                        {t.dashboard.cannotManageUndocumentedRoles}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      disabled={isPending || hasUndocumentedRole}
                      onClick={() =>
                        editingUserId === user.id
                          ? setEditingUserId(null)
                          : openRoleEditor(user)
                      }
                      className="rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold text-text-main hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        hasUndocumentedRole
                          ? t.dashboard.cannotManageUndocumentedRoles
                          : undefined
                      }
                    >
                      {editingUserId === user.id
                        ? t.dashboard.cancel
                        : t.dashboard.manageRoles}
                    </button>
                    <button
                      type="button"
                      disabled={isPending || (isCurrentUser && user.isActive)}
                      onClick={() => toggleAccountStatus(user)}
                      className="rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold text-text-main hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        isCurrentUser && user.isActive
                          ? t.dashboard.cannotLockOwnAccount
                          : undefined
                      }
                    >
                      {user.isActive
                        ? isCurrentUser
                          ? t.dashboard.cannotLockOwnAccount
                          : t.dashboard.lockAccount
                        : t.dashboard.unlockAccount}
                    </button>
                  </div>

                  {editingUserId === user.id && (
                    <form
                      onSubmit={(event) => saveRoles(event, user)}
                      className="w-full rounded-xl border border-primary/10 bg-bg-main/50 p-4 sm:basis-full"
                    >
                      <fieldset disabled={isPending}>
                        <legend className="mb-3 text-sm font-bold">
                          {t.dashboard.userRoles}
                        </legend>
                        <div className="flex flex-wrap gap-x-5 gap-y-3">
                          {ROLES.map((userRole) => {
                            const protectedAdminRole =
                              isCurrentUser &&
                              userRole === "Admin" &&
                              user.roles.includes("Admin");

                            return (
                              <label
                                key={userRole}
                                className="inline-flex items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  value={userRole}
                                  checked={selectedRoles.includes(userRole)}
                                  disabled={protectedAdminRole}
                                  onChange={(event) => {
                                    setSelectedRoles((currentRoles) =>
                                      event.target.checked
                                        ? [...currentRoles, userRole]
                                        : currentRoles.filter(
                                            (currentRole) =>
                                              currentRole !== userRole,
                                          ),
                                    );
                                  }}
                                  className="size-4 accent-primary"
                                />
                                {roleLabels[userRole]}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                      {isCurrentUser && user.roles.includes("Admin") && (
                        <p className="mt-3 text-xs text-text-muted">
                          {t.dashboard.ownAdminRoleProtected}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={
                            isPending ||
                            haveSameRoles(user.roles, selectedRoles)
                          }
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-inverse disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isPending
                            ? t.dashboard.saving
                            : t.dashboard.saveRoles}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setEditingUserId(null)}
                          className="rounded-xl px-3 py-2 text-sm font-semibold text-text-muted hover:text-text-main disabled:opacity-50"
                        >
                          {t.dashboard.cancel}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="font-bold text-primary disabled:opacity-40"
            >
              {t.dashboard.previousPage}
            </button>
            <span className="text-text-muted">
              {t.dashboard.page} {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="font-bold text-primary disabled:opacity-40"
            >
              {t.dashboard.nextPage}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
