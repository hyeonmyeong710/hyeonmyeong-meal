"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
};

const normalize = (item: string) => {
  return ingredientMap[item] || item;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const selected = searchParams.get("ingredients");
  const selectedList = selected ? selected.split(",") : [];
  const normalizedSelected = selectedList.map(normalize);

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("title", { ascending: true }); // 🔥 이름순 정렬

      if (error) {
        alert("불러오기 실패");
        return;
      }

      setRecipes(data || []);
    };

    fetchRecipes();
  }, []);

  const results: RecipeWithMatch[] = recipes.map((recipe) => {
    const required = recipe.required_ingredients || [];

    const missing = required.filter(
      (item) => !normalizedSelected.includes(normalize(item))
    );

    return {
      ...recipe,
      missingCount: missing.length,
      missingItems: missing,
    };
  });

  const possible = results.filter((r) => r.missingCount === 0);

  return (
    <main className="min-h-screen bg-neutral-100 px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-black">
          만들 수 있는 음식
        </h1>

        <div className="mt-6 space-y-4">
          {possible.length > 0 ? (
            possible.map((recipe) => (
              <div key={recipe.id} className="bg-white p-5 rounded-3xl">
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    className="mb-4 h-44 w-full rounded-2xl object-cover"
                  />
                )}

                <h2 className="text-2xl font-bold">{recipe.title}</h2>

                <Link
                  href={`/recipes/${recipe.id}`}
                  className="mt-4 block w-full rounded-2xl bg-black py-3 text-center text-white"
                >
                  보기
                </Link>
              </div>
            ))
          ) : (
            <p className="mt-6">만들 수 있는 레시피가 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  );
}