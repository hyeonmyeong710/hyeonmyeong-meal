"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Ingredient = {
  id: number;
  name: string;
};

const featuredIngredients = [
  "달걀",
  "감자",
  "양파",
  "두부",
  "당근",
  "애호박",
  "올리브오일",
  "소금",
];

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchIngredients = async () => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        alert(`재료 불러오기 실패: ${error.message}`);
        return;
      }

      const names = ((data || []) as Ingredient[])
        .map((item) => item.name)
        .filter(Boolean);

      setIngredients(Array.from(new Set([...featuredIngredients, ...names])));
    };

    fetchIngredients();
  }, []);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const removeItem = (item: string) => {
    setSelected((prev) => prev.filter((i) => i !== item));
  };

  const filteredIngredients = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    return ingredients.filter((item) => item.includes(q)).slice(0, 20);
  }, [query, ingredients]);

  const handleSubmit = () => {
    const queryString = selected.join(",");
    router.push(`/results?ingredients=${encodeURIComponent(queryString)}`);
  };

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-center text-2xl font-bold text-neutral-900">
          있는 재료 선택
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          자주 쓰는 재료를 누르거나 검색해서 추가하세요
        </p>

        <div className="mt-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="재료 검색하기"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-lg text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        {query.trim() && (
          <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
            {filteredIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredIngredients.map((item) => {
                  const isSelected = selected.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(item)}
                      className={
                        isSelected
                          ? "rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                          : "rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900"
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">검색 결과가 없습니다.</p>
            )}
          </div>
        )}

        <section className="mt-6">
          <h2 className="text-lg font-bold text-neutral-900">자주 쓰는 재료</h2>

          <div className="mt-3 space-y-3">
            {featuredIngredients.map((item) => {
              const isSelected = selected.includes(item);

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={
                    isSelected
                      ? "flex w-full items-center justify-between rounded-2xl bg-neutral-900 px-4 py-5 text-left text-white shadow-sm"
                      : "flex w-full items-center justify-between rounded-2xl bg-white px-4 py-5 text-left text-neutral-900 shadow-sm"
                  }
                >
                  <span className="text-xl font-semibold">{item}</span>
                  <span
                    className={
                      isSelected
                        ? "text-sm font-semibold text-neutral-200"
                        : "text-sm font-semibold text-neutral-500"
                    }
                  >
                    {isSelected ? "선택됨" : "추가"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold text-neutral-900">선택한 재료</h2>

          <div className="mt-3 min-h-[56px] rounded-2xl bg-white p-3 shadow-sm">
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeItem(item)}
                    className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                아직 선택한 재료가 없습니다.
              </p>
            )}
          </div>
        </section>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-neutral-900 px-4 py-5 text-center text-2xl font-bold text-white shadow-sm"
          >
            이걸로 만들기
          </button>
        </div>
      </div>
    </main>
  );
}