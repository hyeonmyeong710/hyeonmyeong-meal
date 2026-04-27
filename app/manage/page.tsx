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

export default function ManagePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("title", { ascending: true }); // 🔥 이름순 정렬

      if (error) {
        alert(`불러오기 실패: ${error.message}`);
        return;
      }

      setRecipes((data || []) as Recipe[]);
    };

    fetchRecipes();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100 px-5 py-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-black">레시피로 찾기</h1>

        <div className="mt-6">
          <Link
            href="/write"
            className="flex w-full items-center justify-center rounded-2xl bg-black px-5 py-4 text-xl font-bold text-white"
          >
            새 레시피 작성
          </Link>
        </div>

        <section className="mt-8 space-y-4">
          {recipes.length > 0 ? (
            recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-3xl bg-white p-5 shadow-sm"
              >
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
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
            <p>아직 저장된 레시피가 없습니다.</p>
          )}
        </section>
      </div>
    </main>
  );
}