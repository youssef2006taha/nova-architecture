import { useCallback, useEffect, useState } from "react";
import { getHomeCms } from "../api/cms/cms.api";

const isValidHomeContent = (response) =>
  Boolean(
    response?.hero &&
      typeof response.hero.mainTitle === "string" &&
      typeof response.hero.subtitle === "string" &&
      typeof response.hero.primaryCtaText === "string" &&
      Array.isArray(response.featuredCategories) &&
      response.featuredCategories.every(
        (category) => category?.id != null && typeof category.name === "string",
      ) &&
      Array.isArray(response.featuredCourses) &&
      response.featuredCourses.every(
        (course) =>
          course?.id != null &&
          typeof course.title === "string" &&
          Number.isFinite(Number(course.price)),
      ) &&
      response.statistics &&
      [
        "totalStudents",
        "totalCourses",
        "totalEnrollments",
        "totalInstructors",
      ].every((key) => Number.isFinite(Number(response.statistics[key]))),
  );

export default function useHomeCms() {
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState({
    key: null,
    content: null,
    error: false,
  });

  const homeContent = result.key === retryKey ? result.content : null;
  const homeLoading = result.key !== retryKey;
  const homeError = result.key === retryKey && result.error;

  useEffect(() => {
    const controller = new AbortController();

    getHomeCms({ signal: controller.signal })
      .then((response) => {
        if (!isValidHomeContent(response)) {
          throw new Error("The homepage response did not match the API contract.");
        }

        setResult({
          key: retryKey,
          content: response,
          error: false,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (import.meta.env.DEV) {
          console.error("Failed to load homepage content.", {
            status: error?.response?.status,
            message: error?.message || "Unknown error",
          });
        }
        setResult({
          key: retryKey,
          content: null,
          error: true,
        });
      });

    return () => controller.abort();
  }, [retryKey]);

  const retryHomeContent = useCallback(() => {
    setRetryKey((value) => value + 1);
  }, []);

  return { homeContent, homeLoading, homeError, retryHomeContent };
}
