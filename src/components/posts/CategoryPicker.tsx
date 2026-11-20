"use client";

import { POST_CATEGORIES, type PostCategory } from "@/lib/postCategories";

interface CategoryPickerProps {
  value: PostCategory;
  onChange: (value: PostCategory) => void;
  /** Id prefix — keeps radio names unique when two pickers are on screen. */
  idPrefix?: string;
}

// Category chips for the post composer / editor (a real radio group, so it
// works with keyboards and screen readers).
export default function CategoryPicker({ value, onChange, idPrefix = "post" }: CategoryPickerProps) {
  const selected = POST_CATEGORIES.find((c) => c.value === value);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-text">
        Category <span className="font-normal text-muted">· {selected?.hint}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {POST_CATEGORIES.map((c) => {
          const checked = c.value === value;
          const id = `${idPrefix}-category-${c.value}`;
          return (
            <label
              key={c.value}
              htmlFor={id}
              className={`flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-fg ${
                checked ? "bg-primary text-on-primary" : "bg-surface-2 text-text hover:bg-border"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={`${idPrefix}-category`}
                value={c.value}
                checked={checked}
                onChange={() => onChange(c.value)}
                className="sr-only"
              />
              {c.label}
            </label>
          );
        })}
      </div>
      {value === "business" && (
        <p className="mt-2 text-sm text-muted">
          You can share <strong className="text-text">1 free business post per week</strong>.
        </p>
      )}
    </fieldset>
  );
}
