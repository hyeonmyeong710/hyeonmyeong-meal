"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Recipe = {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, title, description, image_url")
        .order("created_at", { ascending: false });

      if (error) {
        alert(`레시피 불러오기 실패: ${error.message}`);
        return;
      }

      setRecipes((data || []) as Recipe[]);
    };

    fetchRecipes();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100 px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-black">레시피 둘러보기</h1>

        <div className="mt-6 space-y-4">
          {recipes.length > 0 ? (
            recipes.map((recipe) => (
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

                <h2 className="text-2xl font-bold text-black">
                  {recipe.title}
                </h2>

                <p className="mt-3 text-base text-neutral-600">
                  {recipe.description || "설명이 없습니다."}
                </p>

                <Link
                  href={`/recipes/${recipe.id}`}
                  className="mt-4 block w-full rounded-2xl bg-black py-3 text-center font-bold text-white"
                >
                  상세 보기
                </Link>
              </div>
            ))
          ) : (
            <p className="text-neutral-500">등록된 레시피가 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  );
}