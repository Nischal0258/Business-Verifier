"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Globe2,
  Languages,
  MapPin,
  Quote,
  UsersRound,
} from "lucide-react";
import type {
  CitationSource,
  FounderProfile,
  GlobalOperation,
  HeadquartersInfo,
} from "@/types";

type Locale = "en" | "es" | "fr";

interface CompanyInformationChapterProps {
  companyName: string;
  founders: FounderProfile[];
  headquarters: HeadquartersInfo;
  operations: GlobalOperation[];
  citations: CitationSource[];
  chapterLastUpdated?: string | null;
}

const copyByLocale: Record<
  Locale,
  {
    chapter: string;
    founders: string;
    headquarters: string;
    operations: string;
    foundingRole: string;
    currentPosition: string;
    source: string;
    offices: string;
    services: string;
    citations: string;
    updated: string;
  }
> = {
  en: {
    chapter: "Company Information Chapter",
    founders: "Founder Profiles",
    headquarters: "Headquarters Information",
    operations: "Global Operations",
    foundingRole: "Founding role",
    currentPosition: "Current position",
    source: "Source",
    offices: "Office locations",
    services: "Service offerings",
    citations: "Citation Sources",
    updated: "Last updated",
  },
  es: {
    chapter: "Capítulo de Información Corporativa",
    founders: "Perfiles de Fundadores",
    headquarters: "Información de Sede Central",
    operations: "Operaciones Globales",
    foundingRole: "Rol de fundación",
    currentPosition: "Cargo actual",
    source: "Fuente",
    offices: "Ubicaciones de oficinas",
    services: "Servicios",
    citations: "Fuentes citadas",
    updated: "Última actualización",
  },
  fr: {
    chapter: "Chapitre Informations de l’Entreprise",
    founders: "Profils des Fondateurs",
    headquarters: "Informations du Siège",
    operations: "Opérations Mondiales",
    foundingRole: "Rôle fondateur",
    currentPosition: "Poste actuel",
    source: "Source",
    offices: "Localisations des bureaux",
    services: "Offres de service",
    citations: "Sources citées",
    updated: "Dernière mise à jour",
  },
};

function getInitialLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const language = navigator.language.toLowerCase();
  if (language.startsWith("es")) return "es";
  if (language.startsWith("fr")) return "fr";
  return "en";
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function founderPhotoUrl(founder: FounderProfile): string {
  if (founder.photo_url) return founder.photo_url;
  const encoded = encodeURIComponent(founder.name || "Company Leader");
  return `https://ui-avatars.com/api/?name=${encoded}&background=2A2435&color=F4F0E8&size=256`;
}

