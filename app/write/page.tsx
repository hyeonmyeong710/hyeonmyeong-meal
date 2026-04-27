"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PurchaseLink = {
  ingredient: string;
  url: string;
};

type RecipeRow = {
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

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [requiredIngredients, setRequiredIngredients] = useState<string[]>([""]);
  const [optionalIngredients, setOptionalIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>([
    { ingredient: "", url: "" },
  ]);
  const [references, setReferences] = useState<string[]>([""]);

  useEffect(() => {
    const loadRecipe = async () => {
      if (!editId) return;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", Number(editId))
        .single();

      if (error || !data) {
        alert("수정할 레시피를 불러오지 못했습니다.");
        return;
      }

      const recipe = data as RecipeRow;

      setTitle(recipe.title || "");
      setDescription(recipe.description || "");
      setImageUrl(recipe.image_url || "");
      setRequiredIngredients(
        recipe.required_ingredients?.length ? recipe.required_ingredients : [""]
      );
      setOptionalIngredients(
        recipe.optional_ingredients?.length ? recipe.optional_ingredients : [""]
      );
      setSteps(recipe.steps?.length ? recipe.steps : [""]);
      setPurchaseLinks(
        recipe.purchase_links?.length
          ? recipe.purchase_links
          : [{ ingredient: "", url: "" }]
      );
      setReferences(recipe.references?.length ? recipe.references : [""]);
    };

    loadRecipe();
  }, [editId]);

  const allIngredientOptions = useMemo(() => {
    const merged = [...requiredIngredients, ...optionalIngredients]
      .map((item) => item.trim())
      .filter(Boolean);

    return Array.from(new Set(merged));
  }, [requiredIngredients, optionalIngredients]);

  const updateListItem = (
    setter: Dispatch<SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addListItem = (setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const removeListItem = (
    setter: Dispatch<SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  const updatePurchaseLink = (
    index: number,
    field: keyof PurchaseLink,
    value: string
  ) => {
    setPurchaseLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addPurchaseLink = () => {
    setPurchaseLinks((prev) => [...prev, { ingredient: "", url: "" }]);
  };

  const removePurchaseLink = (index: number) => {
    setPurchaseLinks((prev) => {
      if (prev.length === 1) return [{ ingredient: "", url: "" }];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("레시피 이름을 입력해주세요.");
      return;
    }

    let finalImageUrl = imageUrl;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert(`이미지 업로드 실패: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);

      finalImageUrl = data.publicUrl;
    }

    const recipe = {
      title: title.trim(),
      description: description.trim(),
      image_url: finalImageUrl,
      required_ingredients: requiredIngredients.map((v) => v.trim()).filter(Boolean),
      optional_ingredients: optionalIngredients.map((v) => v.trim()).filter(Boolean),
      steps: steps.map((v) => v.trim()).filter(Boolean),
      purchase_links: purchaseLinks.filter(
        (item) => item.ingredient.trim() || item.url.trim()
      ),
      references: references.map((v) => v.trim()).filter(Boolean),
    };

    if (editId) {
      const { error } = await supabase
        .from("recipes")
        .update(recipe)
        .eq("id", Number(editId));

      if (error) {
        alert(`수정 실패: ${error.message}`);
        return;
      }

      alert("수정 완료!");
      router.push(`/recipes/${editId}`);
      return;
    }

    const { error } = await supabase.from("recipes").insert([recipe]);

    if (error) {
      alert(`저장 실패: ${error.message}`);
      return;
    }

    alert("저장 완료!");
    router.push("/manage");
  };

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <section>
          <p className="text-sm text-neutral-500">현명한 한끼</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            {editId ? "레시피 수정" : "레시피 작성"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            재료와 만드는 방법을 하나씩 추가하세요
          </p>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">기본 정보</h2>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="레시피 이름"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="레시피 설명"
            className="min-h-[120px] w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
          />

          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-700">
              완성된 요리 사진
            </label>

            {imageUrl && !imageFile && (
              <img
                src={imageUrl}
                alt="레시피 사진"
                className="h-48 w-full rounded-2xl object-cover"
              />
            )}

            {imageFile && (
              <div className="rounded-2xl bg-neutral-100 px-4 py-4 text-sm font-semibold text-neutral-700">
                선택한 사진: {imageFile.name}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setImageFile(e.target.files[0]);
                }
              }}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-sm"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">필수 재료</h2>
            <button
              type="button"
              onClick={() => addListItem(setRequiredIngredients)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              추가하기
            </button>
          </div>

          {requiredIngredients.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                onChange={(e) =>
                  updateListItem(setRequiredIngredients, index, e.target.value)
                }
                placeholder={`필수 재료 ${index + 1}`}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
              />
              <button
                type="button"
                onClick={() => removeListItem(setRequiredIngredients, index)}
                className="rounded-2xl border px-4 text-sm font-semibold"
              >
                삭제
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">선택 재료</h2>
            <button
              type="button"
              onClick={() => addListItem(setOptionalIngredients)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              추가하기
            </button>
          </div>

          {optionalIngredients.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                onChange={(e) =>
                  updateListItem(setOptionalIngredients, index, e.target.value)
                }
                placeholder={`선택 재료 ${index + 1}`}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
              />
              <button
                type="button"
                onClick={() => removeListItem(setOptionalIngredients, index)}
                className="rounded-2xl border px-4 text-sm font-semibold"
              >
                삭제
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">만드는 방법</h2>
            <button
              type="button"
              onClick={() => addListItem(setSteps)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              추가하기
            </button>
          </div>

          {steps.map((item, index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-semibold">{index + 1}. 단계</label>
              <textarea
                value={item}
                onChange={(e) => updateListItem(setSteps, index, e.target.value)}
                placeholder={`${index + 1}. 내용을 입력하세요`}
                className="min-h-[100px] w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
              />
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">구매 연결 재료</h2>
            <button
              type="button"
              onClick={addPurchaseLink}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              추가하기
            </button>
          </div>

          {purchaseLinks.map((item, index) => (
            <div key={index} className="space-y-3 rounded-2xl border p-4">
              <select
                value={item.ingredient}
                onChange={(e) =>
                  updatePurchaseLink(index, "ingredient", e.target.value)
                }
                className="w-full rounded-2xl border px-4 py-4"
              >
                <option value="">재료를 선택하세요</option>
                {allIngredientOptions.map((ingredient) => (
                  <option key={ingredient} value={ingredient}>
                    {ingredient}
                  </option>
                ))}
              </select>

              <input
                value={item.url}
                onChange={(e) => updatePurchaseLink(index, "url", e.target.value)}
                placeholder="구매 링크"
                className="w-full rounded-2xl border px-4 py-4"
              />

              <button
                type="button"
                onClick={() => removePurchaseLink(index)}
                className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold"
              >
                이 구매 연결 삭제
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">참고 자료</h2>
            <button
              type="button"
              onClick={() => addListItem(setReferences)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              추가하기
            </button>
          </div>

          {references.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => updateListItem(setReferences, index, e.target.value)}
                placeholder={`참고 자료 링크 ${index + 1}`}
                className="w-full rounded-2xl border px-4 py-4"
              />
              <button
                type="button"
                onClick={() => removeListItem(setReferences, index)}
                className="rounded-2xl border px-4 text-sm font-semibold"
              >
                삭제
              </button>
            </div>
          ))}
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl bg-black px-4 py-5 text-2xl font-bold text-white"
        >
          {editId ? "수정 완료" : "저장하기"}
        </button>
      </div>
    </main>
  );
}