import { useLanguage } from "@/contexts/LanguageContext";
import { Language, languageLabels } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const flagSvgs: Record<Language, React.ReactNode> = {
  fr: (
    <svg viewBox="0 0 640 480" className="h-4 w-6 rounded-sm shadow-sm">
      <rect width="213.3" height="480" fill="#002395" />
      <rect x="213.3" width="213.4" height="480" fill="#fff" />
      <rect x="426.7" width="213.3" height="480" fill="#ED2939" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 640 480" className="h-4 w-6 rounded-sm shadow-sm">
      <rect width="640" height="480" fill="#012169" />
      <path d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 82 480H0v-60l239-178L0 64V0h75z" fill="#fff" />
      <path d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" fill="#C8102E" />
      <path d="M241 0v480h160V0H241zM0 160v160h640V160H0z" fill="#fff" />
      <path d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" fill="#C8102E" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 640 480" className="h-4 w-6 rounded-sm shadow-sm">
      <rect width="640" height="480" fill="#c60b1e" />
      <rect y="120" width="640" height="240" fill="#ffc400" />
    </svg>
  ),
  pt: (
    <svg viewBox="0 0 640 480" className="h-4 w-6 rounded-sm shadow-sm">
      <rect width="640" height="480" fill="#060" />
      <rect x="256" width="384" height="480" fill="#f00" />
      <circle cx="256" cy="240" r="80" fill="#ff0" stroke="#060" strokeWidth="4" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 640 480" className="h-4 w-6 rounded-sm shadow-sm">
      <rect width="640" height="160" fill="#000" />
      <rect y="160" width="640" height="160" fill="#D00" />
      <rect y="320" width="640" height="160" fill="#FFCE00" />
    </svg>
  ),
};

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {flagSvgs[lang]}
          <span className="hidden sm:inline">{languageLabels[lang]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(languageLabels) as Language[]).map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={`gap-2 ${lang === l ? "bg-accent font-medium" : ""}`}
          >
            {flagSvgs[l]}
            {languageLabels[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
