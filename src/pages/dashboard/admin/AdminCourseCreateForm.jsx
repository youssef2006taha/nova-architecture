import { useEffect, useRef, useState } from "react";
import {
  getCategories,
  getSoftwareTags,
} from "../../../api/courses/courses.api";
import {
  createInstructorCourse,
  uploadCourseImage,
} from "../../../api/instructor/instructor.api";
import CustomInput from "../../../components/ui/CustomInput";
import CustomSelect from "../../../components/ui/CustomSelect";
import useTranslation from "../../../hooks/useTranslation";
import { getAdminErrorMessage } from "./adminDashboardUtils";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const createEmptyCourse = () => ({
  title: "",
  subtitle: "",
  description: "",
  categoryId: "",
  level: "",
  price: "",
  discountPrice: "",
  softwareTagIds: [],
  thumbnailUrl: "",
  previewVideoUrl: "",
});

export default function AdminCourseCreateForm() {
  const { t } = useTranslation();
  const thumbnailInputRef = useRef(null);
  const mountedRef = useRef(true);
  const [retryKey, setRetryKey] = useState(0);
  const [catalog, setCatalog] = useState({
    key: null,
    categories: [],
    softwareTags: [],
    error: null,
  });
  const [form, setForm] = useState(createEmptyCourse);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imageError, setImageError] = useState("");
  const [createError, setCreateError] = useState("");
  const [success, setSuccess] = useState(false);
  const loading = catalog.key !== retryKey;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getCategories({ signal: controller.signal }),
      getSoftwareTags({ signal: controller.signal }),
    ])
      .then(([categories, softwareTags]) => {
        if (controller.signal.aborted) return;
        const validCatalog =
          Array.isArray(categories) &&
          categories.every(
            (category) =>
              category?.id != null && typeof category.name === "string",
          ) &&
          Array.isArray(softwareTags) &&
          softwareTags.every(
            (tag) => tag?.id != null && typeof tag.name === "string",
          );
        if (!validCatalog) {
          setCatalog({
            key: retryKey,
            categories: [],
            softwareTags: [],
            error: { type: "invalid" },
          });
          return;
        }
        setCatalog({
          key: retryKey,
          categories,
          softwareTags,
          error: null,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setCatalog({
          key: retryKey,
          categories: [],
          softwareTags: [],
          error: { type: "load", status: error?.response?.status },
        });
      });

    return () => controller.abort();
  }, [retryKey]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name === "thumbnailUrl") {
      setImageUploaded(false);
      setImageError("");
    }
    setSuccess(false);
  };

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError("");
    setImageUploaded(false);
    setSuccess(false);
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(t.dashboard.courseImageTooLarge);
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploadingImage(true);
    try {
      const response = await uploadCourseImage(formData);
      if (!mountedRef.current) return;
      if (!response || typeof response.url !== "string" || !response.url) {
        throw new Error(t.dashboard.courseImageInvalidResponse);
      }
      setForm((current) => ({ ...current, thumbnailUrl: response.url }));
      setImageUploaded(true);
    } catch (error) {
      if (mountedRef.current) {
        setImageError(
          getAdminErrorMessage(
            error,
            t.dashboard.courseImageUploadError,
            t.dashboard,
          ),
        );
      }
    } finally {
      if (mountedRef.current) {
        setUploadingImage(false);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      }
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreateError("");
    setSuccess(false);
    const price = Number(form.price);
    const discountPrice = Number(form.discountPrice);
    if (!Number.isFinite(price) || !Number.isFinite(discountPrice)) {
      setCreateError(t.dashboard.coursePriceInvalid);
      return;
    }

    setCreating(true);
    try {
      await createInstructorCourse({
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        level: form.level,
        price,
        discountPrice,
        softwareTagIds: form.softwareTagIds,
        thumbnailUrl: form.thumbnailUrl.trim(),
        previewVideoUrl: form.previewVideoUrl.trim(),
      });
      if (!mountedRef.current) return;
      setForm(createEmptyCourse());
      setImageUploaded(false);
      setImageError("");
      setSuccess(true);
    } catch (error) {
      if (mountedRef.current) {
        setCreateError(
          getAdminErrorMessage(
            error,
            t.dashboard.courseCreateError,
            t.dashboard,
          ),
        );
      }
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  const toggleSoftwareTag = (tagId) => {
    setForm((current) => ({
      ...current,
      softwareTagIds: current.softwareTagIds.includes(tagId)
        ? current.softwareTagIds.filter((selectedId) => selectedId !== tagId)
        : [...current.softwareTagIds, tagId],
    }));
    setSuccess(false);
  };

  const catalogErrorMessage =
    catalog.error?.type === "invalid"
      ? t.dashboard.courseCatalogInvalid
      : getAdminErrorMessage(
          { response: { status: catalog.error?.status } },
          t.dashboard.courseCatalogLoadError,
          t.dashboard,
        );

  return (
    <section className="space-y-4 rounded-2xl border border-primary/10 bg-bg-surface p-5">
      <h3 className="text-base font-bold">{t.dashboard.createCourseDraft}</h3>
      {loading ? (
        <p className="py-4 text-center text-sm text-text-muted" role="status">
          {t.dashboard.courseCatalogLoading}
        </p>
      ) : catalog.error ? (
        <div className="space-y-3 text-sm" role="alert">
          <p>{catalogErrorMessage}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="font-bold text-primary hover:underline"
          >
            {t.dashboard.retry}
          </button>
        </div>
      ) : catalog.categories.length === 0 ? (
        <p className="text-sm text-text-muted">{t.dashboard.noCourseCategories}</p>
      ) : (
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CustomInput
              name="title"
              label={t.dashboard.courseTitle}
              value={form.title}
              onChange={updateField}
              required
            />
            <CustomInput
              name="subtitle"
              label={t.dashboard.courseSubtitle}
              value={form.subtitle}
              onChange={updateField}
              required
            />
            <CustomSelect
              name="categoryId"
              label={t.dashboard.courseCategory}
              placeholder={t.dashboard.selectCourseCategory}
              value={form.categoryId}
              onChange={updateField}
              required
              options={catalog.categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />
            <CustomSelect
              name="level"
              label={t.dashboard.courseLevel}
              placeholder={t.dashboard.selectCourseLevel}
              value={form.level}
              onChange={updateField}
              required
              options={[
                { value: "Beginner", label: t.dashboard.beginnerLevel },
                {
                  value: "Intermediate",
                  label: t.dashboard.intermediateLevel,
                },
                { value: "Advanced", label: t.dashboard.advancedLevel },
              ]}
            />
            <CustomInput
              name="price"
              label={t.dashboard.coursePrice}
              type="number"
              inputProps={{ step: "any" }}
              value={form.price}
              onChange={updateField}
              required
            />
            <CustomInput
              name="discountPrice"
              label={t.dashboard.courseDiscountPrice}
              type="number"
              inputProps={{ step: "any" }}
              value={form.discountPrice}
              onChange={updateField}
              required
            />
            <CustomInput
              name="thumbnailUrl"
              label={t.dashboard.courseThumbnailUrl}
              value={form.thumbnailUrl}
              onChange={updateField}
              required
            />
            <CustomInput
              name="previewVideoUrl"
              label={t.dashboard.coursePreviewVideoUrl}
              value={form.previewVideoUrl}
              onChange={updateField}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="admin-course-description"
              className="text-sm font-semibold text-text-main/60 dark:text-text-main/90"
            >
              {t.dashboard.courseDescription}
            </label>
            <textarea
              id="admin-course-description"
              name="description"
              value={form.description}
              onChange={updateField}
              required
              rows={4}
              className="w-full rounded-md border border-primary/10 bg-primary/4 px-3 py-2 text-sm text-text-main outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {catalog.softwareTags.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">
                {t.dashboard.courseSoftwareTags}
              </legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {catalog.softwareTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.softwareTagIds.includes(tag.id)}
                      onChange={() => toggleSoftwareTag(tag.id)}
                      className="size-4 accent-primary"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-2">
            <label
              htmlFor="admin-course-thumbnail-file"
              className="block text-sm font-semibold text-text-main/60 dark:text-text-main/90"
            >
              {t.dashboard.uploadCourseThumbnail}
            </label>
            <input
              ref={thumbnailInputRef}
              id="admin-course-thumbnail-file"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              disabled={uploadingImage || creating}
              onChange={handleThumbnailUpload}
              className="block w-full text-sm text-text-muted file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-semibold file:text-primary disabled:opacity-50"
            />
            <p className="text-xs text-text-muted">
              {uploadingImage
                ? t.dashboard.courseImageUploading
                : t.dashboard.courseImageUploadHelp}
            </p>
            {imageUploaded && (
              <p
                className="text-sm text-emerald-600 dark:text-emerald-400"
                role="status"
              >
                {t.dashboard.courseImageUploaded}
              </p>
            )}
            {imageError && (
              <p className="text-sm text-red-500" role="alert">
                {imageError}
              </p>
            )}
          </div>

          {createError && (
            <p className="text-sm text-red-500" role="alert">
              {createError}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {t.dashboard.courseCreated}
            </p>
          )}
          <button
            type="submit"
            disabled={creating || uploadingImage}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-inverse disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? t.dashboard.courseCreating : t.dashboard.createCourse}
          </button>
        </form>
      )}
    </section>
  );
}
