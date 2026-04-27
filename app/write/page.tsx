"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Ingredient = {
  id: number;
  name: string;
};

type PurchaseLink = {
  ingredient: string;
  url: string;
};

type IngredientInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ingredients: Ingredient[];
};

function IngredientInput({
  value,
  onChange,
  placeholder,
  ingredients,
}: IngredientInputProps) {
  const suggestions =
    value.trim().length > 1
      ? ingredients
          .filter((item) => item.name.includes(value.trim()))
          .slice(0, 5)
      : [];

  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
      />

      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-2 shadow">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item.name);
              }}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-neutral-100"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredIngredients, setRequiredIngredients] = useState<string[]>([""]);
  const [optionalIngredients, setOptionalIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>([
    { ingredient: "", url: "" },
  ]);
  const [references, setReferences] = useState<string[]>([""]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setLoading(false);
    };

    checkLogin();
  }, [router]);

  const fetchIngredients = async () => {
    const { data } = await supabase
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });

    setIngredients((data || []) as Ingredient[]);
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (!editId) return;

    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", editId)
        .single();

      if (error) {
        alert(`레시피 불러오기 실패: ${error.message}`);
        return;
      }

      setTitle(data.title || "");
      setDescription(data.description || "");
      setRequiredIngredients(
        data.required_ingredients?.length ? data.required_ingredients : [""]
      );
      setOptionalIngredients(
        data.optional_ingredients?.length ? data.optional_ingredients : [""]
      );
      setSteps(data.steps?.length ? data.steps : [""]);
      setPurchaseLinks(
        data.purchase_links?.length
          ? data.purchase_links
          : [{ ingredient: "", url: "" }]
      );
      setReferences(data.references?.length ? data.references : [""]);
      setImageUrl(data.image_url || null);
    };

    fetchRecipe();
  }, [editId]);

  const cleanList = (list: string[]) =>
    list.map((item) => item.trim()).filter(Boolean);

  const cleanPurchaseLinks = (list: PurchaseLink[]) =>
    list.filter((item) => item.ingredient.trim() && item.url.trim());

  const allRecipeIngredients = useMemo(() => {
    return Array.from(
      new Set([
        ...cleanList(requiredIngredients),
        ...cleanList(optionalIngredients),
      ])
    );
  }, [requiredIngredients, optionalIngredients]);

  const saveNewIngredients = async (items: string[]) => {
    const cleaned = Array.from(new Set(cleanList(items)));

    for (const name of cleaned) {
      const exists = ingredients.some((item) => item.name === name);

      if (!exists) {
        await supabase.from("ingredients").insert({ name });
      }
    }
  };

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async () => {
    if (!imageFile) return imageUrl;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `public/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("recipe-images")
      .upload(fileName, imageFile);

    if (error) {
      alert(`이미지 업로드 실패: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("레시피 이름을 입력하세요");
      return;
    }

    const required = cleanList(requiredIngredients);
    const optional = cleanList(optionalIngredients);
    const purchaseIngredientNames = purchaseLinks.map((item) => item.ingredient);

    await saveNewIngredients([
      ...required,
      ...optional,
      ...purchaseIngredientNames,
    ]);

    const uploadedImageUrl = await uploadImage();

    const payload = {
      title: title.trim(),
      description: description.trim(),
      required_ingredients: required,
      optional_ingredients: optional,
      steps: cleanList(steps),
      purchase_links: cleanPurchaseLinks(purchaseLinks),
      references: cleanList(references),
      image_url: uploadedImageUrl,
    };

    const { error } = editId
      ? await supabase.from("recipes").update(payload).eq("id", editId)
      : await supabase.from("recipes").insert(payload);

    if (error) {
      alert(`저장 실패: ${error.message}`);
      return;
    }

    alert(editId ? "수정 완료" : "저장 완료");
    router.push("/manage");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100 px-5 py-8">
        <div className="mx-auto max-w-md">
          <p>확인 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-5 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <section>
          <p className="text-sm text-neutral-500">현명한 한끼</p>
          <h1 className="mt-2 text-3xl font-bold text-black">
            {editId ? "레시피 수정" : "레시피 작성"}
          </h1>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="레시피 이름"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="간단 설명"
            className="h-28 w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-4"
          />

          {imageUrl && (
            <img
              src={imageUrl}
              alt="레시피 이미지"
              className="h-48 w-full rounded-2xl object-cover"
            />
          )}
        </section>

        <section className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">필수 재료</h2>

          {requiredIngredients.map((item, index) => (
            <div key={index} className="flex gap-2">
              <IngredientInput
                value={item}
                onChange={(value) =>
                  updateListItem(setRequiredIngredients, index, value)
                }
                placeholder="예: 오트밀"
                ingredients={ingredients}
              />

              <button
                type="button"
                onClick={() => removeListItem(setRequiredIngredients, index)}
                className="rounded-2xl border border-neutral-200 px-4"
              >
                삭제
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setRequiredIngredients((prev) => [...prev, ""])}
            className="w-full rounded-2xl border border-neutral-200 py-4 font-bold"
          >
            추가하기
          </button>
        </section>

        <section className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">선택 재료</h2>

          {optionalIngredients.map((item, index) => (
            <div key={index} className="flex gap-2">
              <IngredientInput
                value={item}
                onChange={(value) =>
                  updateListItem(setOptionalIngredients, index, value)
                }
                placeholder="예: 바나나"
                ingredients={ingredients}
              />

              <button
                type="button"
                onClick={() => removeListItem(setOptionalIngredients, index)}
                className="rounded-2xl border border-neutral-200 px-4"
              >
                삭제
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setOptionalIngredients((prev) => [...prev, ""])}
            className="w-full rounded-2xl border border-neutral-200 py-4 font-bold"
          >
            추가하기
          </button>
        </section>

        <section className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">만드는 법</h2>

          {steps.map((item, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black font-bold text-white">
                {index + 1}
              </div>

              <textarea
                value={item}
                onChange={(e) => updateListItem(setSteps, index, e.target.value)}
                placeholder={`${index + 1}. 만드는 방법을 입력하세요`}
                className="h-24 w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
              />

              <button
                type="button"
                onClick={() => removeListItem(setSteps, index)}
                className="rounded-2xl border border-neutral-200 px-4"
              >
                삭제
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setSteps((prev) => [...prev, ""])}
            className="w-full rounded-2xl border border-neutral-200 py-4 font-bold"
          >
            추가하기
          </button>
        </section>

        <section className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">구매 연결 재료</h2>

          {purchaseLinks.map((item, index) => (
            <div
              key={index}
              className="space-y-2 rounded-2xl border border-neutral-200 p-3"
            >
              <select
                value={item.ingredient}
                onChange={(e) =>
                  setPurchaseLinks((prev) =>
                    prev.map((link, i) =>
                      i === index ? { ...link, ingredient: e.target.value } : link
                    )
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
              >
                <option value="">연결할 재료를 선택하세요</option>
                {allRecipeIngredients.map((ingredient) => (
                  <option key={ingredient} value={ingredient}>
                    {ingredient}
                  </option>
                ))}
              </select>

              <input
                value={item.url}
                onChange={(e) =>
                  setPurchaseLinks((prev) =>
                    prev.map((link, i) =>
                      i === index ? { ...link, url: e.target.value } : link
                    )
                  )
                }
                placeholder="구매 링크"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setPurchaseLinks((prev) => prev.filter((_, i) => i !== index))
                }
                className="w-full rounded-2xl border border-neutral-200 py-3 font-bold"
              >
                이 구매 연결 삭제
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setPurchaseLinks((prev) => [...prev, { ingredient: "", url: "" }])
            }
            className="w-full rounded-2xl border border-neutral-200 py-4 font-bold"
          >
            추가하기
          </button>
        </section>

        <section className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">참고 자료</h2>

          {references.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                onChange={(e) =>
                  updateListItem(setReferences, index, e.target.value)
                }
                placeholder={`참고 자료 링크 ${index + 1}`}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
              />

              <button
                type="button"
                onClick={() => removeListItem(setReferences, index)}
                className="rounded-2xl border border-neutral-200 px-4"
              >
                삭제
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setReferences((prev) => [...prev, ""])}
            className="w-full rounded-2xl border border-neutral-200 py-4 font-bold"
          >
            추가하기
          </button>
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl bg-black px-5 py-5 text-xl font-bold text-white"
        >
          {editId ? "수정 완료" : "저장하기"}
        </button>
      </div>
    </main>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-100 px-5 py-8">
          <div className="mx-auto max-w-md">
            <p>불러오는 중...</p>
          </div>
        </main>
      }
    >
      <WriteContent />
    </Suspense>
  );
}