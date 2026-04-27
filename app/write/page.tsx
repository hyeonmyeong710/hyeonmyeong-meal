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

/* 🔥 핵심: 밖으로 뺌 */
const IngredientInput = ({
  value,
  onChange,
  placeholder,
  ingredients,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ingredients: Ingredient[];
}) => {
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
              onClick={() => onChange(item.name)}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-neutral-100"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function WriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [requiredIngredients, setRequiredIngredients] = useState<string[]>([""]);
  const [optionalIngredients, setOptionalIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>([
    { ingredient: "", url: "" },
  ]);

  useEffect(() => {
    const fetchIngredients = async () => {
      const { data } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");

      setIngredients((data || []) as Ingredient[]);
    };

    fetchIngredients();
  }, []);

  const cleanList = (list: string[]) =>
    list.map((item) => item.trim()).filter(Boolean);

  const allRecipeIngredients = useMemo(() => {
    return Array.from(
      new Set([
        ...cleanList(requiredIngredients),
        ...cleanList(optionalIngredients),
      ])
    );
  }, [requiredIngredients, optionalIngredients]);

  const updateListItem = (
    setter: any,
    index: number,
    value: string
  ) => {
    setter((prev: string[]) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  return (
    <main className="p-5">
      {/* 필수 */}
      <h2>필수 재료</h2>
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
        </div>
      ))}

      {/* 선택 */}
      <h2>선택 재료</h2>
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
        </div>
      ))}

      {/* 만드는 법 */}
      <h2>만드는 법</h2>
      {steps.map((item, index) => (
        <div key={index} className="flex gap-2">
          <div>{index + 1}</div>
          <input
            value={item}
            onChange={(e) =>
              updateListItem(setSteps, index, e.target.value)
            }
          />
        </div>
      ))}

      {/* 구매 재료 */}
      <h2>구매 연결 재료</h2>
      {purchaseLinks.map((item, index) => (
        <select
          key={index}
          value={item.ingredient}
          onChange={(e) =>
            setPurchaseLinks((prev) =>
              prev.map((link, i) =>
                i === index
                  ? { ...link, ingredient: e.target.value }
                  : link
              )
            )
          }
        >
          <option value="">선택</option>
          {allRecipeIngredients.map((ing) => (
            <option key={ing}>{ing}</option>
          ))}
        </select>
      ))}
    </main>
  );
}

export default function WritePage() {
  return (
    <Suspense>
      <WriteContent />
    </Suspense>
  );
}