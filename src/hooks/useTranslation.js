import { useSelector } from "react-redux";
import { en } from "../data/langs/en";
import { ar } from "../data/langs/ar";

export default function useTranslation() {
  const { current, dir } = useSelector((state) => state.lang);
  const t = current === "ar" ? ar : en;
  return { t, currentLang: current, dir };
}