export default function CompanyInformationChapter({
  companyName,
  founders,
  headquarters,
  operations,
  citations,
  chapterLastUpdated,
}: CompanyInformationChapterProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [headquartersState, setHeadquartersState] = useState<HeadquartersInfo>(headquarters);

  useEffect(() => {
    setLocale(getInitialLocale());
  }, []);

  useEffect(() => {
    setHeadquartersState(headquarters);
  }, [headquarters]);

  const copy = copyByLocale[locale];
  const mapQuery = useMemo(() => {
    const query =
      headquartersState.map_query ||
      headquartersState.full_address ||
      headquartersState.facility_details ||
      companyName;
    return encodeURIComponent(query || companyName);
  }, [companyName, headquartersState]);

  return (
    <section
      aria-labelledby="company-information-chapter-title"
      className="rounded-2xl border border-[#d8c7a8]/15 bg-[#17151c]/80 p-6 md:p-8"
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#d8c7a8]/10 p-2">
            <Building2 className="h-5 w-5 text-[#e4d6bd]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#bfae8f]">Chapter II</p>
            <h2 id="company-information-chapter-title" className="font-serif text-2xl md:text-3xl">
              {copy.chapter}
            </h2>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 rounded-lg border border-[#d8c7a8]/15 bg-[#111018] px-3 py-2 text-sm">
          <Languages className="h-4 w-4 text-[#bfae8f]" aria-hidden="true" />
          <span className="sr-only">Select language</span>
          <select
            aria-label="Select language"
            className="bg-transparent text-[#e5dccf] outline-none"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="en" className="bg-[#111018]">
              English
            </option>
            <option value="es" className="bg-[#111018]">
              Español
            </option>
            <option value="fr" className="bg-[#111018]">
              Français
            </option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-5" aria-labelledby="founders-title">
          <div className="mb-4 flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-[#e4d6bd]" aria-hidden="true" />
            <h3 id="founders-title" className="text-lg font-semibold text-[#f4f0e8]">
              {copy.founders}
            </h3>
          </div>
          <div className="space-y-4">
            {(founders.length ? founders : [{ name: "Not available" } as FounderProfile]).map((founder, idx) => (
              <div key={`${founder.name}-${idx}`} className="rounded-lg border border-[#d8c7a8]/10 p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={founderPhotoUrl(founder)}
                    alt={`${founder.name || "Founder"} profile`}
                    className="h-16 w-16 rounded-lg object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[#f4f0e8]">{founder.name || "N/A"}</p>
                    <p className="mt-1 text-sm text-[#d9cfbe] leading-6">
                      {founder.biography || "Biographical details are currently unavailable."}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#bfae8f]">
                      <p>
                        <strong className="text-[#e5dccf]">{copy.foundingRole}:</strong>{" "}
                        {founder.founding_role || "N/A"}
                      </p>
                      <p>
                        <strong className="text-[#e5dccf]">{copy.currentPosition}:</strong>{" "}
                        {founder.current_position || "N/A"}
                      </p>
                      <p>
                        <strong className="text-[#e5dccf]">{copy.source}:</strong> {founder.source || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article
          className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-5"
          aria-labelledby="headquarters-title"
        >
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#e4d6bd]" aria-hidden="true" />
            <h3 id="headquarters-title" className="text-lg font-semibold text-[#f4f0e8]">
              {copy.headquarters}
            </h3>
          </div>
          <div className="space-y-3 text-sm leading-7 text-[#e5dccf]">
            <p>
              <strong className="text-[#f4f0e8]">Address:</strong>{" "}
              {headquartersState.full_address || "Not available"}
            </p>
            <p>
              <strong className="text-[#f4f0e8]">Founding date:</strong>{" "}
              {headquartersState.founding_date || "Not available"}
            </p>
            <p>
              <strong className="text-[#f4f0e8]">Facility details:</strong>{" "}
              {headquartersState.facility_details || "Not available"}
            </p>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#d8c7a8]/10">
            <iframe
              title={`${companyName} headquarters map`}
              src={`https://maps.google.com/maps?q=${mapQuery}&z=13&output=embed`}
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </article>
      </div>

      <article
        className="mt-6 rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-5"
        aria-labelledby="operations-title"
      >
        <div className="mb-4 flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-[#e4d6bd]" aria-hidden="true" />
          <h3 id="operations-title" className="text-lg font-semibold text-[#f4f0e8]">
            {copy.operations}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(operations.length ? operations : [{ country: "Not available", office_locations: [], service_offerings: [] }]).map(
            (operation, idx) => (
              <section key={`${operation.country}-${idx}`} className="rounded-lg border border-[#d8c7a8]/10 p-4">
                <h4 className="text-base font-semibold text-[#f4f0e8]">{operation.country}</h4>
                <p className="mt-2 text-xs uppercase tracking-[0.15em] text-[#bfae8f]">{copy.offices}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#e5dccf]">
                  {(operation.office_locations.length ? operation.office_locations : ["Not available"]).map((location) => (
                    <li key={location}>{location}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs uppercase tracking-[0.15em] text-[#bfae8f]">{copy.services}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#e5dccf]">
                  {(operation.service_offerings.length ? operation.service_offerings : ["Not available"]).map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      </article>

      <div className="mt-6">
        <aside className="rounded-xl border border-[#d8c7a8]/10 bg-[#111018] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Quote className="h-4 w-4 text-[#e4d6bd]" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[#f4f0e8]">{copy.citations}</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {(citations.length
              ? citations
              : [{ title: "No citations available", verified: false } as CitationSource]
            ).map((citation, idx) => (
              <li key={`${citation.title}-${idx}`} className="rounded-lg border border-[#d8c7a8]/10 p-3">
                <p className="text-[#f4f0e8]">{citation.title}</p>
                <p className="mt-1 text-xs text-[#bfae8f]">
                  {citation.publisher || "Unknown publisher"} {citation.verified ? "• Verified" : "• Unverified"}
                </p>
                {citation.url && (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-blue-300 underline underline-offset-2"
                  >
                    {citation.url}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#bfae8f]">
            {copy.updated}: {formatTimestamp(chapterLastUpdated)}
          </p>
        </aside>
      </div>
    </section>
  );
}
