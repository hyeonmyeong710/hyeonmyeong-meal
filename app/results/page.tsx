"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Recipe = {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  required_ingredients: string[];
};

type RecipeWithMatch = Recipe & {
  missingCount: number;
  missingItems: string[];
  matchedCount: number;
  matchedItems: string[];
};

const ingredientMap: Record<string, string> = {
  피망: "파프리카",
  청피망: "파프리카",
  홍피망: "파프리카",

  와사비: "고추냉이",
  고추냉이: "고추냉이",

  계란: "달걀",
  달걀: "달걀",

  대파: "파",
  쪽파: "파",
  실파: "파",

  양배추: "양배추",
  캐비지: "양배추",

  브로콜리: "브로콜리",
  브로컬리: "브로콜리",

  오트밀: "귀리",
  귀리: "귀리",

  병아리콩: "병아리콩",
  칙피: "병아리콩",

  렌틸콩: "렌틸콩",
  렌즈콩: "렌틸콩",
};

const normalize = (item: string) => {
  const cleaned = item.trim();
  return ingredientMap[cleaned] || cleaned;
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const selected = searchParams.get("ingredients");

  const selectedList = selected ? selected.split(",").filter(Boolean) : [];
  const normalizedSelected = selectedList.map(normalize);

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("title", { ascending: true });

      if (error) {
        alert(`불러오기 실패: ${error.message}`);
        return;
      }

      setRecipes((data || []) as Recipe[]);
    };

    fetchRecipes();
  }, []);

  const results: RecipeWithMatch[] = recipes.map((recipe) => {
    const required = recipe.required_ingredients || [];

    const missing = required.filter(
      (item) => !normalizedSelected.includes(normalize(item))
    );

    const matched = required.filter((item) =>
      normalizedSelected.includes(normalize(item))
    );

    return {
      ...recipe,
      missingCount: missing.length,
      missingItems: missing,
      matchedCount: matched.length,
      matchedItems: matched,
    };
  });

  const possible = results
    .filter((recipe) => recipe.required_ingredients.length > 0 && recipe.missingCount === 0)
    .sort((a, b) => b.matchedCount - a.matchedCount);

  const almost = results
    .filter((recipe) => recipe.missingCount > 0 && recipe.matchedCount > 0)
    .sort((a, b) => {
      if (a.missingCount !== b.missingCount) {
        return a.missingCount - b.missingCount;
      }

      return b.matchedCount - a.matchedCount;
    });

  return (
    <main className="min-h-screen bg-neutral-100 px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-black">만들 수 있는 음식</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedList.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-4 py-2 text-base font-semibold text-black shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>

        {possible.length > 0 && (
          <>
            <h2 className="mt-8 text-2xl font-bold text-black">
              바로 만들 수 있음
            </h2>

            <div className="mt-5 space-y-4">
              {possible.map((recipe) => (
                <div
                  key={recipe.id}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  {recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="mb-4 h-44 w-full rounded-2xl object-cover"
                    />
                  )}

                  <h3 className="text-2xl font-bold text-black">
                    {recipe.title}
                  </h3>

                  <p className="mt-3 text-base text-neutral-600">
                    {recipe.description || "설명이 없습니다."}
                  </p>

                  {recipe.matchedItems.length > 0 && (
                    <p className="mt-4 text-sm font-semibold text-neutral-500">
                      사용 가능 재료: {recipe.matchedItems.join(", ")}
                    </p>
                  )}

                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="mt-4 block w-full rounded-2xl bg-black py-3 text-center font-bold text-white"
                  >
                    보기
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {almost.length > 0 && (
          <>
            <h2 className="mt-8 text-2xl font-bold text-black">
              거의 만들 수 있음
            </h2>

            <div className="mt-5 space-y-4">
              {almost.map((recipe) => (
                <div
                  key={recipe.id}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  {recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="mb-4 h-44 w-full rounded-2xl object-cover"
                    />
                  )}

                  <h3 className="text-2xl font-bold text-black">
                    {recipe.title}
                  </h3>

                  <p className="mt-3 text-base text-neutral-600">
                    {recipe.description || "설명이 없습니다."}
                  </p>

                  {recipe.matchedItems.length > 0 && (
                    <p className="mt-4 text-sm font-semibold text-neutral-500">
                      있는 재료: {recipe.matchedItems.join(", ")}
                    </p>
                  )}

                  <p className="mt-2 text-lg font-bold text-red-600">
                    부족한 재료: {recipe.missingItems.join(", ")}
                  </p>

                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="mt-4 block w-full rounded-2xl bg-black py-3 text-center font-bold text-white"
                  >
                    보기
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        {possible.length === 0 && almost.length === 0 && (
          <p className="mt-8 text-lg text-neutral-500">
            만들 수 있는 레시피가 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-100 px-5 py-8">
          <div className="mx-auto max-w-md">
            <p className="text-lg text-neutral-500">불러오는 중...</p>
          </div>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}