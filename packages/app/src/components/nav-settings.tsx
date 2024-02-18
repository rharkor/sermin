import { Locale } from "i18n-config"

import LocaleSwitcher from "./locale-switcher"

export default function NavSettings({ lang }: { lang: Locale }) {
  return (
    <div className="fixed right-3 top-3 z-10 flex flex-row gap-3">
      <LocaleSwitcher lang={lang} />
    </div>
  )
}
