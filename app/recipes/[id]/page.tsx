"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PurchaseLink = {
  ingredient: string;
  url: string;
};

type Recipe = {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  required_ingredients: string[];
  optional_ingredients: string[];
  steps: string[];
  purchase_links: PurchaseLink[];
  references: string[];
};

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", Number(params.id))
        .single();

      if (error || !data) {
        setRecipe(null);
        setLoading(false);
        return;
      }

      setRecipe(data as Recipe);
      setLoading(false);
    };

    fetchRecipe();
  }, [params.id]);

  const handleDelete = async () => {
    if (!recipe) return;

    const confirmed = window.confirm("이 레시피를 삭제할까요?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipe.id);

    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }

    alert("삭제 완료!");
    router.push("/manage");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        <div className="mx-auto max-w-md">
          <p className="text-lg text-neutral-500">불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        <div className="mx-auto max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-neutral-900">
            레시피를 찾을 수 없습니다.
          </h1>

          <Link
            href="/manage"
            className="flex w-full items-center justify-center rounded-2xl bg-black px-5 py-4 text-lg font-bold text-white"
          >
            관리로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-md space-y-8">
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-64 w-full rounded-3xl object-cover"
          />
        )}

        <section>
          <p className="text-sm text-neutral-500">현명한 한끼 레시피</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            {recipe.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-neutral-600">
            {recipe.description || "설명이 없습니다."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-neutral-900">필수 재료</h2>
          {recipe.required_ingredients?.length > 0 ? (
            <ul className="space-y-2 text-neutral-700">
              {recipe.required_ingredients.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">등록된 필수 재료가 없습니다.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-neutral-900">선택 재료</h2>
          {recipe.optional_ingredients?.length > 0 ? (
            <ul className="space-y-2 text-neutral-700">
              {recipe.optional_ingredients.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">등록된 선택 재료가 없습니다.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-neutral-900">만드는 방법</h2>
          {recipe.steps?.length > 0 ? (
            <ol className="space-y-3 text-neutral-700">
              {recipe.steps.map((step, index) => (
                <li key={`${step}-${index}`}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-neutral-500">등록된 조리 방법이 없습니다.</p>
          )}
        </section>

        <section className="space-y-3 rounded-3xl bg-neutral-50 p-5">
          <h2 className="text-xl font-semibold text-neutral-900">
            이 레시피에 사용한 재료
          </h2>

          {recipe.purchase_links?.length > 0 ? (
            <ul className="space-y-3 text-neutral-700">
              {recipe.purchase_links.map((item, index) => (
                <li
                  key={`${item.ingredient}-${index}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex-1">{item.ingredient}</span>

                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white"
                    >
                      구매하기
                    </a>
                  ) : (
                    <span className="text-sm text-neutral-400">링크 없음</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">
              등록된 구매 연결 재료가 없습니다.
            </p>
          )}

          <p className="text-xs text-neutral-500">
            이 페이지에는 제휴 링크가 포함될 수 있습니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-neutral-900">참고 자료</h2>

          {recipe.references?.length > 0 ? (
            <div className="space-y-3">
              {recipe.references.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all rounded-2xl bg-neutral-100 px-4 py-4 text-base font-semibold text-neutral-900"
                >
                  참고 자료 {index + 1}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500">등록된 참고 자료가 없습니다.</p>
          )}
        </section>

        <div className="space-y-3 pt-2">
          <Link
            href={`/write?id=${recipe.id}`}
            className="flex w-full items-center justify-center rounded-2xl border border-neutral-300 px-5 py-4 text-lg font-bold text-black"
          >
            수정하기
          </Link>

          <Link
            href="/manage"
            className="flex w-full items-center justify-center rounded-2xl bg-black px-5 py-4 text-lg font-bold text-white"
          >
            관리로 돌아가기
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-lg font-bold text-red-600"
          >
            삭제하기
          </button>
        </div>
      </div>
    </main>
  );
}